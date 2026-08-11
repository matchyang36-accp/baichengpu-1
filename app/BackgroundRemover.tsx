"use client";

import Link from "next/link";

import {
  ChangeEvent,
  DragEvent,
  lazy,
  PointerEvent as ReactPointerEvent,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AccountMenu, type AccountViewer } from "./AccountMenu";
import { trackAnalyticsEvent } from "./AnalyticsTracker";
import { BrandLogo } from "./BrandLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { HomeSeoSections } from "./HomeSeoSections";
import { useTranslations } from "../i18n/client";
import {
  clearModelCache,
  registerModelCacheWorker,
} from "./lib/model-cache";
import {
  mapRemovalProgress,
  removeBackgroundLocal,
  verifyModelAssets,
} from "./lib/model-runtime";

type Stage = "idle" | "processing" | "done" | "error";
type CleanupMode = "standard" | "strong" | "shadow";
type ViewMode = "side-by-side" | "compare";
type Platform = "amazon" | "taobao" | "pinduoduo" | "douyin";

const ManualMaskEditor = lazy(() =>
  import("./ManualMaskEditor").then((module) => ({
    default: module.ManualMaskEditor,
  })),
);

const MAX_FILE_SIZE = 12 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MODEL_ASSET_PATH = "/bg-removal/";
const DIAGNOSTIC_VERSION = "V10";
const MODEL_INIT_TIMEOUT_MS = 120_000;
const PRODUCT_CANVAS_SIZE = 1000;

const PLATFORM_IDS: Platform[] = ["amazon", "taobao", "pinduoduo", "douyin"];

const CLEANUP_PRESETS: Record<
  CleanupMode,
  { core: number; low: number; high: number; gamma: number }
> = {
  standard: { core: 150, low: 18, high: 205, gamma: 0.92 },
  strong: { core: 190, low: 58, high: 176, gamma: 1.08 },
  shadow: { core: 120, low: 5, high: 225, gamma: 0.82 },
};

function smoothStep(edge0: number, edge1: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image-load-failed"));
    image.src = source;
  });
}

async function cropTransparentForeground(blob: Blob) {
  const bitmap = await createImageBitmap(blob);
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = bitmap.width;
  sourceCanvas.height = bitmap.height;
  const sourceContext = sourceCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!sourceContext) throw new Error("crop-canvas-unavailable");
  sourceContext.drawImage(bitmap, 0, 0);
  const pixels = sourceContext.getImageData(
    0,
    0,
    bitmap.width,
    bitmap.height,
  ).data;

  let minX = bitmap.width;
  let minY = bitmap.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < bitmap.height; y += 1) {
    for (let x = 0; x < bitmap.width; x += 1) {
      if (pixels[(y * bitmap.width + x) * 4 + 3] <= 8) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    bitmap.close();
    return blob;
  }

  const subjectWidth = maxX - minX + 1;
  const subjectHeight = maxY - minY + 1;
  const padding = Math.max(4, Math.round(Math.max(subjectWidth, subjectHeight) * 0.025));
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropWidth = Math.min(bitmap.width - cropX, subjectWidth + padding * 2);
  const cropHeight = Math.min(bitmap.height - cropY, subjectHeight + padding * 2);
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;
  const cropContext = cropCanvas.getContext("2d");
  if (!cropContext) throw new Error("crop-export-canvas-unavailable");
  cropContext.drawImage(
    bitmap,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    cropCanvas.toBlob(
      (output) =>
        output
          ? resolve(output)
          : reject(new Error("crop-foreground-export-failed")),
      "image/png",
    );
  });
}

function openBinaryMask(
  source: Uint8Array,
  width: number,
  height: number,
  passes: number,
) {
  let current = source;
  for (let pass = 0; pass < passes; pass += 1) {
    const eroded = new Uint8Array(current.length);
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        let solid = true;
        for (let oy = -1; oy <= 1 && solid; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            if (!current[index + oy * width + ox]) {
              solid = false;
              break;
            }
          }
        }
        if (solid) eroded[index] = 1;
      }
    }

    const dilated = new Uint8Array(current.length);
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        let nearby = false;
        for (let oy = -1; oy <= 1 && !nearby; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            if (eroded[index + oy * width + ox]) {
              nearby = true;
              break;
            }
          }
        }
        if (nearby) dilated[index] = 1;
      }
    }
    current = dilated;
  }
  return current;
}

