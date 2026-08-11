"use client";

import {
  ChangeEvent,
  DragEvent,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AccountMenu, type AccountViewer } from "../AccountMenu";
import { trackAnalyticsEvent } from "../AnalyticsTracker";
import { cleanForeground } from "../BackgroundRemover";
import { BrandLogo } from "../BrandLogo";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { useTranslations } from "../../i18n/client";
import type { Translator } from "../../i18n/core";
import { registerModelCacheWorker } from "../lib/model-cache";
import { runBatchPool, selectBatchConcurrency } from "../lib/batch-performance";
import {
  mapRemovalProgress,
  removeBackgroundLocal,
  verifyModelAssets,
} from "../lib/model-runtime";

const ManualMaskEditor = lazy(() =>
  import("../ManualMaskEditor").then((module) => ({
    default: module.ManualMaskEditor,
  })),
);

type ItemStatus = "queued" | "processing" | "done" | "error";

type BatchItem = {
  id: string;
  file: File;
  sourceUrl: string;
  resultUrl?: string;
  resultBlob?: Blob;
  rawBlob?: Blob;
  status: ItemStatus;
  progress: number;
  durationMs?: number;
  error?: string;
};

type RunProgress = {
  completed: number;
  total: number;
  etaSeconds: number | null;
  accelerated: boolean;
  overallPercent: number;
  failed: number;
};

const MAX_BATCH_SIZE = 20;
const MAX_FILE_SIZE = 12 * 1024 * 1024;
const MODEL_ASSET_PATH = "/bg-removal/";
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function outputName(fileName: string, t: Translator) {
  return `${fileName.replace(/\.[^/.]+$/, "") || t("batch.download.defaultName")}${t("batch.download.transparentSuffix")}`;
}

