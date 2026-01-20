const CACHE_VERSION = "v1.0.0";
const STATIC_CACHE = `coachtimer-static-${CACHE_VERSION}`;
const HTML_CACHE = `coachtimer-html-${CACHE_VERSION}`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== HTML_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isHtml = request.mode === "navigate" || request.destination === "document";
  const isStatic = request.destination === "script" || request.destination === "style";

  if (isHtml) {
    event.respondWith(networkFirstHtml(request));
    return;
  }

  if (isStatic) {
    event.respondWith(cacheFirstStatic(request));
  }
});

async function networkFirstHtml(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(HTML_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("", { status: 503, statusText: "Offline" });
  }
}

async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    return new Response("", { status: 503, statusText: "Offline" });
  }
}
