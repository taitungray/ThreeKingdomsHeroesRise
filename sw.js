const CACHE_NAME = "taoyuan-qunying-v16";
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./privacy.html",
  "./assets/icon.webp",
  "./assets/icons/icon-192.webp",
  "./assets/icons/icon-512.webp"
];

function isVolatile(url) {
  return /\/(js|data|styles\.css|sw\.js)(\/|$|\?)/.test(url.pathname) || url.pathname.endsWith(".js") || url.pathname.endsWith(".css");
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => {
        for (const client of clients) client.postMessage({ type: "TK_SW_UPDATED", cache: CACHE_NAME });
      })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Game code and styles must always hit network so combat fixes are not trapped in old SW cache.
  if (isVolatile(url)) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

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
