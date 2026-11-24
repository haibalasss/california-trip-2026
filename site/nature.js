/* ---------- Games tab: Yosemite nature hunt ----------
   30 things to find in the park. Kids photograph them and upload; everybody sees the photos with the photographer's name.
   Photos go to a shared inbox (an ntfy.sh topic: free, no account). A GitHub Action copies them into the repo (site/nature/) every
   15 minutes, so they stay for good (the inbox forgets files after 3 hours). No leaderboard: only stars for the whole group. */
const NAT_TOPIC = "trip26-nature-bn7hcl0";
const NAT_BASE = (location.hostname === "localhost" && new URLSearchParams(location.search).get("ntfy")) || "https://ntfy.sh/";
const NAT_URL = NAT_BASE + NAT_TOPIC;
const NAT_OPEN = Date.parse("2026-11-22T14:30:00-08:00");     // the hunt opens at 14:30 California time
const NAT_RESULTS_AT = Date.parse("2026-11-23T20:00:00-08:00");   // scores and comments open at 20:00 California time
const KIDS = ["רום", "מאור", "אדם", "ליאן", "פלג", "עדי", "אורי"];   // order is part of the file names: only ever append
/* [emoji, name, stars, hint]. The position in this list is part of the file names: never reorder, only append. */
const HUNT = [
  ["🪨", "El Capitan", 1, "הצוק הגדול בעמק. רואים אותו כבר מהכביש."],
  ["🏔️", "Half Dome", 2, "הצוק העגול שנראה כאילו חתכו לו חצי. תחפשו בין העצים."],
  ["💦", "מפל", 1, "Yosemite Falls או Bridalveil. בנובמבר לפעמים חלש, גם מפל דק נחשב."],
  ["🌈", "קשת בענן בתוך אדי המים", 3, "כשהשמש ליד מפל חזק. קשה בנובמבר, אבל אם מצאתם זה ווואו."],
  ["🌊", "נהר Merced", 1, "הנהר שמלווה את הכביש אל העמק."],
  ["🪞", "השתקפות של הצוק בנהר", 3, "ביום בלי רוח, אחרי שהמים נרגעים. למשל ליד Sentinel Bridge."],
  ["🌉", "Sentinel Bridge", 2, "גשר אבן קטן בעמק, עם נוף מדהים."],
  ["🚇", "Tunnel View", 2, "התצפית המפורסמת שיוצאים מהמנהרה ורואים את כל העמק."],
  ["🪨", "Arch Rock", 2, "הכביש עובר בין סלעי ענק שנפלו אחד על השני. בכניסה מכיוון 140."],
  ["🍂", "עלה חום או זהוב", 1, "עלה גדול של אלון שנשר. מצלמים רק מהקרקע, לא קוטפים מהעץ."],
  ["🌲", "אצטרובל", 2, "אצטרובל ענק של אורן הסוכר הוא בונוס שווה. מצלמים ולא לוקחים."],
  ["🟤", "קליפה אדומה וספוגית של ארז", 1, "קליפה אדמדמה ועבה. מותר ללחוץ עליה בעדינות."],
  ["🌿", "אזוב או חזזית על סלע", 1, "כתמים ירוקים, צהובים או כתומים על האבן."],
  ["🍄", "פטרייה", 2, "אחרי גשם יש הרבה. בלי לגעת ובלי לאכול."],
  ["✨", "סלע גרניט שמנצנץ", 1, "תנו לשמש לפגוש אותו ותראו נצנוצים של גבישים."],
  ["🪨", "סלע ענק שהתגלגל מהצוק", 2, "הסלעים הגדולים בעמק, שנפלו לפני הרבה שנים."],
  ["🦌", "צבי פרא", 2, "בבוקר ובערב באחו. מצלמים מרחוק, לפחות 45 מטר."],
  ["🐦", "עורב כחול עם ציצית", 2, "ציפור כחולה כהה עם ראש שחור וציצית. קוראים לה Steller's jay."],
  ["🐿️", "סנאי אדמה", 2, "אסור להאכיל אותו, הוא נושך ומתרגל לאוכל של בני אדם."],
  ["🪶", "נוצה", 3, "רק מצלמים. אסור לקחת דברים מהפארק."],
  ["🪵", "עץ מלא בחורים עם בלוטים", 3, "בלוטים תקועים בחורים קטנים בגזע. זה האוצר של נקר הבלוטים."],
  ["🐺", "זאב ערבות", 3, "נדיר. אם רואים, מצלמים מרחוק, לפחות 90 מטר."],
  ["🧗", "מטפס על El Capitan", 3, "צריך זום או משקפת. נקודה קטנה על הצוק."],
  ["🐻", "ארגז הברזל נגד דובים", 1, "ארגזים בחניונים ובכניסות לשבילים. אוכל ברכב מושך דובים."],
  ["⚠️", "שלט אזהרה מדובים", 1, "שלט שמסביר איך לשמור על הפארק ועל הדובים."],
  ["🏞️", "שלט הכניסה לפארק", 1, "השלט הגדול של Yosemite National Park."],
  ["🚌", "תחנת האוטובוס של הפארק", 1, "השאטל החינמי שנוסע בעמק."],
  ["🏨", "מלון Ahwahnee", 2, "מלון אבן ועץ ענק, מתחת לצוק."],
  ["❄️", "קרח או שלג", 3, "שלג על הצוקים, או קרח בשלולית. תלוי במזג האוויר."],
  ["🎭", "פרצוף או חיה שמצאתם בטבע", 2, "בעץ, בסלע או בענן. מי שרואה בדמיון הכי מגניב מנצח את הלב."],
];
const NAT_STARS = HUNT.reduce((s, h) => s + h[2], 0);
const natDev = (() => { let d = store.get("natdev", ""); if (!d) { d = Math.random().toString(36).slice(2, 6); store.set("natdev", d); } return d; })();
const natKid = () => { const k = store.get("naturekid", -1); return k >= 0 && k < KIDS.length ? k : -1; };
let NATREV = store.get("natrev", { photos: {} }), NATIDX = { photos: [], deleted: [] }, NATLIVE = {}, NATDEL = new Set(store.get("natdel", [])), natOpenItem = store.get("natopen", -1);
const NAT_RE = /^n(\d+)_(\d+)_([0-9a-z]+)_([0-9a-z]+)\.jpg$/;
function natParse(file, src) { const m = NAT_RE.exec(file || ""); if (!m) return null; return { file, item: +m[1], kid: +m[2], at: parseInt(m[3], 36), dev: m[4], src, exp: 0 }; }

