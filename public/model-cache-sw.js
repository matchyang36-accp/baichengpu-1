const MODEL_CACHE_PREFIX = "baichengpu-model-";
const MODEL_CACHE_NAME = `${MODEL_CACHE_PREFIX}v1`;
const MODEL_PATH_PREFIX = "/bg-removal/";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith(MODEL_CACHE_PREFIX) &&
                key !== MODEL_CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function cacheSuccessfulResponse(request, response) {
  if (response.ok && response.status === 200) {
    const cache = await caches.open(MODEL_CACHE_NAME);
    await cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  return cacheSuccessfulResponse(request, await fetch(request));
}

async function networkFirst(request) {
  try {
    return await cacheSuccessfulResponse(request, await fetch(request));
  } catch (reason) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw reason;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(MODEL_PATH_PREFIX)
  ) {
    return;
  }

  event.respondWith(
    url.pathname.endsWith("/resources.json")
      ? networkFirst(request)
      : cacheFirst(request),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CLEAR_MODEL_CACHE") return;
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(MODEL_CACHE_PREFIX))
            .map((key) => caches.delete(key)),
        ),
      ),
  );
});
