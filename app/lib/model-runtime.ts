"use client";

type RemoveBackground = typeof import("@imgly/background-removal")["removeBackground"];

let runtimePromise: Promise<typeof import("@imgly/background-removal")> | null =
  null;

export async function removeBackgroundLocal(
  ...args: Parameters<RemoveBackground>
): Promise<Awaited<ReturnType<RemoveBackground>>> {
  runtimePromise ??= import("@imgly/background-removal");
  const runtime = await runtimePromise;
  return runtime.removeBackground(...args);
}

export async function verifyModelAssets(publicPath: string) {
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