/* --- small IndexedDB store for photos waiting to upload / my own photos (localStorage is too small for images) --- */
const natDB = new Promise(res => { try { const r = indexedDB.open("natphotos", 1); r.onupgradeneeded = () => r.result.createObjectStore("p", { keyPath: "file" }); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch (e) { res(null); } });
async function natDbOp(mode, f) { const db = await natDB; if (!db) return null; return new Promise(res => { try { const tx = db.transaction("p", mode), st = tx.objectStore("p"), q = f(st); if (q) { q.onsuccess = () => res(q.result); q.onerror = () => res(null); } else tx.oncomplete = () => res(true); tx.onerror = () => res(null); } catch (e) { res(null); } }); }
const natPut = rec => natDbOp("readwrite", s => s.put(rec)), natDelDb = file => natDbOp("readwrite", s => s.delete(file)), natAll = () => natDbOp("readonly", s => s.getAll());
let NATLOCAL = {};   // file -> { blob, url, pending }

/* --- shrink the photo: this also removes GPS and other data hidden inside the photo --- */
async function natShrink(file) {
  const bmp = await createImageBitmap(file), sc = Math.min(1, 1280 / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * sc), h = Math.round(bmp.height * sc);
  const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(bmp, 0, 0, w, h);
  return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error("toBlob")), "image/jpeg", 0.8));
}
async function natUpload(rec) {
  if (!rec || !NAT_RE.test(rec.file || "")) return false;   // never send a photo without a valid name
  try { const r = await fetch(NAT_URL, { method: "PUT", headers: { Filename: rec.file, "Content-Type": "image/jpeg" }, body: rec.blob }); if (!r.ok) return false; rec.pending = false; await natPut({ file: rec.file, blob: rec.blob, pending: false }); return true; } catch (e) { return false; }
}
async function natFlush() {
  if (natFlush.busy || !navigator.onLine) return; natFlush.busy = true;
  try { for (const f of Object.keys(NATLOCAL)) { const rec = NATLOCAL[f]; if (rec.pending) { const ok = await natUpload(rec); if (ok && view === "nature") natRender(); } } } finally { natFlush.busy = false; }
}
async function natLoadLocal() { const all = (await natAll()) || []; all.forEach(r => { if (!NATLOCAL[r.file]) NATLOCAL[r.file] = { file: r.file, blob: r.blob, url: URL.createObjectURL(r.blob), pending: !!r.pending }; }); }

