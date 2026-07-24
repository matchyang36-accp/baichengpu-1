"use client";

import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Stage = "idle" | "processing" | "done" | "error";

const MAX_FILE_SIZE = 12 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MODEL_ASSET_PATH = "/bg-removal/";
const DIAGNOSTIC_VERSION = "V6";

function getErrorMessage(reason: unknown) {
  if (reason instanceof Error) {
    return `${reason.name}: ${reason.message}`.slice(0, 500);
  }
  return String(reason).slice(0, 500);
}

function getDiagnosticCode(message: string) {
  const normalized = message.toLowerCase();
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

async function verifyModelAssets(publicPath: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(`${publicPath}resources.json`, {
        cache: "force-cache",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`model-manifest-${response.status}`);
      }
      return;
    } catch (reason) {
      lastError = reason;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("model-assets-unavailable");
}

export function BackgroundRemover() {
  const inputRef = useRef<HTMLInputElement>(null);
  const retryFileRef = useRef<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [sourceUrl, setSourceUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [fileName, setFileName] = useState("baichengpu-cutout.png");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("准备图片");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const clearUrls = useCallback(() => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [resultUrl, sourceUrl]);

  useEffect(() => () => clearUrls(), [clearUrls]);

  const reset = () => {
    clearUrls();
    setSourceUrl("");
    setResultUrl("");
    setStage("idle");
    setProgress(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

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
      setSourceUrl(preview);
      setResultUrl("");
      setFileName(
        `${file.name.replace(/\.[^/.]+$/, "") || "product"}-透明底.png`,
      );
      setProgress(4);
      setStatusText("正在加载本地 AI 模型");
      setError("");
      setStage("processing");

      let diagnosticPhase = "manifest";
      try {
        const publicPath = new URL(
          MODEL_ASSET_PATH,
          window.location.href,
        ).toString();
        await verifyModelAssets(publicPath);
        diagnosticPhase = "library-import";
        const { default: removeBackground } = await import(
          "@imgly/background-removal"
        );
        diagnosticPhase = "model-init";
        const output = await removeBackground(file, {
          publicPath,
          model: "isnet_quint8",
          output: {
            format: "image/png",
            quality: 1,
            type: "foreground",
          },
          progress: (key: string, current: number, total: number) => {
            diagnosticPhase = key;
            const ratio = total > 0 ? current / total : 0;
            const modelProgress = Math.max(6, Math.min(78, ratio * 78));
            setProgress(Math.round(modelProgress));
            setStatusText(
              key.includes("fetch")
                ? "首次使用，正在下载本地模型"
                : "AI 正在识别商品边缘",
            );
          },
        });
        setStatusText("正在生成透明 PNG");
        setProgress(92);
        const outputUrl = URL.createObjectURL(output);
        setResultUrl(outputUrl);
        setProgress(100);
        setStage("done");
      } catch (reason) {
        console.error(reason);
        const errorMessage = getErrorMessage(reason);
        const detail = errorMessage.toLowerCase();
        const diagnosticCode = getDiagnosticCode(errorMessage);
        const stack = reason instanceof Error ? reason.stack ?? "" : "";
        reportClientError(
          diagnosticCode,
          errorMessage,
          diagnosticPhase,
          stack,
        );
        setError(
          detail.includes("memory") || detail.includes("allocation")
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
          <a href="#how-it-works">怎么用</a>
          <a href="#roadmap">批量版</a>
          <span className="nav-pill">免费体验</span>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">电商商品图工作台 · 第一步</span>
          <h1>
            商品图，
            <br />
            一键<span>干净抠出。</span>
          </h1>
          <p>
            不用学设计，不用装软件。上传商品照片，AI
            自动去掉背景，直接下载透明 PNG。
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
              <span className="step-kicker">01 / 单张抠图</span>
              <h2>把商品照片放进来</h2>
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
                <span aria-hidden="true">↑</span>
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
                <p>请保持页面打开，图片始终留在你的设备上。</p>
                <div className="progress-track">
                  <span style={{ width: `${progress}%` }} />
                </div>
                <small>{progress}%</small>
              </div>
            </div>
          )}

          {stage === "done" && (
            <div className="result-panel" aria-live="polite">
              <div className="result-grid">
                <figure>
                  <span>原图</span>
                  <div className="preview-frame">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sourceUrl} alt="商品原图" />
                  </div>
                </figure>
                <figure>
                  <span className="result-badge">透明底</span>
                  <div className="preview-frame checkerboard">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resultUrl} alt="已经移除背景的商品图" />
                  </div>
                </figure>
              </div>
              <div className="result-actions">
                <button className="primary-button" type="button" onClick={download}>
                  下载透明 PNG
                </button>
                <button className="text-button" type="button" onClick={reset}>
                  再处理一张
                </button>
              </div>
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
                    if (retryFileRef.current) {
                      void processFile(retryFileRef.current);
                    }
                  }}
                >
                  重试处理
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
        <div className="roadmap-card">
          <span>即将开放</span>
          <h3>批量商品白底图</h3>
          <p>一次上传 100 张，统一居中、留白、尺寸和阴影，打包下载。</p>
        </div>
      </section>

      <footer>
        <span>© 2026 白橙铺</span>
        <span>面向电商卖家的商品图生产工具</span>
      </footer>
    </main>
  );
}
