/* Quietly saves today's and tomorrow's content for areas without reception: photos of the stops and Discover items,
   the map library and map tiles around the stops. Runs once a day per phone, only when online, after the page has
   settled, in idle time, one request at a time with low priority, so it never slows the app down.
   The service worker stores everything it fetches, so the same photos and tiles then load offline. */
(function prefetchSoon() {
  const idle = f => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 20000 }) : setTimeout(f, 3000));
  const go = () => setTimeout(() => idle(prefetchDays), 6000);
  if (document.readyState === "complete") go(); else addEventListener("load", go, { once: true });
})();
async function prefetchDays() {
  const c = navigator.connection || {};
  if (!navigator.onLine || c.saveData || /2g/.test(c.effectiveType || "") || !("serviceWorker" in navigator) || !navigator.serviceWorker.controller) return;
  const key = "prefetch:" + fam + ":" + today; if (store.get(key, false)) return;
  const ds = daysFor(fam), i = ds.findIndex(d => d.d === today); if (i < 0) return;
  const days = ds.slice(i, i + 2), urls = [], queries = [];
  const tile = (z, lat, lon) => { const n = 2 ** z, x = Math.floor((lon + 180) / 360 * n), r = lat * Math.PI / 180, y = Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n); return [x, y]; };
  const tileUrl = (z, x, y) => `https://${"abc"[Math.abs(x + y) % 3]}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
  urls.push("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css", "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js");
  const seenT = new Set();
  days.forEach(d => {
    d.stops.filter(forFam).forEach(s => {
      if (PLACEQ[s.n] && !NO_PHOTO.test(PLACEQ[s.n])) queries.push(PLACEQ[s.n]);
      if (s.ll) [[10, 0], [13, 1]].forEach(([z, r]) => { const [x, y] = tile(z, s.ll[0], s.ll[1]); for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) { const u = tileUrl(z, x + dx, y + dy); if (!seenT.has(u)) { seenT.add(u); urls.push(u); } } });
    });
    (DISCOVER[d.d] || []).filter(x => x.q && (!x.fam || x.fam === fam)).forEach(x => queries.push(x.q));
  });
  const nice = async (u, opt) => { try { await fetch(u, Object.assign({ priority: "low" }, opt)); } catch (e) { } await new Promise(r => setTimeout(r, 120)); };
  for (const q of [...new Set(queries)]) {
    if (!navigator.onLine) return;
    const imgs = await placePhotos(q).catch(() => []);
    for (const im of imgs.slice(0, 3)) await nice(im.src, { mode: "no-cors", referrerPolicy: "no-referrer" });
    await new Promise(r => setTimeout(r, 200));
  }
  for (const u of urls) { if (!navigator.onLine) return; await nice(u, { mode: "no-cors" }); }
  store.set(key, true);
}