export async function cleanForeground(
  blob: Blob,
  mode: CleanupMode,
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("canvas-context-unavailable");
  context.drawImage(bitmap, 0, 0);

  const maxAnalysisSide = 640;
  const scale = Math.min(
    1,
    maxAnalysisSide / Math.max(bitmap.width, bitmap.height),
  );
  const analysisWidth = Math.max(1, Math.round(bitmap.width * scale));
  const analysisHeight = Math.max(1, Math.round(bitmap.height * scale));
  const analysisCanvas = document.createElement("canvas");
  analysisCanvas.width = analysisWidth;
  analysisCanvas.height = analysisHeight;
  const analysisContext = analysisCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!analysisContext) throw new Error("analysis-context-unavailable");
  analysisContext.drawImage(bitmap, 0, 0, analysisWidth, analysisHeight);

  const preset = CLEANUP_PRESETS[mode];
  const analysis = analysisContext.getImageData(
    0,
    0,
    analysisWidth,
    analysisHeight,
  );
  const pixelCount = analysisWidth * analysisHeight;
  const labels = new Int32Array(pixelCount);
  labels.fill(-1);
  const components: Array<{
    pixels: number[];
    area: number;
    alphaSum: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    touchesEdge: boolean;
    score: number;
  }> = [];
  const neighbors = [-1, 1, -analysisWidth, analysisWidth];

  for (let start = 0; start < pixelCount; start += 1) {
    if (labels[start] !== -1 || analysis.data[start * 4 + 3] < preset.core) {
      continue;
    }
    const componentIndex = components.length;
    const queue = [start];
    const pixels: number[] = [];
    labels[start] = componentIndex;
    let alphaSum = 0;
    let minX = analysisWidth;
    let minY = analysisHeight;
    let maxX = 0;
    let maxY = 0;

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor];
      pixels.push(index);
      const x = index % analysisWidth;
      const y = Math.floor(index / analysisWidth);
      alphaSum += analysis.data[index * 4 + 3];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      for (const offset of neighbors) {
        const next = index + offset;
        if (next < 0 || next >= pixelCount || labels[next] !== -1) continue;
        if (offset === -1 && x === 0) continue;
        if (offset === 1 && x === analysisWidth - 1) continue;
        if (analysis.data[next * 4 + 3] < preset.core) continue;
        labels[next] = componentIndex;
        queue.push(next);
      }
    }

    const area = pixels.length;
    const boxArea = Math.max(1, (maxX - minX + 1) * (maxY - minY + 1));
    const centerX = (minX + maxX) / 2 / analysisWidth;
    const centerY = (minY + maxY) / 2 / analysisHeight;
    const centerDistance = Math.hypot(centerX - 0.5, centerY - 0.5) / 0.71;
    const centrality = Math.max(0, 1 - centerDistance);
    const meanAlpha = alphaSum / Math.max(1, area) / 255;
    const compactness = area / boxArea;
    const touchesEdge =
      minX === 0 ||
      minY === 0 ||
      maxX === analysisWidth - 1 ||
      maxY === analysisHeight - 1;
    const edgeFactor = touchesEdge ? 0.28 : 1;
    const score =
      area *
      (0.35 + meanAlpha) ** 2 *
      (0.45 + centrality) *
      (0.65 + Math.min(1, compactness * 2)) *
      edgeFactor;
    components.push({
      pixels,
      area,
      alphaSum,
      minX,
      minY,
      maxX,
      maxY,
      touchesEdge,
      score,
    });
  }

  const keep = new Uint8Array(pixelCount);
  if (components.length > 0 && mode !== "shadow") {
    let primaryIndex = 0;
    for (let index = 1; index < components.length; index += 1) {
      if (components[index].score > components[primaryIndex].score) {
        primaryIndex = index;
      }
    }
    const primary = components[primaryIndex];
    const primaryCenterX = (primary.minX + primary.maxX) / 2;
    const primaryCenterY = (primary.minY + primary.maxY) / 2;
    const primaryDiagonal = Math.max(
      1,
      Math.hypot(
        primary.maxX - primary.minX,
        primary.maxY - primary.minY,
      ),
    );
    const selected = new Set<number>([primaryIndex]);

    components.forEach((component, index) => {
      if (index === primaryIndex || component.touchesEdge) return;
      const centerX = (component.minX + component.maxX) / 2;
      const centerY = (component.minY + component.maxY) / 2;
      const distance = Math.hypot(
        centerX - primaryCenterX,
        centerY - primaryCenterY,
      );
      const isMeaningfulPart =
        component.area >= Math.max(12, primary.area * 0.025) &&
        (distance <= primaryDiagonal * 0.9 ||
          component.score >= primary.score * 0.12);
      if (isMeaningfulPart) selected.add(index);
    });

    let seedMask: Uint8Array<ArrayBufferLike> = keep;
    selected.forEach((componentIndex) => {
      for (const index of components[componentIndex].pixels) {
        seedMask[index] = 1;
      }
    });

    if (mode === "strong") {
      const openedMask = openBinaryMask(
        seedMask,
        analysisWidth,
        analysisHeight,
        2,
      );
      if (openedMask.some((value) => value === 1)) {
        seedMask = openedMask;
        keep.fill(0);
        keep.set(seedMask);
      }
    }

    const queue: number[] = [];
    const growth = new Uint16Array(pixelCount);
    const maxGrowth = mode === "strong" ? 5 : 65_000;
    for (let index = 0; index < pixelCount; index += 1) {
      if (keep[index]) {
        queue.push(index);
        growth[index] = 1;
      }
    }

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor];
      if (growth[index] > maxGrowth) continue;
      const x = index % analysisWidth;
      for (const offset of neighbors) {
        const next = index + offset;
        if (next < 0 || next >= pixelCount || keep[next]) continue;
        if (offset === -1 && x === 0) continue;
        if (offset === 1 && x === analysisWidth - 1) continue;
        if (analysis.data[next * 4 + 3] < preset.low) continue;
        keep[next] = 1;
        growth[next] = growth[index] + 1;
        queue.push(next);
      }
    }
  } else {
    keep.fill(1);
  }

  const full = context.getImageData(0, 0, bitmap.width, bitmap.height);
  for (let y = 0; y < bitmap.height; y += 1) {
    const analysisY = Math.min(
      analysisHeight - 1,
      Math.floor(y * analysisHeight / bitmap.height),
    );
    for (let x = 0; x < bitmap.width; x += 1) {
      const analysisX = Math.min(
        analysisWidth - 1,
        Math.floor(x * analysisWidth / bitmap.width),
      );
      const fullIndex = (y * bitmap.width + x) * 4;
      const analysisIndex = analysisY * analysisWidth + analysisX;
      if (!keep[analysisIndex]) {
        full.data[fullIndex + 3] = 0;
        continue;
      }
      const alpha = full.data[fullIndex + 3];
      const refined = smoothStep(preset.low, preset.high, alpha);
      full.data[fullIndex + 3] = Math.round(
        255 * Math.pow(refined, preset.gamma),
      );
    }
  }
  context.putImageData(full, 0, 0);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("png-export-failed")),
      "image/png",
    );
  });
}

