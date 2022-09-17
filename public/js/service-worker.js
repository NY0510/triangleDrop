const CACHE_NAME = "triangleDrop-cache-v1.5";

const FILES_TO_CACHE = [
  "/offline.html",
  "/css/style.css",
  "/css/mediaQuery.css",
  "/js/PWA.js",
  "/js/service-worker.js",
  "/js/app.js",
];

self.addEventListener("install", (event) => {
  console.log("Service worker install event!");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] pre-caching offline page");
      cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  console.log("[ServiceWorker] Activate");
  // CODELAB: Remove previous cached data from disk.
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// // When there's an incoming fetch request, try and respond with a precached resource, otherwise fall back to the network
// self.addEventListener("fetch", (event) => {
//   console.log("Fetch intercepted for:", event.request.url);
//   event.respondWith(
//     caches.match(event.request).then((cachedResponse) => {
//       if (cachedResponse) {
//         return cachedResponse;
//       }
//       return fetch(event.request);
//     })
//   );
// });

self.addEventListener("fetch", (evt) => {
  console.log("[ServiceWorker] Fetch", evt.request.url);
  // CODELAB: Add fetch event handler here.
  if (evt.request.mode !== "navigate") {
    // Not a page navigation, bail.
    return;
  }
  evt.respondWith(
    fetch(evt.request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match("offline.html");
    })
  );
});
