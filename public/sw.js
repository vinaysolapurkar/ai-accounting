const CACHE_NAME = "numba-v1";

// Install: skip waiting, don't pre-cache pages (Next.js handles its own caching)
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activate: clean up old caches and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: only cache static assets, let everything else pass through
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept API calls or auth routes
  if (url.pathname.startsWith("/api/")) return;

  // Cache-first for static assets only (JS, CSS, images, fonts)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2?|ttf|ico|webp)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          }).catch(() => cached)
      )
    );
  }

  // All other requests (pages, navigation): pass through to network, no caching
});