function getErrorMessage(reason: unknown) {
  if (reason instanceof Error) {
    return `${reason.name}: ${reason.message}`.slice(0, 500);
  }
  return String(reason).slice(0, 500);
}

function getDiagnosticCode(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("model_init_timeout")) return "MODEL_TIMEOUT";
  if (normalized.includes("failed to fetch")) return "MODEL_FETCH";
  if (normalized.includes("size") && normalized.includes("got")) {
    return "MODEL_SIZE";
  }
  if (normalized.includes("wasm")) return "WASM_INIT";
  if (normalized.includes("session")) return "MODEL_SESSION";
  if (normalized.includes("memory") || normalized.includes("allocation")) {
    return "DEVICE_MEMORY";
  }
  return "MODEL_RUNTIME";
}

function reportClientError(
  code: string,
  message: string,
  phase: string,
  stack: string,
) {
  void fetch("/api/client-error", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      code,
      message,
      phase,
      stack: stack.slice(0, 1200),
      version: DIAGNOSTIC_VERSION,
    }),
    keepalive: true,
  }).catch(() => undefined);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error("MODEL_INIT_TIMEOUT")),
      timeoutMs,
    );
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (reason) => {
        window.clearTimeout(timer);
        reject(reason);
      },
    );
  });
}

export function BackgroundRemover({
  viewer,
}: {
  viewer: AccountViewer | null;
}) {
  const { locale, t } = useTranslations();
  const localePrefix = `/${locale}`;
  const platformPresets = PLATFORM_IDS.map((id) => ({
    id,
    label: t(`tool.platforms.${id}`),
    shortLabel: t(`tool.platforms.${id}Short`),
  }));
  const cleanupLabels: Array<[CleanupMode, string]> = [
    ["standard", t("tool.cleanup.standard")],
    ["strong", t("tool.cleanup.strong")],
    ["shadow", t("tool.cleanup.shadow")],
  ];
  const feedbackIssueOptions = t<string[]>("tool.feedback.issues");
  const inputRef = useRef<HTMLInputElement>(null);
  const retryFileRef = useRef<File | null>(null);
  const rawResultRef = useRef<Blob | null>(null);
  const sourceUrlRef = useRef("");
  const resultUrlRef = useRef("");
  const productUrlRef = useRef("");
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [sourceUrl, setSourceUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [fileName, setFileName] = useState(
    `edit-photo${t("tool.download.transparentSuffix")}`,
  );
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(t("tool.status.preparing"));
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [cleanupMode, setCleanupMode] = useState<CleanupMode>("standard");
  const [isRefining, setIsRefining] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<ViewMode>("side-by-side");
  const [comparePosition, setComparePosition] = useState(50);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [comparePanMode, setComparePanMode] = useState(false);
  const [manualEditorOpen, setManualEditorOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("amazon");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [subjectScale, setSubjectScale] = useState(82);
  const [subjectX, setSubjectX] = useState(0);
  const [subjectY, setSubjectY] = useState(0);
  const [naturalShadow, setNaturalShadow] = useState(true);
  const [exportingProduct, setExportingProduct] = useState(false);
  const [feedbackChoice, setFeedbackChoice] = useState<
    "satisfied" | "unsatisfied" | null
  >(null);
  const [feedbackIssues, setFeedbackIssues] = useState<string[]>([]);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [processingSeconds, setProcessingSeconds] = useState(0);
  const [requiresReload, setRequiresReload] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const clearUrls = useCallback(() => {
    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
      sourceUrlRef.current = "";
    }
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = "";
    }
    if (productUrlRef.current) {
      URL.revokeObjectURL(productUrlRef.current);
      productUrlRef.current = "";
    }
  }, []);

  useEffect(() => () => clearUrls(), [clearUrls]);

  useEffect(() => {
    void registerModelCacheWorker().catch((reason: unknown) => {
      console.warn("[model-cache] SERVICE_WORKER_UNAVAILABLE", reason);
    });
  }, []);

  useEffect(() => {
    const saved =
      window.localStorage.getItem("edit-photo-platform") ??
      window.localStorage.getItem("baichengpu-platform");
    if (PLATFORM_IDS.includes(saved as Platform)) {
      setPlatform(saved as Platform);
    }
  }, []);

  useEffect(() => {
    if (stage !== "processing") {
      setProcessingSeconds(0);
      return;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setProcessingSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (zoom <= 100) {
      setPan({ x: 0, y: 0 });
      setPanning(false);
      setComparePanMode(false);
    }
  }, [zoom]);

  const canPanImages =
    zoom > 100 && (viewMode === "side-by-side" || comparePanMode);

  const startImagePan = (event: ReactPointerEvent<HTMLElement>) => {
    if (!canPanImages) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    panStartRef.current = { x: event.clientX, y: event.clientY };
    setPanning(true);
  };

  const moveImagePan = (event: ReactPointerEvent<HTMLElement>) => {
    const lastPoint = panStartRef.current;
    if (!panning || !lastPoint) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const maxX = (rect.width * (zoom / 100 - 1)) / 2;
    const maxY = (rect.height * (zoom / 100 - 1)) / 2;
    const deltaX = event.clientX - lastPoint.x;
    const deltaY = event.clientY - lastPoint.y;
    panStartRef.current = { x: event.clientX, y: event.clientY };
    setPan((current) => ({
      x: Math.max(-maxX, Math.min(maxX, current.x + deltaX)),
      y: Math.max(-maxY, Math.min(maxY, current.y + deltaY)),
    }));
  };

  const stopImagePan = () => {
    panStartRef.current = null;
    setPanning(false);
  };

  const imageTransform = `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${
    zoom / 100
  })`;

  const reset = () => {
    clearUrls();
    setSourceUrl("");
    setResultUrl("");
    setProductUrl("");
    setStage("idle");
    setProgress(0);
    setError("");
    rawResultRef.current = null;
    setCleanupMode("standard");
    setIsRefining(false);
    setZoom(100);
    setViewMode("side-by-side");
    setComparePosition(50);
    setPan({ x: 0, y: 0 });
    setPanning(false);
    setComparePanMode(false);
    setManualEditorOpen(false);
    setBackgroundColor("#ffffff");
    setSubjectScale(82);
    setSubjectX(0);
    setSubjectY(0);
    setNaturalShadow(true);
    setFeedbackChoice(null);
    setFeedbackIssues([]);
    setFeedbackSent(false);
    setRequiresReload(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const applyCleanupMode = useCallback(
    async (mode: CleanupMode) => {
      const rawResult = rawResultRef.current;
      if (!rawResult) return;
      setCleanupMode(mode);
      setIsRefining(true);
      try {
        const cleaned = await cleanForeground(rawResult, mode);
        if (resultUrlRef.current) {
          URL.revokeObjectURL(resultUrlRef.current);
        }
        const nextResultUrl = URL.createObjectURL(cleaned);
        resultUrlRef.current = nextResultUrl;
        setResultUrl(nextResultUrl);
        const cropped = await cropTransparentForeground(cleaned);
        if (productUrlRef.current) {
          URL.revokeObjectURL(productUrlRef.current);
        }
        const nextProductUrl = URL.createObjectURL(cropped);
        productUrlRef.current = nextProductUrl;
        setProductUrl(nextProductUrl);
      } catch (reason) {
        console.error("[cutout] EDGE_REFINEMENT_FAILED", reason);
      } finally {
        setIsRefining(false);
      }
    },
    [],
  );

  const processFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(t("tool.error.invalidType"));
        setStage("error");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(t("tool.error.tooLarge"));
        setStage("error");
        return;
      }

      clearUrls();
      retryFileRef.current = file;
      const preview = URL.createObjectURL(file);
      sourceUrlRef.current = preview;
      setSourceUrl(preview);
      setResultUrl("");
      setProductUrl("");
      setZoom(100);
      setViewMode("side-by-side");
      setComparePosition(50);
      setManualEditorOpen(false);
      setFeedbackChoice(null);
      setFeedbackIssues([]);
      setFeedbackSent(false);
      setFileName(
        `${file.name.replace(/\.[^/.]+$/, "") || t("tool.download.defaultName")}${t("tool.download.transparentSuffix")}`,
      );
      setProgress(4);
      setStatusText(t("tool.status.loadingModel"));
      setError("");
      setRequiresReload(false);
      setStage("processing");
      trackAnalyticsEvent("cutout_started");

      let diagnosticPhase = "manifest";
      try {
        try {
          await registerModelCacheWorker();
        } catch (reason) {
          console.warn("[model-cache] SERVICE_WORKER_UNAVAILABLE", reason);
        }
        const publicPath = new URL(
          MODEL_ASSET_PATH,
          window.location.href,
        ).toString();
        await verifyModelAssets(publicPath);
        diagnosticPhase = "model-init";
        const output = await withTimeout(
          removeBackgroundLocal(file, {
            publicPath,
            model: "isnet_quint8",
            output: {
              format: "image/png",
              quality: 1,
            },
            progress: (key: string, current: number, total: number) => {
              diagnosticPhase = key;
              const next = mapRemovalProgress(key, current, total);
              setProgress((value) => Math.max(value, next.progress));
              setStatusText(t(next.statusKey));
            },
          }),
          MODEL_INIT_TIMEOUT_MS,
        );
        rawResultRef.current = output;
        setCleanupMode("standard");
        setStatusText(t("tool.status.cleaning"));
        setProgress(99);
        const cleanedOutput = await cleanForeground(output, "standard");
        const outputUrl = URL.createObjectURL(cleanedOutput);
        resultUrlRef.current = outputUrl;
        setResultUrl(outputUrl);
        const croppedOutput = await cropTransparentForeground(cleanedOutput);
        const croppedOutputUrl = URL.createObjectURL(croppedOutput);
        productUrlRef.current = croppedOutputUrl;
        setProductUrl(croppedOutputUrl);
        setProgress(100);
        setStage("done");
        trackAnalyticsEvent("cutout_completed");
      } catch (reason) {
        console.error("[cutout] PROCESSING_FAILED", reason);
        const errorMessage = getErrorMessage(reason);
        const detail = errorMessage.toLowerCase();
        const diagnosticCode = getDiagnosticCode(errorMessage);
        const stack = reason instanceof Error ? reason.stack ?? "" : "";
        const timedOut = detail.includes("model_init_timeout");
        reportClientError(
          diagnosticCode,
          errorMessage,
          diagnosticPhase,
          stack,
        );
        setRequiresReload(timedOut);
        setError(
          timedOut
            ? t("tool.error.timeout")
            : detail.includes("memory") || detail.includes("allocation")
            ? t("tool.error.outOfMemory")
            : t("tool.error.modelNotReady", {
                version: DIAGNOSTIC_VERSION,
                code: diagnosticCode,
              }),
        );
        setStage("error");
      }
    },
    [clearUrls, t],
  );

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const image = Array.from(event.clipboardData?.files ?? []).find((file) =>
        file.type.startsWith("image/"),
      );
      if (image && stage !== "processing") {
        event.preventDefault();
        void processFile(image);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processFile, stage]);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void processFile(file);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && stage !== "processing") void processFile(file);
  };

  const download = () => {
    if (!resultUrl) return;
    const anchor = document.createElement("a");
    anchor.href = resultUrl;
    anchor.download = fileName;
    anchor.click();
    trackAnalyticsEvent("download");
  };

  const applyManualEdit = (blob: Blob) => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    const nextResultUrl = URL.createObjectURL(blob);
    resultUrlRef.current = nextResultUrl;
    setResultUrl(nextResultUrl);
    setManualEditorOpen(false);
    void cropTransparentForeground(blob)
      .then((cropped) => {
        if (productUrlRef.current) URL.revokeObjectURL(productUrlRef.current);
        const nextProductUrl = URL.createObjectURL(cropped);
        productUrlRef.current = nextProductUrl;
        setProductUrl(nextProductUrl);
      })
      .catch((reason: unknown) => {
        console.error("[cutout] PRODUCT_PREVIEW_CROP_FAILED", reason);
      });
  };

  const selectPlatform = (nextPlatform: Platform) => {
    setPlatform(nextPlatform);
    window.localStorage.setItem("edit-photo-platform", nextPlatform);
  };

  const downloadProductImage = async () => {
    const exportSource = productUrl || resultUrl;
    if (!exportSource) return;
    setExportingProduct(true);
    try {
      const image = await loadImage(exportSource);
      const canvas = document.createElement("canvas");
      canvas.width = PRODUCT_CANVAS_SIZE;
      canvas.height = PRODUCT_CANVAS_SIZE;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("product-canvas-unavailable");

      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);

      const maxSide = PRODUCT_CANVAS_SIZE * (subjectScale / 100);
      const imageRatio = image.naturalWidth / image.naturalHeight;
      const drawWidth = imageRatio >= 1 ? maxSide : maxSide * imageRatio;
      const drawHeight = imageRatio >= 1 ? maxSide / imageRatio : maxSide;
      const centerX =
        PRODUCT_CANVAS_SIZE / 2 + (subjectX / 100) * PRODUCT_CANVAS_SIZE;
      const centerY =
        PRODUCT_CANVAS_SIZE / 2 + (subjectY / 100) * PRODUCT_CANVAS_SIZE;
      const drawX = centerX - drawWidth / 2;
      const drawY = centerY - drawHeight / 2;

      if (naturalShadow) {
        context.shadowColor = "rgba(24, 32, 29, 0.28)";
        context.shadowBlur = 24;
        context.shadowOffsetY = 18;
      }
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (output) =>
            output
              ? resolve(output)
              : reject(new Error("product-export-failed")),
          "image/png",
        );
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const transparentSuffix = t("tool.download.transparentSuffix");
      const baseName = fileName.endsWith(transparentSuffix)
        ? fileName.slice(0, -transparentSuffix.length)
        : fileName.replace(/\.png$/i, "");
      anchor.href = url;
      anchor.download = `${baseName}-${platform}${t("tool.download.whiteSuffix")}`;
      anchor.click();
      trackAnalyticsEvent("download");
      window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
    } finally {
      setExportingProduct(false);
    }
  };

  const sendQualityFeedback = async (
    rating: "satisfied" | "unsatisfied",
    issues: string[],
  ) => {
    setFeedbackChoice(rating);
    if (rating === "satisfied") setFeedbackSent(true);
    try {
      const response = await fetch("/api/quality-feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rating,
          issues,
          cleanupMode,
          platform,
          version: DIAGNOSTIC_VERSION,
        }),
        keepalive: true,
      });
      if (!response.ok) throw new Error(`quality-feedback-${response.status}`);
    } catch (reason) {
      console.warn("[quality-feedback] SUBMISSION_FAILED", reason);
    }
  };

  const toggleFeedbackIssue = (issue: string) => {
    setFeedbackIssues((current) =>
      current.includes(issue)
        ? current.filter((item) => item !== issue)
        : [...current, issue],
    );
  };

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href={localePrefix} aria-label={t("tool.brand.homeLabel")}>
          <BrandLogo />
          <span>{t("tool.brand.name")}</span>
        </a>
        <nav className="nav" aria-label={t("common.nav.label")}>
          <a href={localePrefix}>{t("tool.nav.home")}</a>
          <a href="#how-it-works">{t("tool.nav.howItWorks")}</a>
          <a href={`${localePrefix}/batch`}>{t("tool.nav.batch")}</a>
          <a href={`${localePrefix}/pricing`}>{t("tool.nav.pro")}</a>
          <a href={`${localePrefix}/contact`}>{t("tool.nav.contact")}</a>
          <span className="nav-pill">{t("tool.nav.pill")}</span>
        </nav>
        <LanguageSwitcher />
        <AccountMenu viewer={viewer} />
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">{t("tool.hero.eyebrow")}</span>
          <h1>
            {t("tool.hero.titlePrefix")}
            <span>{t("tool.hero.titleHighlight")}</span>
          </h1>
          <p>
            {t("tool.hero.descPrefix")}
            <strong>{t("tool.hero.descHighlight")}</strong>
            {t("tool.hero.descSuffix")}
          </p>
          <div className="trust-row" aria-label={t("common.trust.label")}>
            <span>{t("tool.trust.local")}</span>
            <span>{t("tool.trust.originalSize")}</span>
            <span>{t("tool.trust.noReg")}</span>
          </div>
        </div>

        <div className="workbench">
          <div className="workbench-head">
            <div>
              <span className="step-kicker">{t("tool.upload.stepKicker")}</span>
              <h2>{t("tool.upload.title")}</h2>
            </div>
            <span className="privacy-chip">
              <i aria-hidden="true">●</i> {t("tool.upload.privacyNote")}
            </span>
          </div>

          {stage === "idle" && (
            <div
              className={`dropzone ${dragging ? "is-dragging" : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <button
                className="upload-orb"
                type="button"
                onClick={() => inputRef.current?.click()}
                aria-label={t("tool.upload.selectLabel")}
              >
                <span className="upload-arrow-icon" aria-hidden="true">
                  <i className="upload-arrow-head" />
                  <i className="upload-arrow-stem" />
                  <i className="upload-arrow-tray" />
                </span>
              </button>
              <h3>{t("tool.upload.dropTitle")}</h3>
              <p>{t("tool.upload.dropHint")}</p>
              <button
                className="primary-button"
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                {t("tool.upload.select")}
              </button>
              <small>{t("tool.upload.formatHint")}</small>
            </div>
          )}

          {stage === "processing" && (
            <div className="processing-panel" aria-live="polite">
              <div className="preview-frame source-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sourceUrl} alt={t("tool.upload.originalAlt")} />
                <div className="scan-line" />
              </div>
              <div className="processing-copy">
                <span className="spinner" aria-hidden="true" />
                <h3>{statusText}</h3>
                <p>
                  {processingSeconds >= 45
                    ? t("tool.status.firstInitHint")
                    : t("tool.status.processingHint")}
                </p>
                <div className="progress-track">
                  <span style={{ width: `${progress}%` }} />
                </div>
                <small className="processing-meta">
                  <span>{progress}%</span>
                  <span>
                    {t("tool.status.elapsed")} {" "}
                    {processingSeconds < 60
                      ? `${processingSeconds} ${t("tool.status.seconds")}`
                      : `${Math.floor(processingSeconds / 60)} ${t("tool.status.minutes")} ${processingSeconds % 60} ${t("tool.status.secondsUnit")}`}
                  </span>
                </small>
              </div>
            </div>
          )}

          {stage === "done" && (
            <div className="result-panel" aria-live="polite">
              {viewMode === "side-by-side" ? (
                <div className="result-grid">
                  <figure>
                    <span>{t("tool.result.original")}</span>
                    <div
                      className={`preview-frame image-pan-stage ${
                        zoom > 100 ? "is-pannable" : ""
                      } ${panning ? "is-panning" : ""}`}
                      onPointerDown={startImagePan}
                      onPointerMove={moveImagePan}
                      onPointerUp={stopImagePan}
                      onPointerCancel={stopImagePan}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sourceUrl}
                        alt={t("tool.result.originalAlt")}
                        style={{ transform: imageTransform }}
                      />
                    </div>
                  </figure>
                  <figure>
                    <span className="result-badge">{t("tool.result.transparent")}</span>
                    <div
                      className={`preview-frame checkerboard image-pan-stage ${
                        zoom > 100 ? "is-pannable" : ""
                      } ${panning ? "is-panning" : ""}`}
                      onPointerDown={startImagePan}
                      onPointerMove={moveImagePan}
                      onPointerUp={stopImagePan}
                      onPointerCancel={stopImagePan}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resultUrl}
                        alt={t("tool.result.removedBgAlt")}
                        style={{ transform: imageTransform }}
                      />
                    </div>
                  </figure>
                </div>
              ) : (
                <div
                  className={`compare-stage checkerboard image-pan-stage ${
                    canPanImages ? "is-pannable" : ""
                  } ${panning ? "is-panning" : ""}`}
                  onPointerDown={startImagePan}
                  onPointerMove={moveImagePan}
                  onPointerUp={stopImagePan}
                  onPointerCancel={stopImagePan}
                >
                  <span className="compare-label compare-label-left">
                    {t("tool.result.original")}
                  </span>
                  <span className="compare-label compare-label-right">
                    {t("tool.result.transparent")}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="compare-result"
                    src={resultUrl}
                    alt={t("tool.result.transparentAlt")}
                    style={{ transform: imageTransform }}
                  />
                  <div
                    className="compare-original"
                    style={{
                      clipPath: `inset(0 ${100 - comparePosition}% 0 0)`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sourceUrl}
                      alt={t("tool.result.compareAlt")}
                      style={{ transform: imageTransform }}
                    />
                  </div>
                  <div
                    className="compare-divider"
                    style={{ left: `${comparePosition}%` }}
                    aria-hidden="true"
                  >
                    <span>↔</span>
                  </div>
                  <input
                    className={`compare-range ${
                      comparePanMode ? "is-pan-disabled" : ""
                    }`}
                    type="range"
                    min="0"
                    max="100"
                    value={comparePosition}
                    disabled={comparePanMode}
                    aria-label={t("tool.result.compareSliderLabel", {
                      position: comparePosition,
                    })}
                    onChange={(event) =>
                      setComparePosition(Number(event.target.value))
                    }
                  />
                </div>
              )}
              <div
                className="zoom-controls"
                aria-label={t("tool.view.zoomControlsLabel")}
              >
                <span>
                  {zoom > 100
                    ? t("tool.view.zoomDragHint")
                    : t("tool.view.zoomHint")}
                </span>
                <div>
                  <button
                    type="button"
                    disabled={zoom <= 50}
                    onClick={() => setZoom((value) => Math.max(50, value - 25))}
                    aria-label={t("common.actions.zoomOut")}
                  >
                    {t("tool.view.zoomOut")}
                  </button>
                  <button
                    className="zoom-value"
                    type="button"
                    disabled={zoom === 100}
                    onClick={() => setZoom(100)}
                    aria-label={t("tool.view.currentZoom", { zoom })}
                  >
                    {zoom}%
                  </button>
                  <button
                    type="button"
                    disabled={zoom >= 500}
                    onClick={() =>
                      setZoom((value) => Math.min(500, value + 25))
                    }
                    aria-label={t("common.actions.zoomIn")}
                  >
                    {t("tool.view.zoomIn")}
                  </button>
                </div>
                <div
                  className="view-mode-switch"
                  aria-label={t("tool.view.viewModeLabel")}
                >
                  <button
                    type="button"
                    className={comparePanMode ? "is-active" : ""}
                    disabled={zoom <= 100 || viewMode !== "compare"}
                    aria-pressed={comparePanMode}
                    onClick={() => setComparePanMode((value) => !value)}
                  >
                    {comparePanMode
                      ? t("tool.view.dragging")
                      : t("tool.view.drag")}
                  </button>
                  <button
                    type="button"
                    className={
                      viewMode === "side-by-side" ? "is-active" : ""
                    }
                    aria-pressed={viewMode === "side-by-side"}
                    onClick={() => setViewMode("side-by-side")}
                  >
                    {t("tool.view.sideBySide")}
                  </button>
                  <button
                    type="button"
                    className={viewMode === "compare" ? "is-active" : ""}
                    aria-pressed={viewMode === "compare"}
                    onClick={() => setViewMode("compare")}
                  >
                    {t("tool.view.compare")}
                  </button>
                </div>
                <button
                  className="quick-download-button"
                  type="button"
                  disabled={isRefining}
                  onClick={download}
                >
                  <span aria-hidden="true">↓</span>
                  {t("tool.result.downloadPng")}
                </button>
              </div>
              <div
                className="cleanup-controls"
                aria-label={t("tool.cleanup.controlsLabel")}
              >
                <span>{t("tool.cleanup.label")}</span>
                <div className="cleanup-options">
                  {cleanupLabels.map(([mode, label]) => (
                    <button
                      key={mode}
                      className={cleanupMode === mode ? "is-active" : ""}
                      type="button"
                      disabled={isRefining}
                      aria-pressed={cleanupMode === mode}
                      onClick={() => void applyCleanupMode(mode)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <small>
                  {isRefining
                    ? t("tool.cleanup.reprocessing")
                    : cleanupMode === "strong"
                      ? t("tool.cleanup.strongHint")
                      : cleanupMode === "shadow"
                        ? t("tool.cleanup.shadowHint")
                        : t("tool.cleanup.standardHint")}
                </small>
              </div>
              <div className="manual-edit-entry">
                <div>
                  <strong>{t("tool.cleanup.manualHint")}</strong>
                  <span>{t("tool.cleanup.manualDesc")}</span>
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={isRefining || !rawResultRef.current}
                  onClick={() => setManualEditorOpen(true)}
                >
                  {t("tool.cleanup.manualButton")}
                </button>
              </div>

              <section
                className="product-composer"
                aria-label={t("tool.product.composerLabel")}
              >
                <div className="product-composer-head">
                  <div>
                    <span className="step-kicker">{t("tool.product.stepKicker")}</span>
                    <h3>{t("tool.product.title")}</h3>
                  </div>
                  <span>{PRODUCT_CANVAS_SIZE} × {PRODUCT_CANVAS_SIZE}px</span>
                </div>

                <div
                  className="platform-options"
                  aria-label={t("tool.product.platformLabel")}
                >
                  {platformPresets.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      className={platform === preset.id ? "is-active" : ""}
                      aria-pressed={platform === preset.id}
                      onClick={() => selectPlatform(preset.id)}
                    >
                      <strong>{preset.shortLabel}</strong>
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>

                <div className="product-composer-body">
                  <div
                    className="product-canvas"
                    style={{ backgroundColor }}
                    aria-label={t("tool.product.previewLabel")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={productUrl || resultUrl}
                      alt={t("tool.product.previewAlt")}
                      style={{
                        width: `${subjectScale}%`,
                        height: `${subjectScale}%`,
                        transform: `translate(${subjectX}%, ${subjectY}%)`,
                        filter: naturalShadow
                          ? "drop-shadow(0 10px 9px rgba(24, 32, 29, 0.25))"
                          : "none",
                      }}
                    />
                  </div>
                  <div className="product-controls">
                    <div>
                      <span>{t("tool.product.bgColor")}</span>
                      <div className="color-options">
                        {["#ffffff", "#f6f3ec", "#eef7f2", "#fff1eb"].map(
                          (color) => (
                            <button
                              type="button"
                              key={color}
                              className={
                                backgroundColor === color ? "is-active" : ""
                              }
                              style={{ backgroundColor: color }}
                              aria-label={t("tool.product.selectColorLabel", { color })}
                              onClick={() => setBackgroundColor(color)}
                            />
                          ),
                        )}
                        <input
                          type="color"
                          value={backgroundColor}
                          aria-label={t("tool.product.customColorLabel")}
                          onChange={(event) =>
                            setBackgroundColor(event.target.value)
                          }
                        />
                      </div>
                    </div>
                    <label>
                      {t("tool.product.size")}
                      <input
                        type="range"
                        min="55"
                        max="105"
                        value={subjectScale}
                        onChange={(event) =>
                          setSubjectScale(Number(event.target.value))
                        }
                      />
                      <strong>{subjectScale}%</strong>
                    </label>
                    <label>
                      {t("tool.product.posX")}
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={subjectX}
                        onChange={(event) =>
                          setSubjectX(Number(event.target.value))
                        }
                      />
                      <strong>{subjectX}</strong>
                    </label>
                    <label>
                      {t("tool.product.posY")}
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={subjectY}
                        onChange={(event) =>
                          setSubjectY(Number(event.target.value))
                        }
                      />
                      <strong>{subjectY}</strong>
                    </label>
                    <label className="shadow-toggle">
                      <input
                        type="checkbox"
                        checked={naturalShadow}
                        onChange={(event) =>
                          setNaturalShadow(event.target.checked)
                        }
                      />
                      {t("tool.product.shadow")}
                    </label>
                  </div>
                </div>
              </section>
              <div className="result-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={download}
                  disabled={isRefining}
                >
                  {t("tool.product.downloadTransparent")}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={isRefining || exportingProduct}
                  onClick={() => void downloadProductImage()}
                >
                  {exportingProduct
                    ? t("tool.product.generating")
                    : t("tool.product.downloadWhite")}
                </button>
                <button className="text-button" type="button" onClick={reset}>
                  {t("tool.product.again")}
                </button>
              </div>
              <section
                className="quality-feedback"
                aria-label={t("tool.feedback.label")}
              >
                {feedbackSent ? (
                  <p>{t("tool.feedback.thanks")}</p>
                ) : (
                  <>
                    <div>
                      <strong>{t("tool.feedback.title")}</strong>
                      <span>{t("tool.feedback.hint")}</span>
                    </div>
                    <div className="quality-feedback-actions">
                      <button
                        type="button"
                        className={
                          feedbackChoice === "satisfied" ? "is-active" : ""
                        }
                        onClick={() =>
                          void sendQualityFeedback("satisfied", [])
                        }
                      >
                        {t("tool.feedback.satisfied")}
                      </button>
                      <button
                        type="button"
                        className={
                          feedbackChoice === "unsatisfied" ? "is-active" : ""
                        }
                        onClick={() => {
                          setFeedbackChoice("unsatisfied");
                          setFeedbackSent(false);
                        }}
                      >
                        {t("tool.feedback.unsatisfied")}
                      </button>
                    </div>
                    {feedbackChoice === "unsatisfied" && (
                      <div className="feedback-issues">
                        {feedbackIssueOptions.map(
                          (issue) => (
                            <button
                              type="button"
                              key={issue}
                              className={
                                feedbackIssues.includes(issue)
                                  ? "is-active"
                                  : ""
                              }
                              onClick={() => toggleFeedbackIssue(issue)}
                            >
                              {issue}
                            </button>
                          ),
                        )}
                        <button
                          className="feedback-submit"
                          type="button"
                          disabled={feedbackIssues.length === 0}
                          onClick={() => {
                            setFeedbackSent(true);
                            void sendQualityFeedback(
                              "unsatisfied",
                              feedbackIssues,
                            );
                          }}
                        >
                          {t("tool.feedback.submit")}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          )}

          {stage === "error" && (
            <div className="error-panel" role="alert">
              <span aria-hidden="true">!</span>
              <h3>{t("tool.error.title")}</h3>
              <p>{error}</p>
              <div className="result-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => {
                    if (requiresReload) {
                      window.location.reload();
                    } else if (retryFileRef.current) {
                      void processFile(retryFileRef.current);
                    }
                  }}
                >
                  {requiresReload
                    ? t("tool.error.reload")
                    : t("tool.error.retry")}
                </button>
                <button className="text-button" type="button" onClick={reset}>
                  {t("tool.error.select")}
                </button>
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
          />
        </div>
      </section>

      {manualEditorOpen && resultUrl && rawResultRef.current && (
        <Suspense fallback={null}>
          <ManualMaskEditor
            resultUrl={resultUrl}
            restoreBlob={rawResultRef.current}
            onApply={applyManualEdit}
            onClose={() => setManualEditorOpen(false)}
          />
        </Suspense>
      )}

      <section
        className="proof-strip"
        id="how-it-works"
        aria-label={t("tool.steps.label")}
      >
        <div>
          <strong>{t("tool.steps.step1Title")}</strong>
          <span>{t("tool.steps.step1Desc")}</span>
        </div>
        <div>
          <strong>{t("tool.steps.step2Title")}</strong>
          <span>{t("tool.steps.step2Desc")}</span>
        </div>
        <div>
          <strong>{t("tool.steps.step3Title")}</strong>
          <span>{t("tool.steps.step3Desc")}</span>
        </div>
      </section>

      <section className="next-step" id="roadmap">
        <div>
          <span className="eyebrow">{t("tool.cta.eyebrow")}</span>
          <h2>{t("tool.cta.title")}</h2>
        </div>
        <a className="roadmap-card" href={`${localePrefix}/batch`}>
          <span>{t("tool.cta.batchBadge")}</span>
          <h3>{t("tool.cta.batchTitle")}</h3>
          <p>{t("tool.cta.batchDesc")}</p>
        </a>
      </section>

      <HomeSeoSections locale={locale} />

      <footer>
        <div className="footer-identity">
          <span>{t("tool.footer.copyright")}</span>
          <Link
            className="footer-admin-link"
            href="/admin/login?return_to=%2Fadmin"
          >
            {t("admin.login.title")}
          </Link>
        </div>
        <div className="footer-links">
          <a href={`${localePrefix}/blog`}>{t("tool.footer.guide")}</a>
          <a href={`${localePrefix}/pricing`}>{t("tool.footer.pricing")}</a>
          <a href={`${localePrefix}/privacy`}>{t("tool.footer.privacy")}</a>
          <a href={`${localePrefix}/disclaimer`}>{t("tool.footer.disclaimer")}</a>
          <a href={`${localePrefix}/contact`}>{t("tool.footer.contact")}</a>
          <button
            type="button"
            onClick={() => {
              void clearModelCache()
                .then(() => {
                  setCacheCleared(true);
                  window.setTimeout(() => setCacheCleared(false), 2_000);
                })
                .catch((reason: unknown) => {
                  console.warn("[model-cache] CLEAR_FAILED", reason);
                });
            }}
          >
            {cacheCleared
              ? t("tool.footer.cacheCleared")
              : t("tool.footer.clearCache")}
          </button>
        </div>
      </footer>
    </main>
  );
}
