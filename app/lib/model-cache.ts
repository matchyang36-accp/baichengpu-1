"use client";

const MODEL_CACHE_PREFIX = "baichengpu-model-";

export async function registerModelCacheWorker() {
  if (!("serviceWorker" in navigator)) return;
  await navigator.serviceWorker.register("/model-cache-sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  return navigator.serviceWorker.ready;
}

export async function clearModelCache() {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration("/");
    registration?.active?.postMessage({ type: "CLEAR_MODEL_CACHE" });
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(MODEL_CACHE_PREFIX))
        .map((key) => caches.delete(key)),
    );
  }
}
