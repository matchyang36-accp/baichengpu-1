"use client";

import { removeBackground } from "@imgly/background-removal";
import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { cleanForeground, verifyModelAssets } from "../BackgroundRemover";

type ItemStatus = "queued" | "processing" | "done" | "error";

type BatchItem = {
  id: string;
  file: File;
  sourceUrl: string;
  resultUrl?: string;
  resultBlob?: Blob;
  status: ItemStatus;
  progress: number;
  error?: string;
};

const MAX_BATCH_SIZE = 20;
const MAX_FILE_SIZE = 12 * 1024 * 1024;
const MODEL_ASSET_PATH = "/bg-removal/";
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function outputName(fileName: string) {
  return `${fileName.replace(/\.[^/.]+$/, "") || "product"}-透明底.png`;
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

  return new Blob([...localParts, ...centralParts, end], {
    type: "application/zip",
  });
}

export function BatchRemover() {
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<BatchItem[]>([]);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState("");
  const [preparingZip, setPreparingZip] = useState(false);

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
      setNotice(`体验版每批最多 ${MAX_BATCH_SIZE} 张，请先处理或清空当前任务。`);
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
    setNotice(
      skipped > 0
        ? `已加入 ${added.length} 张，另有 ${skipped} 张因格式、大小或数量限制被跳过。`
        : `已加入 ${added.length} 张图片。`,
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

  const updateItem = (id: string, patch: Partial<BatchItem>) => {
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
  };

  const processAll = async () => {
    const pending = itemsRef.current.filter(
      (item) => item.status === "queued" || item.status === "error",
    );
    if (pending.length === 0) return;

    setProcessing(true);
    setNotice("正在准备本地 AI 模型，首次使用可能需要一些时间。");
    const publicPath = new URL(MODEL_ASSET_PATH, window.location.href).toString();

    try {
      await verifyModelAssets(publicPath);
      for (const item of pending) {
        updateItem(item.id, {
          status: "processing",
          progress: 4,
          error: undefined,
        });
        try {
          const raw = await removeBackground(item.file, {
            publicPath,
            model: "isnet_quint8",
            output: {
              format: "image/png",
              quality: 1,
              type: "foreground",
            },
            progress: (_key: string, current: number, total: number) => {
              const ratio = total > 0 ? current / total : 0;
              updateItem(item.id, {
                progress: Math.round(Math.max(6, Math.min(82, ratio * 82))),
              });
            },
          });
          updateItem(item.id, { progress: 88 });
          const resultBlob = await cleanForeground(raw, "standard");
          const resultUrl = URL.createObjectURL(resultBlob);
          if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
          updateItem(item.id, {
            resultBlob,
            resultUrl,
            status: "done",
            progress: 100,
          });
        } catch (reason) {
          console.error(reason);
          updateItem(item.id, {
            status: "error",
            progress: 0,
            error: "处理失败，可稍后重试",
          });
        }
      }
      setNotice("本批次处理完成，可逐张预览或打包下载。");
    } catch (reason) {
      console.error(reason);
      setNotice("本地模型没有加载完成，请检查网络后重试。");
    } finally {
      setProcessing(false);
    }
  };

  const downloadOne = (item: BatchItem) => {
    if (!item.resultUrl) return;
    const anchor = document.createElement("a");
    anchor.href = item.resultUrl;
    anchor.download = outputName(item.file.name);
    anchor.click();
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
          name: outputName(item.file.name),
          blob: item.resultBlob,
        })),
      );
      const url = URL.createObjectURL(zip);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `白橙铺-批量抠图-${completed.length}张.zip`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
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
  };

  const completedCount = items.filter((item) => item.status === "done").length;
  const pendingCount = items.filter(
    (item) => item.status === "queued" || item.status === "error",
  ).length;

  return (
    <main className="batch-page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="返回白橙铺首页">
          <span className="brand-mark" aria-hidden="true">
            橙
          </span>
          <span>白橙铺</span>
        </a>
        <nav className="nav" aria-label="批量版导航">
          <a href="/">单张抠图</a>
          <a href="/contact">联系我们</a>
          <span className="nav-pill">批量体验版</span>
        </nav>
      </header>

      <section className="batch-hero">
        <div>
          <span className="eyebrow">02 / 批量工作台</span>
          <h1>多张商品图，<br />排队一次抠完。</h1>
          <p>一次选择最多 20 张，AI 在浏览器内逐张处理，图片不会上传。</p>
        </div>
        <div className="batch-stats" aria-label="批量任务状态">
          <span><strong>{items.length}</strong> 已选择</span>
          <span><strong>{completedCount}</strong> 已完成</span>
          <span><strong>{pendingCount}</strong> 待处理</span>
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
            <strong>把多张商品图拖到这里</strong>
            <span>支持 JPG / PNG / WebP · 单张最大 12MB</span>
          </div>
          <button
            className="secondary-button"
            type="button"
            disabled={processing}
            onClick={() => inputRef.current?.click()}
          >
            选择多张图片
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
            <div className="batch-actions">
              <button
                className="primary-button"
                type="button"
                disabled={processing || pendingCount === 0}
                onClick={() => void processAll()}
              >
                {processing ? "正在逐张处理…" : `开始处理 ${pendingCount} 张`}
              </button>
              <button
                className="secondary-button"
                type="button"
                disabled={processing || completedCount === 0 || preparingZip}
                onClick={() => void downloadZip()}
              >
                {preparingZip ? "正在打包…" : `打包下载 ${completedCount} 张`}
              </button>
              <button
                className="batch-clear"
                type="button"
                disabled={processing}
                onClick={clearAll}
              >
                清空任务
              </button>
            </div>

            <div className="batch-grid" aria-label="批量图片任务">
              {items.map((item, index) => (
                <article className={`batch-item is-${item.status}`} key={item.id}>
                  <div className="batch-thumb">
                    <img
                      src={item.resultUrl || item.sourceUrl}
                      alt={`${item.file.name} ${item.status === "done" ? "抠图结果" : "原图"}`}
                    />
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="batch-item-copy">
                    <strong title={item.file.name}>{item.file.name}</strong>
                    <span>
                      {item.status === "queued" && "等待处理"}
                      {item.status === "processing" && `处理中 ${item.progress}%`}
                      {item.status === "done" && "处理完成"}
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
                      <button type="button" onClick={() => downloadOne(item)}>
                        下载
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => removeItem(item.id)}
                    >
                      移除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
