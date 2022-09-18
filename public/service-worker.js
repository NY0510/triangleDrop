const CACHE_NAME = "triangleDrop-cache-v4";

const FILES_TO_CACHE = [
  "/offline.html",
  "/js/PWA.js",
  "/service-worker.js",
  "/img/favicon/favicon-32x32.png",
  "/img/favicon/favicon-16x16.png",
  "/manifest.json",
  "/img/favicon/android-icon-192x192.png",
  "/img/favicon/android-icon-144x144.png",
  "/img/favicon/android-icon-96x96.png",
  "/img/favicon/android-icon-72x72.png",
  "/img/favicon/android-icon-48x48.png",
  "/img/favicon/android-icon-36x36.png",
  "/img/favicon/apple-icon-180x180.png",
  "/img/favicon/apple-icon-152x152.png",
  "/img/favicon/apple-icon-144x144.png",
  "/img/favicon/apple-icon-114x114.png",
  "/img/favicon/ms-icon-310x310.png",
  "/img/favicon/ms-icon-144x144.png",
  "/img/favicon/ms-icon-70x70.png",
  "/img/favicon/ms-icon-150x150.png",
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