/* --- what everybody has uploaded: repo index (permanent) + live inbox (last hours) + my own phone --- */
function natPhotos() {
  const map = {};
  (NATIDX.photos || []).forEach(p => { map[p.file] = { file: p.file, item: p.item, kid: p.kid, at: p.at, dev: p.dev, src: "nature/" + p.file, perm: true }; });
  Object.values(NATLIVE).forEach(p => { if (!map[p.file]) map[p.file] = p; });
  Object.entries(NATLOCAL).forEach(([f, r]) => { const p = natParse(f); if (p && !map[f]) map[f] = Object.assign(p, { src: r.url, pending: r.pending }); else if (map[f] && !map[f].perm) { map[f].src = r.url; map[f].pending = r.pending; } });
  const del = new Set([...(NATIDX.deleted || []), ...NATDEL]);
  return Object.values(map).filter(p => !del.has(p.file) && p.item < HUNT.length).sort((a, b) => a.at - b.at);
}
function natMerge(list) {
  let changed = false;
  list.forEach(m => {
    if (m.event !== "message") return;
    if (m.attachment && m.attachment.name) { const p = natParse(m.attachment.name, m.attachment.url); if (p) { p.exp = m.attachment.expires || 0; if (!NATLIVE[p.file] || p.exp > NATLIVE[p.file].exp) { NATLIVE[p.file] = p; changed = true; } } }
    else if (typeof m.message === "string" && m.message.startsWith("del ")) { const f = m.message.slice(4).trim(); if (!NATDEL.has(f)) { NATDEL.add(f); store.set("natdel", [...NATDEL]); changed = true; } }
  });
  if (changed && view === "nature") { clearTimeout(natMerge.t); natMerge.t = setTimeout(() => { if (view === "nature") natRender(); }, 150); }
}
async function natSync() {
  if (natSync.busy || !navigator.onLine) return; natSync.busy = true;
  try {
    try { const r = await fetch("nature/index.json?t=" + Date.now(), { cache: "no-store" }); if (r.ok) { const j = await r.json(); if (j && Array.isArray(j.photos)) { NATIDX = j; store.set("natidx", j); } } } catch (e) { }
    try { const r = await fetch("nature/review.json?t=" + Date.now(), { cache: "no-store" }); if (r.ok) { const j = await r.json(); if (j && j.photos) { NATREV = j; store.set("natrev", j); } } } catch (e) { }
    const r = await fetch(NAT_URL + "/json?poll=1&since=all", { cache: "no-store" });
    if (r.ok) natMerge((await r.text()).split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch (e) { return {}; } }));
    // my photos that the repo now has no longer need to live on the phone
    const have = new Set((NATIDX.photos || []).map(p => p.file));
    for (const f of Object.keys(NATLOCAL)) if (have.has(f) && !NATLOCAL[f].pending) { URL.revokeObjectURL(NATLOCAL[f].url); delete NATLOCAL[f]; natDelDb(f); }
    /* Safety net: a photo that is still on this phone but is in neither the repo nor a live (unexpired) inbox file gets sent again.
       This recovers photos the inbox dropped before the 15-minute copy to the repo ran. Only after a successful read of both lists. */
    if (r.ok) for (const f of Object.keys(NATLOCAL)) { const rec = NATLOCAL[f], live = NATLIVE[f];
      if (!have.has(f) && !rec.pending && !NATDEL.has(f) && (!live || (live.exp && live.exp * 1000 < Date.now()))) rec.pending = true; }
    natFlush();
  } catch (e) { } finally { natSync.busy = false; if (view === "nature") natRender(); }
}
let natES = null;
function natStream() {
  if (view !== "nature" || document.visibilityState !== "visible" || !window.EventSource || natES) return;
  try { natES = new EventSource(NAT_URL + "/sse?since=all"); natES.onmessage = m => { try { natMerge([JSON.parse(m.data)]); } catch (e) { } }; } catch (e) { natES = null; }
}
function natStreamStop() { if (natES) { natES.close(); natES = null; } }
setInterval(() => { if (view === "nature" && document.visibilityState === "visible") natStream(); else natStreamStop(); }, 2000);
setInterval(() => { if (view === "nature" && document.visibilityState === "visible") natSync(); natFlush(); }, 20000);
addEventListener("online", () => { natFlush(); natSync(); });

