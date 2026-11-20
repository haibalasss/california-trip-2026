/* Offline support: the app shell opens instantly from cache and refreshes in the background. */
const V = "trip-v23";
const SHELL = ["./", "index.html", "style.css", "data.js", "info.js", "scenes.js", "app.js", "food-picks.js", "food.js", "vault.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-180.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== "rt").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const netFirst = req => fetch(req).then(r => { const c = r.clone(); caches.open("rt").then(x => x.put(req, c)); return r; }).catch(() => caches.match(req));
const cacheFirst = req => caches.match(req).then(h => h || fetch(req).then(r => { const c = r.clone(); caches.open("rt").then(x => x.put(req, c)); return r; }));
/* Site files: try the network first (fresh after every update), fall back to the saved copy after 2.5s or when offline */
const fresh = req => new Promise(resolve => {
  let done = false;
  const fallback = () => caches.match(req, { ignoreSearch: true }).then(h => { if (!done && h) { done = true; resolve(h); } });
  const timer = setTimeout(fallback, 2500);
  fetch(req, { cache: "no-cache" }).then(r => {
    clearTimeout(timer); const c = r.clone(); caches.open(V).then(x => x.put(req, c));
    if (!done) { done = true; resolve(r); }
  }).catch(() => { clearTimeout(timer); caches.match(req, { ignoreSearch: true }).then(h => { if (!done) { done = true; resolve(h || Response.error()); } }); });
});
const swr = req => caches.match(req, { ignoreSearch: true }).then(h => { const f = fetch(req).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); return r; }).catch(() => h); return h || f; });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.pathname.endsWith("flights.json") || u.pathname.endsWith("food-live.json") || u.hostname === "api.open-meteo.com") return e.respondWith(netFirst(req));
  if (/(fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|tile\.openstreetmap\.org|upload\.wikimedia\.org|api\.openverse\.org|live\.staticflickr\.com)$/.test(u.hostname) || (u.hostname === "en.wikipedia.org" && (u.pathname.startsWith("/api/rest_v1/page/summary/") || u.pathname.startsWith("/api/rest_v1/page/media-list/")))) return e.respondWith(cacheFirst(req));
  if (u.pathname.includes("/docs/")) return e.respondWith(cacheFirst(req));
  if (u.origin === location.origin) return e.respondWith(fresh(req));
});
