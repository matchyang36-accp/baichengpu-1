const MODEL_CACHE_PREFIX = "baichengpu-model-";
const MODEL_CACHE_NAME = `${MODEL_CACHE_PREFIX}v2`;
const MODEL_PATH_PREFIX = "/bg-removal/";
const MAX_NETWORK_REQUESTS = 2;
let activeNetworkRequests = 0;
const networkQueue = [];

function runNextNetworkRequest() {
  if (
    activeNetworkRequests >= MAX_NETWORK_REQUESTS ||
    networkQueue.length === 0
  ) {
    return;
  }

  activeNetworkRequests += 1;
  const task = networkQueue.shift();
  fetch(task.request)
    .then(task.resolve, task.reject)
    .finally(() => {
      activeNetworkRequests -= 1;
      runNextNetworkRequest();
    });
}

function fetchWithLimit(request) {
  return new Promise((resolve, reject) => {
    networkQueue.push({ request, resolve, reject });
    runNextNetworkRequest();
  });
}

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

function cacheSuccessfulResponse(event, request, response) {
  if (response.ok && response.status === 200) {
    event.waitUntil(
      caches
        .open(MODEL_CACHE_NAME)
        .then((cache) => cache.put(request, response.clone()))
        .catch((reason) =>
          console.warn("[model-cache] WRITE_FAILED", request.url, reason),
        ),
    );
  }
  return response;
}

async function cacheFirst(event, request) {
  if (request.cache === "reload" || request.cache === "no-store") {
    return cacheSuccessfulResponse(
      event,
      request,
      await fetchWithLimit(request),
    );
  }
  const cached = await caches.match(request);
  if (cached) return cached;
  return cacheSuccessfulResponse(event, request, await fetchWithLimit(request));
}

async function networkFirst(event, request) {
  try {
    return cacheSuccessfulResponse(
      event,
      request,
      await fetchWithLimit(request),
    );
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
      ? networkFirst(event, request)
      : cacheFirst(event, request),
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