/* --- screen --- */
const natLocked = () => Date.now() < NAT_OPEN;
function natFmt(ms) { const t = Math.ceil(ms / 1000), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60, p = n => String(n).padStart(2, "0"); return (h ? h + ":" + p(m) : m) + ":" + p(s); }
const natStars = n => "⭐".repeat(n);
const natResultsOpen = () => Date.now() >= NAT_RESULTS_AT;
const natRev = f => (NATREV.photos || {})[f];
const natSc = n => (n % 1 ? n.toFixed(1) : String(n));
/* Per kid and per item only the best score counts, even if several photos were uploaded for the same item. */
function natTable() {
  const best = {};
  natPhotos().forEach(p => { const r = natRev(p.file); if (!r) return; const k = KIDS[p.kid]; if (!k) return; (best[k] = best[k] || {}); best[k][p.item] = Math.max(best[k][p.item] || 0, r.s); });
  return Object.entries(best).map(([k, it]) => ({ k, total: Object.values(it).reduce((a, b) => a + b, 0), found: Object.values(it).filter(v => v > 0).length })).sort((a, b) => b.total - a.total || b.found - a.found);
}
function natResultsHTML() {
  if (!natResultsOpen()) return `<section class="natres"><h3>🏆 התוצאות והתגובות</h3><div class="gcd"><b dir="ltr" id="natcd2">${natFmt(NAT_RESULTS_AT - Date.now())}</b><span>עד שהתוצאות נפתחות, ב-20:00 שעון קליפורניה</span></div></section>`;
  const t = natTable(); if (!t.length) return "";
  return `<section class="natres"><h3>🏆 טבלת הניקוד</h3><p class="src">${esc(NATREV.rules || "")} כל תמונה קיבלה ציון ותגובה: לוחצים עליה כדי לקרוא.</p>
    <table class="nattable"><thead><tr><th>#</th><th>שם</th><th>דברים</th><th>⭐ ניקוד</th></tr></thead><tbody>${t.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.k)}</td><td>${r.found}</td><td><b>${natSc(r.total)}</b></td></tr>`).join("")}</tbody></table></section>`;
}
function renderNature() {
  if (natLocked()) return `<section class="group nat locked"><h2>🌲 חיפוש הטבע ביוסמיטי</h2><div class="gcd"><span class="glock">🔒</span><b dir="ltr" id="natcd">${natFmt(NAT_OPEN - Date.now())}</b><span>עד שהמשחק נפתח, ב-14:30 שעון קליפורניה</span></div></section>`;
  const photos = natPhotos(), by = {}; photos.forEach(p => (by[p.item] = by[p.item] || []).push(p));
  const found = Object.keys(by).length, stars = Object.keys(by).reduce((s, i) => s + HUNT[i][2], 0), kid = natKid();
  return `<section class="group nat"><h2>🌲 חיפוש הטבע ביוסמיטי</h2>
    <p class="src">מוצאים, מצלמים ומעלים. כל תמונה מופיעה עם השם של מי שצילם, ולכולם יש גישה. ככל שהדבר קשה יותר, יש עליו יותר כוכבים.</p>
    ${natResultsHTML()}
    <div class="natbar"><div class="natprog"><i style="width:${Math.round(found / HUNT.length * 100)}%"></i></div><b>נמצאו ${found} מתוך ${HUNT.length} · ⭐ ${stars} מתוך ${NAT_STARS}</b></div>
    <div class="natwho"><span>מי מצלם?</span>${KIDS.map((k, i) => `<button class="natkid" data-nk="${i}" aria-pressed="${i === kid}" type="button">${k}</button>`).join("")}</div>
    <details class="natrules"><summary>🧭 כללים קצרים לפני שיוצאים</summary><ul><li>מצלמים את הדבר, לא אנשים.</li><li>בעלי חיים מצלמים מרחוק: לפחות 45 מטר. מדובים וזאבים לפחות 90 מטר. לעולם לא מאכילים.</li><li>לא לוקחים כלום מהפארק: נוצות, אבנים, עלים וצמחים. רק תמונה.</li><li>ליד מפלים ובנהר לא נכנסים למים, והמים קרים מאוד.</li><li>לא עוצרים באמצע הכביש, ולא עוזבים את השביל.</li></ul></details>
    <ol class="nathunt">${HUNT.map((h, i) => { const ps = by[i] || [], open = natOpenItem === i;
      return `<li class="natitem${ps.length ? " got" : ""}"><button class="nathead" data-ni="${i}" aria-expanded="${open}" type="button"><span class="natem">${h[0]}</span><span class="natnm">${esc(h[1])}</span><span class="natst">${natStars(h[2])}</span><span class="natck">${ps.length ? "✅ " + ps.length : ""}</span></button>
        ${open ? `<div class="natbody"><p>${esc(h[3])}</p>${ps.length ? `<div class="natgrid">${ps.map(p => `<button class="natph" data-nf="${esc(p.file)}" type="button"><img src="${esc(p.src)}" alt="${esc(h[1])}, צילם ${esc(KIDS[p.kid] || "")}" loading="lazy" decoding="async"><span>${esc(KIDS[p.kid] || "")}${p.pending ? " ⏳" : ""}${natResultsOpen() && natRev(p.file) ? ` · ⭐${natSc(natRev(p.file).s)}` : ""}</span></button>`).join("")}</div>` : `<p class="src">עוד לא מצאו. מי יהיה הראשון?</p>`}
          <button class="btn primary natadd" data-na="${i}" type="button">📸 צילמתי!</button></div>` : ""}</li>`; }).join("")}</ol></section>`;
}
function natRender() { if (view === "nature") render(); }
setInterval(() => { if (view !== "nature") return; const c2 = document.getElementById("natcd2"); if (c2) { if (!natResultsOpen()) c2.textContent = natFmt(NAT_RESULTS_AT - Date.now()); else { toast("🏆 התוצאות נפתחו!"); render(); } } const el = document.getElementById("natcd"); if (!el) return; if (natLocked()) el.textContent = natFmt(NAT_OPEN - Date.now()); else { toast("🌲 חיפוש הטבע נפתח!"); render(); } }, 1000);

/* --- photo viewer, upload, delete --- */
function natViewer(file) {
  const p = natPhotos().find(x => x.file === file); if (!p) return;
  let v = document.getElementById("natview");
  if (!v) { document.body.insertAdjacentHTML("beforeend", `<div class="natview" id="natview" hidden><div class="natvbar"><button class="btn" id="natvclose" type="button">✕ סגירה</button><button class="btn" id="natvdel" type="button">🗑️ מחיקה</button></div><img id="natvimg" alt=""><p id="natvcap"></p><p id="natvrev" class="natvrev"></p></div>`); v = document.getElementById("natview");
    document.getElementById("natvclose").onclick = () => v.hidden = true; v.onclick = e => { if (e.target === v) v.hidden = true; }; }
  document.getElementById("natvimg").src = p.src; const rv = natResultsOpen() ? natRev(p.file) : null;
  document.getElementById("natvcap").textContent = `${HUNT[p.item][0]} ${HUNT[p.item][1]} · צילם/ה: ${KIDS[p.kid] || ""}` + (rv ? ` · ⭐ ${natSc(rv.s)} מתוך ${HUNT[p.item][2]}` : "");
  document.getElementById("natvrev").textContent = rv ? rv.c : (natResultsOpen() ? "עוד לא נבדקה" : "");
  document.getElementById("natvdel").onclick = () => natDelete(p); v.hidden = false;
}
async function natDelete(p) {
  const mine = p.dev === natDev;
  if (mine) { if (!confirm("למחוק את התמונה?")) return; }
  else { const pw = prompt("למחיקת תמונה של מישהו אחר צריך את הסיסמה המשפחתית"); if (pw == null) return;
    try { const key = await deriveKey(pw); await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(VAULT.iv) }, key, b64d(VAULT.ct)); } catch (e) { toast("הסיסמה שגויה"); return; } }
  NATDEL.add(p.file); store.set("natdel", [...NATDEL]);
  if (NATLOCAL[p.file]) { URL.revokeObjectURL(NATLOCAL[p.file].url); delete NATLOCAL[p.file]; natDelDb(p.file); }
  document.getElementById("natview").hidden = true; natRender();
  fetch(NAT_URL, { method: "POST", body: "del " + p.file }).catch(() => { const q = store.get("natdelq", []); q.push(p.file); store.set("natdelq", q); });
  toast("התמונה נמחקה");
}
async function natAddPhoto(item, file) {
  const kid = natKid(); if (kid < 0) { toast("קודם בוחרים מי מצלם"); return; }
  toast("מכין את התמונה…");
  let blob; try { blob = await natShrink(file); } catch (e) { toast("לא הצלחתי לקרוא את התמונה"); return; }
  const name = `n${item}_${kid}_${Date.now().toString(36)}_${natDev}.jpg`, rec = { file: name, blob, url: URL.createObjectURL(blob), pending: true };
  NATLOCAL[name] = rec; await natPut({ file: name, blob, pending: true }); natOpenItem = item; natRender();
  const ok = await natUpload(rec); toast(ok ? "התמונה עלתה 🎉" : "נשמר בטלפון. יעלה כשיהיה אינטרנט"); natRender();
}
document.addEventListener("click", e => {
  const k = e.target.closest(".natkid[data-nk]"); if (k) { store.set("naturekid", +k.dataset.nk); natRender(); return; }
  const h = e.target.closest(".nathead[data-ni]"); if (h) { const i = +h.dataset.ni; natOpenItem = natOpenItem === i ? -1 : i; store.set("natopen", natOpenItem); natRender(); return; }
  const a = e.target.closest(".natadd[data-na]"); if (a) { if (natKid() < 0) { toast("קודם בוחרים מי מצלם"); return; } const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.onchange = () => { if (inp.files[0]) natAddPhoto(+a.dataset.na, inp.files[0]); }; inp.click(); return; }
  const p = e.target.closest(".natph[data-nf]"); if (p) natViewer(p.dataset.nf);
});
(async function natInit() {
  try { const c = store.get("natidx", null); if (c && Array.isArray(c.photos)) NATIDX = c; } catch (e) { }
  // Safety copy of the bingo/trivia events (read only; the games themselves are never touched)
  try { const src = store.get("roadev", []), bk = store.get("roadev_backup", []), ids = new Set(bk.map(e => e.id)); let add = 0; src.forEach(e => { if (e && e.id && !ids.has(e.id)) { bk.push(e); add++; } }); if (add) store.set("roadev_backup", bk); } catch (e) { }
  await natLoadLocal(); natFlush(); setTimeout(natSync, 2500);
  const q = store.get("natdelq", []); if (q.length && navigator.onLine) { store.set("natdelq", []); q.forEach(f => fetch(NAT_URL, { method: "POST", body: "del " + f }).catch(() => { })); }
})();