function formatDuration(seconds: number | null, t: Translator) {
  if (seconds === null) return t("batch.duration.estimating");
  if (seconds <= 0) return t("batch.duration.completed");
  if (seconds < 60) {
    return `${t("batch.duration.approx")}${Math.max(1, Math.ceil(seconds))} ${t("batch.duration.seconds")}`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.ceil(seconds % 60);
  return `${t("batch.duration.approx")}${minutes} ${t("batch.duration.minutes")} ${remainder} ${t("batch.duration.seconds")}`;
}

function formatItemDuration(durationMs: number | undefined, t: Translator) {
  if (!durationMs) return "";
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  return seconds < 60
    ? `${seconds} ${t("batch.duration.seconds")}`
    : `${Math.floor(seconds / 60)} ${t("batch.duration.minutes")} ${seconds % 60} ${t("batch.duration.seconds")}`;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeRecord(length: number, writer: (view: DataView) => void) {
  const bytes = new Uint8Array(length);
  writer(new DataView(bytes.buffer));
  return bytes;
}

function copyToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function createZip(
  files: Array<{ name: string; blob: Blob }>,
): Promise<Blob> {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = new Uint8Array(await file.blob.arrayBuffer());
    const checksum = crc32(data);
    const localHeader = makeRecord(30, (view) => {
      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 0x0800, true);
      view.setUint16(8, 0, true);
      view.setUint32(14, checksum, true);
      view.setUint32(18, data.length, true);
      view.setUint32(22, data.length, true);
      view.setUint16(26, name.length, true);
    });
    localParts.push(localHeader, name, data);

    const centralHeader = makeRecord(46, (view) => {
      view.setUint32(0, 0x02014b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 20, true);
      view.setUint16(8, 0x0800, true);
      view.setUint16(10, 0, true);
      view.setUint32(16, checksum, true);
      view.setUint32(20, data.length, true);
      view.setUint32(24, data.length, true);
      view.setUint16(28, name.length, true);
      view.setUint32(42, offset, true);
    });
    centralParts.push(centralHeader, name);
    offset += localHeader.length + name.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = makeRecord(22, (view) => {
    view.setUint32(0, 0x06054b50, true);
    view.setUint16(8, files.length, true);
    view.setUint16(10, files.length, true);
    view.setUint32(12, centralSize, true);
    view.setUint32(16, offset, true);
  });

  const zipParts = [...localParts, ...centralParts, end].map(copyToArrayBuffer);
  return new Blob(zipParts, {
    type: "application/zip",
  });
}

export function BatchRemover({
  viewer,
}: {
  viewer: AccountViewer | null;
}) {
  const { locale, t } = useTranslations();
  const localePrefix = `/${locale}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<BatchItem[]>([]);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState("");
  const [preparingZip, setPreparingZip] = useState(false);
  const [runProgress, setRunProgress] = useState<RunProgress | null>(null);
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    void registerModelCacheWorker().catch((reason: unknown) => {
      console.warn("[model-cache] SERVICE_WORKER_UNAVAILABLE", reason);
    });
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(
    () => () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.sourceUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      }
    },
    [],
  );

  const addFiles = (incoming: File[]) => {
    const remaining = MAX_BATCH_SIZE - itemsRef.current.length;
    if (remaining <= 0) {
      setNotice(t("batch.notices.maxBatch", { max: MAX_BATCH_SIZE }));
      return;
    }

    const valid = incoming
      .filter(
        (file) =>
          ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE,
      )
      .slice(0, remaining);
    const skipped = incoming.length - valid.length;
    const added = valid.map<BatchItem>((file) => ({
      id: crypto.randomUUID(),
      file,
      sourceUrl: URL.createObjectURL(file),
      status: "queued",
      progress: 0,
    }));

    setItems((current) => [...current, ...added]);
    setRunProgress(null);
    setNotice(
      skipped > 0
        ? t("batch.notices.addedSkipped", {
            added: added.length,
            skipped,
          })
        : t("batch.notices.added", { added: added.length }),
    );
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!processing) addFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const updateItem = useCallback((id: string, patch: Partial<BatchItem>) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const isLateProgressUpdate =
          item.status === "done" &&
          patch.status === undefined &&
          patch.progress !== undefined;
        if (isLateProgressUpdate) return item;

        const next = { ...item, ...patch };
        return next.status === "done" ? { ...next, progress: 100 } : next;
      }),
    );
  }, []);

  const processItems = async (targets: BatchItem[]) => {
    if (targets.length === 0 || processing) return;

    setProcessing(true);
    trackAnalyticsEvent("batch_started");
    const deviceNavigator = navigator as Navigator & { deviceMemory?: number };
    const concurrency = selectBatchConcurrency(targets.length, {
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: deviceNavigator.deviceMemory,
      mobile: window.matchMedia("(pointer: coarse)").matches,
    });
    const accelerated = concurrency > 1;
    setRunProgress({
      completed: 0,
      total: targets.length,
      etaSeconds: null,
      accelerated,
      overallPercent: 0,
      failed: 0,
    });
    setNotice(t("batch.notices.modelLoading"));
    try {
      await registerModelCacheWorker();
    } catch (reason) {
      console.warn("[model-cache] SERVICE_WORKER_UNAVAILABLE", reason);
    }
    const publicPath = new URL(MODEL_ASSET_PATH, window.location.href).toString();

    try {
      await verifyModelAssets(publicPath);
      const startedAt = performance.now();
      let finished = 0;
      let failed = 0;

      const processItem = async (item: BatchItem) => {
        const itemStartedAt = performance.now();
        let peakProgress = 4;
        updateItem(item.id, {
          status: "processing",
          progress: 4,
          error: undefined,
        });
        try {
          const raw = await removeBackgroundLocal(item.file, {
            publicPath,
            model: "isnet_quint8",
            output: {
              format: "image/png",
              quality: 1,
            },
            progress: (key: string, current: number, total: number) => {
              const mapped = mapRemovalProgress(key, current, total);
              peakProgress = Math.max(peakProgress, mapped.progress);
              const itemProgress = peakProgress;
              updateItem(item.id, {
                progress: itemProgress,
              });
              const elapsedSeconds = (performance.now() - startedAt) / 1000;
              const completedEquivalent = finished + itemProgress / 100;
              const averageSeconds =
                completedEquivalent > 0
                  ? elapsedSeconds / completedEquivalent
                  : 0;
              setRunProgress({
                completed: finished,
                total: targets.length,
                etaSeconds: Math.max(
                  0,
                  averageSeconds * (targets.length - completedEquivalent),
                ),
                accelerated,
                overallPercent: Math.min(
                  99,
                  Math.round((completedEquivalent / targets.length) * 100),
                ),
                failed,
              });
            },
          });
          updateItem(item.id, { progress: 99 });
          const resultBlob = await cleanForeground(raw, "standard");
          const resultUrl = URL.createObjectURL(resultBlob);
          if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
          updateItem(item.id, {
            resultBlob,
            resultUrl,
            rawBlob: raw,
            status: "done",
            progress: 100,
            durationMs: performance.now() - itemStartedAt,
          });
        } catch (reason) {
          console.error("[batch] ITEM_PROCESSING_FAILED", reason);
          failed += 1;
          updateItem(item.id, {
            status: "error",
            progress: 0,
            durationMs: performance.now() - itemStartedAt,
            error: t("batch.items.error"),
          });
        }
        finished += 1;
        const elapsedSeconds = (performance.now() - startedAt) / 1000;
        const etaSeconds =
          finished > 0
            ? (elapsedSeconds / finished) * (targets.length - finished)
            : null;
        setRunProgress({
          completed: finished,
          total: targets.length,
          etaSeconds,
          accelerated,
          overallPercent: Math.round((finished / targets.length) * 100),
          failed,
        });
      };

      await runBatchPool(targets, concurrency, processItem);
      setRunProgress({
        completed: targets.length,
        total: targets.length,
        etaSeconds: 0,
        accelerated,
        overallPercent: 100,
        failed,
      });
      setNotice(
        failed > 0
          ? t("batch.notices.doneWithFailures", { failed })
          : t("batch.notices.done"),
      );
      trackAnalyticsEvent("batch_completed");
    } catch (reason) {
      console.error("[batch] MODEL_INITIALIZATION_FAILED", reason);
      setNotice(t("batch.notices.modelFail"));
    } finally {
      setProcessing(false);
    }
  };

  const processAll = async () => {
    const pending = itemsRef.current.filter(
      (item) => item.status === "queued" || item.status === "error",
    );
    await processItems(pending);
  };

  const downloadOne = (item: BatchItem) => {
    if (!item.resultUrl) return;
    const anchor = document.createElement("a");
    anchor.href = item.resultUrl;
    anchor.download = outputName(item.file.name, t);
    anchor.click();
    trackAnalyticsEvent("download");
  };

  const downloadZip = async () => {
    const completed = itemsRef.current.filter(
      (item): item is BatchItem & { resultBlob: Blob } =>
        item.status === "done" && Boolean(item.resultBlob),
    );
    if (completed.length === 0) return;
    setPreparingZip(true);
    try {
      const zip = await createZip(
        completed.map((item) => ({
          name: outputName(item.file.name, t),
          blob: item.resultBlob,
        })),
      );
      const url = URL.createObjectURL(zip);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = t("batch.download.zipName", { count: completed.length });
      anchor.click();
      trackAnalyticsEvent("download");
      window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
    } catch (reason) {
      console.error("[batch] ZIP_CREATION_FAILED", reason);
      setNotice(t("batch.notices.zipFail"));
    } finally {
      setPreparingZip(false);
    }
  };

  const removeItem = (id: string) => {
    const target = itemsRef.current.find((item) => item.id === id);
    if (target) {
      URL.revokeObjectURL(target.sourceUrl);
      if (target.resultUrl) URL.revokeObjectURL(target.resultUrl);
    }
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    for (const item of itemsRef.current) {
      URL.revokeObjectURL(item.sourceUrl);
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    }
    setItems([]);
    setNotice("");
    setRunProgress(null);
    setPreviewItemId(null);
    setEditingItemId(null);
  };

  const applyManualEdit = (item: BatchItem, blob: Blob) => {
    if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    const resultUrl = URL.createObjectURL(blob);
    updateItem(item.id, { resultBlob: blob, resultUrl });
    setEditingItemId(null);
  };

  const completedCount = items.filter((item) => item.status === "done").length;
  const pendingCount = items.filter(
    (item) => item.status === "queued" || item.status === "error",
  ).length;
  const previewItem =
    items.find((item) => item.id === previewItemId) ?? null;
  const editingItem =
    items.find((item) => item.id === editingItemId) ?? null;

  return (
    <main className="batch-page">
      <header className="topbar">
        <a className="brand" href={localePrefix} aria-label={t("batch.brand.homeLabel")}>
          <BrandLogo />
          <span>{t("common.brand.name")}</span>
        </a>
        <nav className="nav" aria-label={t("batch.nav.label")}>
          <a href={localePrefix}>{t("batch.nav.single")}</a>
          <a href={`${localePrefix}/pricing`}>{t("batch.nav.pro")}</a>
          <a href={`${localePrefix}/contact`}>{t("batch.nav.contact")}</a>
          <span className="nav-pill">{t("batch.nav.pill")}</span>
        </nav>
        <LanguageSwitcher />
        <AccountMenu viewer={viewer} />
      </header>

      <section className="batch-hero">
        <div>
          <span className="eyebrow">{t("batch.hero.eyebrow")}</span>
          <h1>{t("batch.hero.titleLine1")}<br />{t("batch.hero.titleLine2")}</h1>
          <p>{t("batch.hero.subtitle", { max: MAX_BATCH_SIZE })}</p>
        </div>
        <div className="batch-stats" aria-label={t("batch.stats.label")}>
          <span><strong>{items.length}</strong> {t("batch.stats.selectedLabel")}</span>
          <span><strong>{completedCount}</strong> {t("batch.stats.completedLabel")}</span>
          <span><strong>{pendingCount}</strong> {t("batch.stats.pendingLabel")}</span>
        </div>
      </section>

      <section className="batch-workbench">
        <div
          className={`batch-dropzone ${dragging ? "is-dragging" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!processing) setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) setDragging(false);
          }}
          onDrop={onDrop}
        >
          <div>
            <strong>{t("batch.dropzone.title")}</strong>
            <span>{t("batch.dropzone.hint")}</span>
          </div>
          <button
            className="secondary-button"
            type="button"
            disabled={processing}
            onClick={() => inputRef.current?.click()}
          >
            {t("batch.dropzone.button")}
          </button>
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={onInput}
          />
        </div>

        {notice && <p className="batch-notice" role="status">{notice}</p>}

        {items.length > 0 && (
          <>
            {runProgress && (
              <div className="batch-run-status" role="status">
                <span>
                  {t("batch.progress.batchProgress")}
                  <strong>
                    {runProgress.overallPercent}%
                  </strong>
                </span>
                <span>
                  {t("batch.progress.estimatedRemaining")}
                  <strong>{formatDuration(runProgress.etaSeconds, t)}</strong>
                </span>
                <span>
                  {t("batch.progress.processingMode")}
                  <strong>
                    {runProgress.accelerated
                      ? t("batch.progress.multiThread")
                      : t("batch.progress.stableMode")}
                  </strong>
                </span>
                <div className="batch-overall-progress" aria-hidden="true">
                  <i style={{ width: `${runProgress.overallPercent}%` }} />
                </div>
              </div>
            )}
            <div className="batch-actions">
              <button
                className="primary-button"
                type="button"
                disabled={processing || pendingCount === 0}
                onClick={() => void processAll()}
              >
                {processing && runProgress
                  ? t("batch.progress.processing", {
                      completed: runProgress.completed,
                      total: runProgress.total,
                    })
                  : t("batch.progress.starting", { n: pendingCount })}
              </button>
              <button
                className="secondary-button"
                type="button"
                disabled={processing || completedCount === 0 || preparingZip}
                onClick={() => void downloadZip()}
              >
                {preparingZip
                  ? t("batch.actions.packaging")
                  : t("batch.actions.downloadAllCount", {
                      count: completedCount,
                    })}
              </button>
              <button
                className="batch-clear"
                type="button"
                disabled={processing}
                onClick={clearAll}
              >
                {t("batch.actions.clear")}
              </button>
            </div>

            <div className="batch-grid" aria-label={t("batch.download.gridLabel")}>
              {items.map((item, index) => (
                <article className={`batch-item is-${item.status}`} key={item.id}>
                  <div className="batch-thumb">
                    <img
                      src={item.resultUrl || item.sourceUrl}
                      alt={`${item.file.name} ${
                        item.status === "done"
                          ? t("batch.items.resultAlt")
                          : t("batch.items.sourceAlt")
                      }`}
                    />
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="batch-item-copy">
                    <strong title={item.file.name}>{item.file.name}</strong>
                    <span>
                      {item.status === "queued" && t("batch.items.queued")}
                      {item.status === "processing" &&
                        t("batch.items.processing", { progress: item.progress })}
                      {item.status === "done" &&
                        t("batch.items.done", {
                          duration: formatItemDuration(item.durationMs, t),
                        })}
                      {item.status === "error" && item.error}
                    </span>
                    <div className="batch-progress" aria-hidden="true">
                      <i
                        style={{
                          width: `${item.status === "done" ? 100 : item.progress}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="batch-item-actions">
                    {item.status === "done" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPreviewItemId(item.id)}
                        >
                          {t("batch.items.preview")}
                        </button>
                        <button type="button" onClick={() => downloadOne(item)}>
                          {t("batch.items.download")}
                        </button>
                      </>
                    )}
                    {item.status === "error" && (
                      <button
                        type="button"
                        disabled={processing}
                        onClick={() => void processItems([item])}
                      >
                        {t("batch.items.retry")}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => removeItem(item.id)}
                    >
                      {t("batch.items.remove")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {previewItem?.resultUrl && (
        <div className="batch-preview-backdrop" role="dialog" aria-modal="true">
          <section className="batch-preview-modal">
            <div className="batch-preview-head">
              <div>
                <span className="step-kicker">{t("batch.preview.title")}</span>
                <h2 title={previewItem.file.name}>{previewItem.file.name}</h2>
              </div>
              <button
                type="button"
                aria-label={t("batch.preview.close")}
                onClick={() => setPreviewItemId(null)}
              >
                ×
              </button>
            </div>
            <div className="batch-preview-grid">
              <figure>
                <figcaption>{t("batch.preview.original")}</figcaption>
                <div className="preview-frame">
                  <img
                    src={previewItem.sourceUrl}
                    alt={t("batch.preview.sourceAlt")}
                  />
                </div>
              </figure>
              <figure>
                <figcaption>{t("batch.preview.transparent")}</figcaption>
                <div className="preview-frame checkerboard">
                  <img
                    src={previewItem.resultUrl}
                    alt={t("batch.preview.resultAlt")}
                  />
                </div>
              </figure>
            </div>
            <div className="batch-preview-actions">
              {previewItem.rawBlob && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setEditingItemId(previewItem.id)}
                >
                  {t("batch.preview.manualEdit")}
                </button>
              )}
              <button
                className="primary-button"
                type="button"
                onClick={() => downloadOne(previewItem)}
              >
                {t("batch.preview.downloadPng")}
              </button>
            </div>
          </section>
        </div>
      )}

      {editingItem?.resultUrl && editingItem.rawBlob && (
        <Suspense fallback={null}>
          <ManualMaskEditor
            resultUrl={editingItem.resultUrl}
            resultBlob={editingItem.resultBlob}
            restoreBlob={editingItem.rawBlob}
            onApply={(blob) => applyManualEdit(editingItem, blob)}
            onClose={() => setEditingItemId(null)}
          />
        </Suspense>
      )}
    </main>
  );
}
