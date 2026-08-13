"use client";

type RemoveBackground = typeof import("@imgly/background-removal")["removeBackground"];

type ModelChunk = {
  name: string;
  offsets: [number, number];
};

type ModelResource = {
  size: number;
  chunks: ModelChunk[];
};

type ModelManifest = Record<string, ModelResource>;

type ModelAssetProgress = {
  downloaded: number;
  total: number;
};

const REQUIRED_MODEL_RESOURCES = [
  "/models/isnet_quint8",
  "/onnxruntime-web/ort-wasm-simd-threaded.wasm",
  "/onnxruntime-web/ort-wasm-simd-threaded.mjs",
] as const;

const ASSET_FETCH_TIMEOUT_MS = 45_000;
const ASSET_FETCH_ATTEMPTS = 3;
const ASSET_FETCH_CONCURRENCY = 2;

let runtimePromise: Promise<typeof import("@imgly/background-removal")> | null =
  null;

export async function removeBackgroundLocal(
  ...args: Parameters<RemoveBackground>
): Promise<Awaited<ReturnType<RemoveBackground>>> {
  runtimePromise ??= import("@imgly/background-removal");
  const runtime = await runtimePromise;
  return runtime.removeBackground(...args);
}

async function fetchWithTimeout(url: string, cache: RequestCache) {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    ASSET_FETCH_TIMEOUT_MS,
  );

  try {
    return await fetch(url, { cache, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchManifest(publicPath: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < ASSET_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        `${publicPath}resources.json`,
        attempt === 0 ? "force-cache" : "reload",
      );
      if (!response.ok) {
        throw new Error(`model-manifest-${response.status}`);
      }
      return (await response.json()) as ModelManifest;
    } catch (reason) {
      lastError = reason;
    }
  }

  throw lastError instanceof Error
    ? new Error(`model-fetch-failed-manifest: ${lastError.message}`, {
        cause: lastError,
      })
    : new Error("model-fetch-failed-manifest");
}

async function fetchChunk(
  publicPath: string,
  chunk: ModelChunk,
  onProgress?: (progress: ModelAssetProgress) => void,
  progress?: ModelAssetProgress,
) {
  const expectedSize = chunk.offsets[1] - chunk.offsets[0];
  let lastError: unknown;

  for (let attempt = 0; attempt < ASSET_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        new URL(chunk.name, publicPath).toString(),
        attempt === 0 ? "force-cache" : "reload",
      );
      if (!response.ok) {
        throw new Error(`model-chunk-${response.status}-${chunk.name}`);
      }

      const blob = await response.blob();
      if (blob.size !== expectedSize) {
        throw new Error(
          `Failed to fetch ${chunk.name} with size ${expectedSize} but got ${blob.size}`,
        );
      }

      if (progress) {
        progress.downloaded += expectedSize;
        onProgress?.({ ...progress });
      }
      return;
    } catch (reason) {
      lastError = reason;
    }
  }

  throw lastError instanceof Error
    ? new Error(`model-fetch-failed-${chunk.name}: ${lastError.message}`, {
        cause: lastError,
      })
    : new Error(`model-fetch-failed-${chunk.name}`);
}

export async function verifyModelAssets(
  publicPath: string,
  onProgress?: (progress: ModelAssetProgress) => void,
) {
  const manifest = await fetchManifest(publicPath);
  const chunks = new Map<string, ModelChunk>();
  let total = 0;

  for (const resourceKey of REQUIRED_MODEL_RESOURCES) {
    const resource = manifest[resourceKey];
    if (!resource || !Array.isArray(resource.chunks)) {
      throw new Error(`model-resource-missing-${resourceKey}`);
    }
    for (const chunk of resource.chunks) {
      if (chunks.has(chunk.name)) continue;
      chunks.set(chunk.name, chunk);
      total += chunk.offsets[1] - chunk.offsets[0];
    }
  }

  const queue = [...chunks.values()];
  const progress = { downloaded: 0, total };
  onProgress?.({ ...progress });

  const worker = async () => {
    while (queue.length > 0) {
      const chunk = queue.shift();
      if (!chunk) return;
      await fetchChunk(publicPath, chunk, onProgress, progress);
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(ASSET_FETCH_CONCURRENCY, chunks.size) },
      () => worker(),
    ),
  );
}

export function mapRemovalProgress(
  key: string,
  current: number,
  total: number,
) {
  const ratio = total > 0 ? Math.max(0, Math.min(1, current / total)) : 0;

  if (key.startsWith("fetch:")) {
    const isModel = key.includes("/models/");
    if (isModel) {
      return {
        progress: Math.round(ratio >= 0.995 ? 72 : 20 + ratio * 50),
        statusKey:
          ratio >= 0.995
            ? "tool.status.modelDownloaded"
            : "tool.status.modelDownloading",
      };
    }
    return {
      progress: Math.round(6 + ratio * 14),
      statusKey: "tool.status.runtimePreparing",
    };
  }

  if (key === "compute:decode") {
    return { progress: 78, statusKey: "tool.status.decoding" };
  }
  if (key === "compute:inference") {
    return { progress: 82, statusKey: "tool.status.inference" };
  }
  if (key === "compute:mask") {
    return { progress: 92, statusKey: "tool.status.masking" };
  }
  if (key === "compute:encode") {
    return {
      progress: current >= total ? 98 : 96,
      statusKey: "tool.status.encoding",
    };
  }

  return { progress: 6, statusKey: "tool.status.modelPreparing" };
}
