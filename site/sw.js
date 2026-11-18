/* Offline support: the app shell opens instantly from cache and refreshes in the background. */
const V = "trip-v4";
const SHELL = ["./", "index.html", "style.css", "data.js", "scenes.js", "app.js", "vault.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-180.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== "rt").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const netFirst = req => fetch(req).then(r => { const c = r.clone(); caches.open("rt").then(x => x.put(req, c)); return r; }).catch(() => caches.match(req));
const cacheFirst = req => caches.match(req).then(h => h || fetch(req).then(r => { const c = r.clone(); caches.open("rt").then(x => x.put(req, c)); return r; }));
const swr = req => caches.match(req, { ignoreSearch: true }).then(h => { const f = fetch(req).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); return r; }).catch(() => h); return h || f; });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.pathname.endsWith("flights.json") || u.hostname === "api.open-meteo.com") return e.respondWith(netFirst(req));
  if (/(fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|tile\.openstreetmap\.org)$/.test(u.hostname)) return e.respondWith(cacheFirst(req));
  if (u.pathname.includes("/docs/")) return e.respondWith(cacheFirst(req));
  if (u.origin === location.origin) return e.respondWith(swr(req));
});
