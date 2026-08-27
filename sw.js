const CACHE_NAME = "taoyuan-qunying-v4";
const PRECACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./game.js",
  "./manifest.json",
  "./privacy.html",
  "./js/admob.js",
  "./js/admob-config.js",
  "./js/platform.js",
  "./js/iap.js",
  "./js/firebase-config.js",
  "./js/auth.js",
  "./js/audio.js",
  "./js/cloud-save.js",
  "./data/game-data.js",
  "./data/shop-data.js",
  "./js/game/game-core.js",
  "./js/game/game-combat.js",
  "./js/game/game-render.js",
  "./js/game/game-ui.js",
  "./js/game/game-main.js",
  "./assets/icon.webp",
  "./assets/icons/icon-192.webp",
  "./assets/icons/icon-512.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
