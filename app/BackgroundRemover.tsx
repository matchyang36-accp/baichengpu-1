"use client";

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
type Platform = "taobao" | "pinduoduo" | "douyin";

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

const PLATFORM_PRESETS: Array<{
  id: Platform;
  label: string;
  shortLabel: string;
}> = [
  { id: "taobao", label: "淘宝主图", shortLabel: "淘宝" },
  { id: "pinduoduo", label: "拼多多主图", shortLabel: "拼多多" },
  { id: "douyin", label: "抖音小店主图", shortLabel: "抖音小店" },
];

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

    let seedMask = keep;
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

export function BackgroundRemover() {
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
  const [fileName, setFileName] = useState("baichengpu-cutout.png");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("准备图片");
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
  const [platform, setPlatform] = useState<Platform>("taobao");
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
    void registerModelCacheWorker().catch(() => undefined);
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("baichengpu-platform");
    if (saved === "taobao" || saved === "pinduoduo" || saved === "douyin") {
      setPlatform(saved);
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
        console.error(reason);
      } finally {
        setIsRefining(false);
      }
    },
    [],
  );

  const processFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("请选择 JPG、PNG 或 WebP 图片");
        setStage("error");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("图片不能超过 12MB，请压缩后再试");
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
        `${file.name.replace(/\.[^/.]+$/, "") || "product"}-透明底.png`,
      );
      setProgress(4);
      setStatusText("正在加载本地 AI 模型");
      setError("");
      setRequiresReload(false);
      setStage("processing");

      let diagnosticPhase = "manifest";
      try {
        await registerModelCacheWorker().catch(() => undefined);
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
              type: "foreground",
            },
            progress: (key: string, current: number, total: number) => {
              diagnosticPhase = key;
              const next = mapRemovalProgress(key, current, total);
              setProgress((value) => Math.max(value, next.progress));
              setStatusText(next.status);
            },
          }),
          MODEL_INIT_TIMEOUT_MS,
        );
        rawResultRef.current = output;
        setCleanupMode("standard");
        setStatusText("AI 正在净化边缘与背景杂点");
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
      } catch (reason) {
        console.error(reason);
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
            ? "本地 AI 启动超过 2 分钟，浏览器运行环境可能已卡住。请刷新页面后重新处理。"
            : detail.includes("memory") || detail.includes("allocation")
            ? "设备可用内存不足。请关闭其他页面，或换一张尺寸更小的图片后重试。"
            : `本地模型没有加载完成。诊断版本：${DIAGNOSTIC_VERSION}；诊断码：${diagnosticCode}。请点击重试。`,
        );
        setStage("error");
      }
    },
    [clearUrls],
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
  };

  const applyManualEdit = (blob: Blob) => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    const nextResultUrl = URL.createObjectURL(blob);
    resultUrlRef.current = nextResultUrl;
    setResultUrl(nextResultUrl);
    setManualEditorOpen(false);
    void cropTransparentForeground(blob).then((cropped) => {
      if (productUrlRef.current) URL.revokeObjectURL(productUrlRef.current);
      const nextProductUrl = URL.createObjectURL(cropped);
      productUrlRef.current = nextProductUrl;
      setProductUrl(nextProductUrl);
    });
  };

  const selectPlatform = (nextPlatform: Platform) => {
    setPlatform(nextPlatform);
    window.localStorage.setItem("baichengpu-platform", nextPlatform);
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
      const baseName =
        fileName.replace(/-透明底\.png$/i, "") || "product";
      anchor.href = url;
      anchor.download = `${baseName}-${platform}-白底主图.png`;
      anchor.click();
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
    await fetch("/api/quality-feedback", {
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
    }).catch(() => undefined);
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
        <a className="brand" href="#" aria-label="白橙铺首页">
          <span className="brand-mark" aria-hidden="true">
            橙
          </span>
          <span>白橙铺</span>
        </a>
        <nav className="nav" aria-label="主导航">
          <a href="#">首页</a>
          <a href="#how-it-works">使用说明</a>
          <a href="/batch">批量处理</a>
          <a href="/pricing">专业版</a>
          <a href="/contact">联系我们</a>
          <span className="nav-pill">本地 AI · 免费</span>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">AI 智能商品抠图</span>
          <h1>
            商品图，一键<span>干净抠出</span>
          </h1>
          <p>
            上传图片，AI 自动移除背景。本地处理，无需注册，直接下载透明
            PNG。
          </p>
          <div className="trust-row" aria-label="产品特点">
            <span>✓ 浏览器本地处理</span>
            <span>✓ 原图尺寸导出</span>
            <span>✓ 无需注册</span>
          </div>
        </div>

        <div className="workbench">
          <div className="workbench-head">
            <div>
              <span className="step-kicker">在线工具 / 单张抠图</span>
              <h2>上传商品图片</h2>
            </div>
            <span className="privacy-chip">
              <i aria-hidden="true">●</i> 图片不会上传
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
                aria-label="选择商品图片"
              >
                <span className="upload-arrow-icon" aria-hidden="true">
                  <i className="upload-arrow-head" />
                  <i className="upload-arrow-stem" />
                  <i className="upload-arrow-tray" />
                </span>
              </button>
              <h3>拖一张商品图到这里</h3>
              <p>或点击选择、直接粘贴截图</p>
              <button
                className="primary-button"
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                选择商品图片
              </button>
              <small>支持 JPG / PNG / WebP · 最大 12MB</small>
            </div>
          )}

          {stage === "processing" && (
            <div className="processing-panel" aria-live="polite">
              <div className="preview-frame source-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sourceUrl} alt="待处理的商品原图" />
                <div className="scan-line" />
              </div>
              <div className="processing-copy">
                <span className="spinner" aria-hidden="true" />
                <h3>{statusText}</h3>
                <p>
                  {processingSeconds >= 45
                    ? "首次初始化可能需要 1–2 分钟，请继续保持页面打开。"
                    : "请保持页面打开，图片始终留在你的设备上。"}
                </p>
                <div className="progress-track">
                  <span style={{ width: `${progress}%` }} />
                </div>
                <small className="processing-meta">
                  <span>{progress}%</span>
                  <span>
                    已等待{" "}
                    {processingSeconds < 60
                      ? `${processingSeconds} 秒`
                      : `${Math.floor(processingSeconds / 60)} 分 ${processingSeconds % 60} 秒`}
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
                    <span>原图</span>
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
                        alt="商品原图"
                        style={{ transform: imageTransform }}
                      />
                    </div>
                  </figure>
                  <figure>
                    <span className="result-badge">透明底</span>
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
                        alt="已经移除背景的商品图"
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
                  <span className="compare-label compare-label-left">原图</span>
                  <span className="compare-label compare-label-right">
                    透明底
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="compare-result"
                    src={resultUrl}
                    alt="透明背景处理结果"
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
                      alt="用于对比的商品原图"
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
                    aria-label={`原图与透明图对比位置 ${comparePosition}%`}
                    onChange={(event) =>
                      setComparePosition(Number(event.target.value))
                    }
                  />
                </div>
              )}
              <div className="zoom-controls" aria-label="图片缩放控制">
                <span>{zoom > 100 ? "拖动查看细节" : "查看细节"}</span>
                <div>
                  <button
                    type="button"
                    disabled={zoom <= 50}
                    onClick={() => setZoom((value) => Math.max(50, value - 25))}
                    aria-label="缩小图片"
                  >
                    − 缩小
                  </button>
                  <button
                    className="zoom-value"
                    type="button"
                    disabled={zoom === 100}
                    onClick={() => setZoom(100)}
                    aria-label={`当前缩放 ${zoom}%，点击恢复原始比例`}
                  >
                    {zoom}%
                  </button>
                  <button
                    type="button"
                    disabled={zoom >= 500}
                    onClick={() =>
                      setZoom((value) => Math.min(500, value + 25))
                    }
                    aria-label="放大图片"
                  >
                    ＋ 放大
                  </button>
                </div>
                <div className="view-mode-switch" aria-label="图片查看模式">
                  <button
                    type="button"
                    className={comparePanMode ? "is-active" : ""}
                    disabled={zoom <= 100 || viewMode !== "compare"}
                    aria-pressed={comparePanMode}
                    onClick={() => setComparePanMode((value) => !value)}
                  >
                    {comparePanMode ? "正在拖动" : "拖动图片"}
                  </button>
                  <button
                    type="button"
                    className={
                      viewMode === "side-by-side" ? "is-active" : ""
                    }
                    aria-pressed={viewMode === "side-by-side"}
                    onClick={() => setViewMode("side-by-side")}
                  >
                    并排查看
                  </button>
                  <button
                    type="button"
                    className={viewMode === "compare" ? "is-active" : ""}
                    aria-pressed={viewMode === "compare"}
                    onClick={() => setViewMode("compare")}
                  >
                    滑动对比
                  </button>
                </div>
                <button
                  className="quick-download-button"
                  type="button"
                  disabled={isRefining}
                  onClick={download}
                >
                  <span aria-hidden="true">↓</span>
                  下载 PNG
                </button>
              </div>
              <div className="cleanup-controls" aria-label="抠图净化强度">
                <span>边缘净化</span>
                <div className="cleanup-options">
                  {(
                    [
                      ["standard", "标准"],
                      ["strong", "强力去杂"],
                      ["shadow", "保留阴影"],
                    ] as const
                  ).map(([mode, label]) => (
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
                    ? "正在重新净化…"
                    : cleanupMode === "strong"
                      ? "适合复杂纹理与地面杂点"
                      : cleanupMode === "shadow"
                        ? "适合需要自然落地感的商品"
                        : "适合大多数商品图片"}
                </small>
              </div>
              <div className="manual-edit-entry">
                <div>
                  <strong>边缘还有杂点或缺口？</strong>
                  <span>用擦除与恢复画笔做最后修正，支持撤销。</span>
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={isRefining || !rawResultRef.current}
                  onClick={() => setManualEditorOpen(true)}
                >
                  手动修边
                </button>
              </div>

              <section className="product-composer" aria-label="电商白底主图">
                <div className="product-composer-head">
                  <div>
                    <span className="step-kicker">02 / 电商成品图</span>
                    <h3>一键生成平台白底主图</h3>
                  </div>
                  <span>{PRODUCT_CANVAS_SIZE} × {PRODUCT_CANVAS_SIZE}px</span>
                </div>

                <div className="platform-options" aria-label="选择电商平台">
                  {PLATFORM_PRESETS.map((preset) => (
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
                    aria-label="白底主图预览"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={productUrl || resultUrl}
                      alt="商品主图预览"
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
                      <span>背景颜色</span>
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
                              aria-label={`选择背景色 ${color}`}
                              onClick={() => setBackgroundColor(color)}
                            />
                          ),
                        )}
                        <input
                          type="color"
                          value={backgroundColor}
                          aria-label="自定义背景颜色"
                          onChange={(event) =>
                            setBackgroundColor(event.target.value)
                          }
                        />
                      </div>
                    </div>
                    <label>
                      商品大小
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
                      左右位置
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
                      上下位置
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
                      添加自然阴影
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
                  下载透明 PNG
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={isRefining || exportingProduct}
                  onClick={() => void downloadProductImage()}
                >
                  {exportingProduct ? "正在生成…" : "下载白底主图"}
                </button>
                <button className="text-button" type="button" onClick={reset}>
                  再处理一张
                </button>
              </div>
              <section className="quality-feedback" aria-label="抠图质量反馈">
                {feedbackSent ? (
                  <p>谢谢反馈，我们会用它继续优化商品图效果。</p>
                ) : (
                  <>
                    <div>
                      <strong>这张抠图能直接使用吗？</strong>
                      <span>反馈不包含你的图片</span>
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
                        满意
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
                        不满意
                      </button>
                    </div>
                    {feedbackChoice === "unsatisfied" && (
                      <div className="feedback-issues">
                        {["有杂点", "边缘缺失", "阴影错误", "透明物体", "主体识别错误"].map(
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
                          提交问题
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
              <h3>这次没处理成功</h3>
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
                  {requiresReload ? "刷新页面重试" : "重试处理"}
                </button>
                <button className="text-button" type="button" onClick={reset}>
                  重新选择
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

      <section className="proof-strip" id="how-it-works">
        <div>
          <strong>3 步</strong>
          <span>上传 → 自动抠图 → 下载</span>
        </div>
        <div>
          <strong>0 上传</strong>
          <span>处理过程只发生在本地</span>
        </div>
        <div>
          <strong>1 张起</strong>
          <span>先免费验证真实商品图</span>
        </div>
      </section>

      <section className="next-step" id="roadmap">
        <div>
          <span className="eyebrow">接下来要做的事</span>
          <h2>不是多一个工具，是少一堆重复劳动。</h2>
        </div>
        <a className="roadmap-card" href="/batch">
          <span>体验版已开放</span>
          <h3>批量商品白底图</h3>
          <p>一次选择多张商品图，自动排队抠图，完成后打包下载透明 PNG。</p>
        </a>
      </section>

      <footer>
        <span>© 2026 白橙铺</span>
        <div className="footer-links">
          <a href="/pricing">专业版方案</a>
          <a href="/privacy">隐私说明</a>
          <a href="/contact">联系我们</a>
          <button
            type="button"
            onClick={() => {
              void clearModelCache().then(() => {
                setCacheCleared(true);
                window.setTimeout(() => setCacheCleared(false), 2_000);
              });
            }}
          >
            {cacheCleared ? "缓存已清除" : "清除模型缓存"}
          </button>
        </div>
      </footer>
    </main>
  );
}
