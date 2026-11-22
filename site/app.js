/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const gdest = q => "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(Array.isArray(q) ? q.join(",") : q);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch (e) { return d } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } },
  del(k) { try { localStorage.removeItem(k) } catch (e) { } }
};
function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toast._); toast._ = setTimeout(() => t.hidden = true, 1600) }
function copy(txt) {
  const fb = () => { const el = document.createElement("span"); el.textContent = txt; document.body.append(el); const r = document.createRange(), s = getSelection(); r.selectNodeContents(el); s.removeAllRanges(); s.addRange(r); toast("סמנו והעתיקו: " + txt); setTimeout(() => el.remove(), 3000) };
  try { navigator.clipboard.writeText(txt).then(() => toast("הועתק: " + txt), fb) } catch (e) { fb() }
}
const tmo = ms => (AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined);

/* ---------- state ---------- */
let fam = store.get("fam", "b");
let view = store.get("view", "days"); if (view === "back") view = "days";
let today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
/* The app can stay open past midnight: keep "today" current (California date). */
function refreshToday() { const t = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }); if (t !== today) { today = t; if (typeof render === "function") render(); } }
const daysFor = f => DAYS.filter(d => !d.fam || d.fam === f);
let dayIdx = 0;
function pickToday() { const ds = daysFor(fam); dayIdx = Math.max(0, ds.findIndex(d => d.d === today)); if (today > ds[ds.length - 1].d) dayIdx = ds.length - 1; }
pickToday();
const forFam = x => !x.fam || x.fam === fam;

/* ---------- vault ---------- */
let SECRETS = null, VKEY = null, pendingDoc = null;
const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const b64e = u => btoa(String.fromCharCode(...new Uint8Array(u)));
async function deriveKey(pw) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64d(VAULT.salt), iterations: VAULT.iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
}
async function openVault(key) { const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(VAULT.iv) }, key, b64d(VAULT.ct)); SECRETS = JSON.parse(new TextDecoder().decode(pt)); VKEY = key; }
async function tryStoredKey() {
  const raw = store.get("vaultkey", null); if (!raw || typeof VAULT === "undefined") return;
  try { const key = await crypto.subtle.importKey("raw", b64d(raw), { name: "AES-GCM" }, false, ["decrypt"]); await openVault(key); render(); } catch (e) { store.del("vaultkey"); }
}
function askUnlock() { $("#unlock").hidden = false; $("#pwerr").textContent = ""; $("#pw").value = ""; setTimeout(() => $("#pw").focus(), 50); }
$("#cancel").onclick = () => { $("#unlock").hidden = true; pendingDoc = null; };
$("#unlock").addEventListener("click", e => { if (e.target.id === "unlock") $("#unlock").hidden = true; });
$("#unlockform").addEventListener("submit", async e => {
  e.preventDefault();
  if (typeof VAULT === "undefined" || !crypto.subtle) { $("#pwerr").textContent = "הדפדפן הזה לא תומך בפענוח."; return; }
  $("#pwerr").textContent = "בודק…";
  try {
    const key = await deriveKey($("#pw").value); await openVault(key);
    if ($("#remember").checked) store.set("vaultkey", b64e(await crypto.subtle.exportKey("raw", key)));
    $("#unlock").hidden = true; render(); toast("הפרטים מוצגים"); if (pendingDoc) { const p = pendingDoc; pendingDoc = null; openDoc(p); }
  } catch (err) { $("#pwerr").textContent = "הסיסמה שגויה. נסו שוב."; }
});
$("#lockbtn").onclick = () => { if (SECRETS) { SECRETS = null; VKEY = null; store.del("vaultkey"); render(); toast("הפרטים הוסתרו"); } else askUnlock(); };
function secret(v) {
  if (v && typeof v === "object" && v.s) {
    if (SECRETS && SECRETS[v.s] != null) return `<button class="code" data-copy="${esc(SECRETS[v.s])}" title="העתקה">${esc(SECRETS[v.s])}</button>`;
    return `<button class="reveal" type="button"><span class="dots">••••••</span><span class="lbl">הצג</span></button>`;
  }
  return esc(v);
}

/* ---------- booking documents (encrypted copies of the confirmation emails) ---------- */
async function openDoc(id) {
  if (!VKEY) { pendingDoc = id; askUnlock(); return; }
  const v = $("#docview"), f = $("#docframe"); v.hidden = false; f.srcdoc = "<p style='font-family:sans-serif;padding:16px'>פותח…</p>";
  try {
    const r = await fetch("docs/" + id + ".bin", { signal: tmo(15000) }); if (!r.ok) throw 0; const e = await r.json();
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(e.iv) }, VKEY, b64d(e.ct));
    f.srcdoc = new TextDecoder().decode(pt);
  } catch (err) { f.srcdoc = "<p style='font-family:sans-serif;padding:16px' dir='rtl'>לא הצלחתי לפתוח את הקובץ. אם אין קליטה, הוא ייפתח אחרי שנפתח פעם אחת עם חיבור.</p>"; }
}
$("#docclose").onclick = () => { $("#docview").hidden = true; $("#docframe").srcdoc = ""; };

/* ---------- time helpers ---------- */
function untilText(iso) {
  const ms = new Date(iso) - new Date(); if (ms <= 0) return null;
  const m = Math.round(ms / 60000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  if (d > 0) return `${d} ימים ו-${h} שעות`; if (h > 0) return `${h} שעות ו-${mm} דקות`; return `${mm} דקות`;
}
/* Sunset (NOAA sunrise equation), returned as HH:MM in the trip's local time zone */
function sunset(dateStr, lat, lng) {
  const rad = Math.PI / 180, [y, mo, d] = dateStr.split("-").map(Number);
  const jd = Date.UTC(y, mo - 1, d, 12) / 864e5 + 2440587.5, n = Math.ceil(jd - 2451545 + 0.0008);
  const Js = n - lng / 360, M = (357.5291 + 0.98560028 * Js) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const L = (M + C + 180 + 102.9372) % 360, Jt = 2451545 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
  const dec = Math.asin(Math.sin(L * rad) * Math.sin(23.44 * rad));
  const w0 = Math.acos((Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec))) / rad;
  const set = new Date((Jt + w0 / 360 - 2440587.5) * 864e5);
  return set.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: lng > -116 ? "America/Los_Angeles" : "America/Los_Angeles" });
}

/* ---------- weather ---------- */
let WXLIVE = null, WXTIME = null;
function wmo(c) {
  if (c === 0) return ["☀️", "בהיר"]; if (c <= 2) return ["🌤️", "מעונן חלקית"]; if (c === 3) return ["☁️", "מעונן"];
  if (c === 45 || c === 48) return ["🌫️", "ערפל"]; if (c >= 51 && c <= 57) return ["🌦️", "טפטוף"]; if (c >= 61 && c <= 67) return ["🌧️", "גשם"];
  if (c >= 71 && c <= 77) return ["🌨️", "שלג"]; if (c >= 80 && c <= 82) return ["🌦️", "ממטרים"]; if (c >= 85 && c <= 86) return ["🌨️", "ממטרי שלג"];
  if (c >= 95) return ["⛈️", "סופת רעמים"]; return ["🌡️", ""];
}
/* Live weather from Open-Meteo. Each location loads on its own (one failure no longer drops all of them),
   the last good data is kept on the phone, and "now" temperatures are shown for today. */
let WXNOW = {};
(() => { const c = store.get("wxlive", null); if (c && c.data) { WXLIVE = c.data; WXNOW = c.now || {}; WXTIME = new Date(c.at); } })();
let wxLoading = false;
async function loadWeather(force) {
  if (wxLoading) return; if (!force && WXTIME && Date.now() - WXTIME < 15 * 60000 && Object.keys(WXNOW).length) return;
  wxLoading = true;
  const out = Object.assign({}, WXLIVE || {}), now = Object.assign({}, WXNOW); let ok = 0;
  await Promise.all(Object.entries(LOCS).map(async ([k, v]) => {
    try {
      const u = `https://api.open-meteo.com/v1/forecast?latitude=${v.ll[0]}&longitude=${v.ll[1]}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&current=temperature_2m,apparent_temperature,weather_code&timezone=America%2FLos_Angeles&past_days=2&forecast_days=10`;
      const r = await fetch(u, { cache: "no-store", signal: tmo(10000) }); if (!r.ok) return; const j = await r.json(); if (!j.daily) return;
      j.daily.time.forEach((t, i) => { if (j.daily.temperature_2m_max[i] == null) return;
        out[t + "|" + k] = { c: j.daily.weather_code[i], hi: Math.round(j.daily.temperature_2m_max[i]), lo: Math.round(j.daily.temperature_2m_min[i]), p: j.daily.precipitation_probability_max[i], wd: j.daily.wind_speed_10m_max ? Math.round(j.daily.wind_speed_10m_max[i]) : null }; });
      if (j.current && j.current.temperature_2m != null) now[k] = { t: Math.round(j.current.temperature_2m), f: j.current.apparent_temperature != null ? Math.round(j.current.apparent_temperature) : null, c: j.current.weather_code, at: Date.now() };
      ok++;
    } catch (e) { }
  }));
  wxLoading = false;
  if (ok) { WXLIVE = out; WXNOW = now; WXTIME = new Date(); store.set("wxlive", { data: out, now, at: WXTIME.getTime() }); }
  WXFAIL = !ok;
  if (view === "days") render();
}
let WXFAIL = false;
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { refreshToday(); loadWeather(); } });
setInterval(refreshToday, 60000);
const fF = c => Math.round(c * 9 / 5 + 32);
/* What to wear, derived from the day's forecast (live when available) */
function dress(w) {
  const snow = (w.c >= 71 && w.c <= 77) || w.c >= 85, rain = (w.c >= 51 && w.c <= 67) || (w.c >= 80 && w.c <= 82) || w.c >= 95 || w.p >= 50;
  let base;
  if (snow || w.hi <= 7) base = "מעיל חם, כובע צמר, כפפות ונעליים סגורות שלא נרטבות. להתלבש בשכבות";
  else if (w.hi <= 13) base = "מעיל או פליז מעל שכבה ארוכה, ומכנסיים ארוכים";
  else if (w.hi <= 18) base = "שכבות: חולצה ארוכה וסווטשירט או ז'קט קל" + (w.lo <= 10 ? ", ומעיל לערב" : "");
  else if (w.hi <= 24) base = "חולצה קצרה, ומעיל קל או סווטשירט לערב";
  else base = "בגדים קלים וכובע";
  const add = [];
  if (rain && !snow) add.push("מעיל גשם או מטרייה");
  if (w.wd != null && w.wd >= 30) add.push("שכבה חוסמת רוח");
  if (w.c <= 1 && w.hi >= 16) add.push("משקפי שמש וקרם הגנה");
  return base + (add.length ? ". להוסיף: " + add.join(", ") : "") + ".";
}
const wxFor = (date, loc) => (WXLIVE && WXLIVE[date + "|" + loc]) || WXSTATIC[date + "|" + loc];

/* ---------- flights ---------- */
let FLIGHTS = null;
async function loadFlights() { try { const r = await fetch("flights.json?t=" + Date.now(), { cache: "no-store", signal: tmo(5000) }); if (!r.ok) return; FLIGHTS = await r.json(); render(); } catch (e) { } }
const STATUS_HE = { Expected: "בזמן", Scheduled: "מתוכננת", Delayed: "מעוכבת", Boarding: "עלייה למטוס", GateClosed: "השער נסגר", Departed: "המריאה", EnRoute: "באוויר", Approaching: "בנחיתה", Arrived: "נחתה", Canceled: "בוטלה", CanceledUncertain: "ייתכן שבוטלה", Diverted: "הוסטה", Unknown: "לא ידוע" };
const hhmm = s => s ? String(s).slice(11, 16) : "";
const flightInfo = fl => FLIGHTS && FLIGHTS.flights && FLIGHTS.flights[fl] || null;
function flightBad(x) { if (!x) return false; if (/Delayed|Cancel|Diverted/.test(x.status || "")) return true; return x.depRevised && x.depSched && hhmm(x.depRevised) !== hhmm(x.depSched); }

/* ---------- stops: done ticks ---------- */
const dkey = d => `done:${fam}:${d.d}`;
const doneSet = d => new Set(store.get(dkey(d), []));
function toggleDone(d, i) { const s = doneSet(d); s.has(i) ? s.delete(i) : s.add(i); store.set(dkey(d), [...s]); render(); }

/* ---------- map (loaded on demand) ---------- */
let leafletLoading = null, mapInst = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve();
  if (leafletLoading) return leafletLoading;
  leafletLoading = new Promise((res, rej) => {
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.append(css);
    const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"; s.onload = res; s.onerror = rej; document.head.append(s);
  });
  return leafletLoading;
}
async function showMap(d) {
  const box = $("#map"); box.hidden = false; box.textContent = "טוען מפה…";
  try { await loadLeaflet(); } catch (e) { box.textContent = "אין חיבור לטעינת המפה. אפשר לפתוח את המסלול בגוגל מפות."; return; }
  box.textContent = "";
  if (mapInst) { mapInst.remove(); mapInst = null; }
  const stops = d.stops.filter(forFam), done = doneSet(d);
  mapInst = L.map(box, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(mapInst);
  const pts = [];
  stops.forEach((s, i) => {
    const key = s.ll.join(","); if (pts.length && pts[pts.length - 1].join(",") === key) return; pts.push(s.ll);
    L.marker(s.ll, { icon: L.divIcon({ className: "pin" + (done.has(d.stops.indexOf(s)) ? " done" : ""), html: `<span>${i + 1}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] }) })
      .addTo(mapInst).bindPopup(`<b>${esc(s.n)}</b><br><a href="${gdest(s.ll)}" target="_blank" rel="noopener">ניווט</a>`);
  });
  L.polyline(pts, { color: "#0E5E6F", weight: 3, opacity: .7, dashArray: "6 6" }).addTo(mapInst);
  mapInst.fitBounds(L.latLngBounds(pts), { padding: [24, 24] });
}
function routeURL(d) {
  const uniq = []; d.stops.filter(forFam).filter(s => !s.opt).forEach(s => { const k = s.ll.join(","); if (uniq[uniq.length - 1] !== k) uniq.push(k); });
  if (uniq.length < 2) return gdest(uniq[0] || "");
  const mid = uniq.slice(1, -1).slice(0, 8);
  return `https://www.google.com/maps/dir/?api=1&origin=${uniq[0]}&destination=${uniq[uniq.length - 1]}${mid.length ? "&waypoints=" + encodeURIComponent(mid.join("|")) : ""}&travelmode=driving`;
}

/* ---------- render pieces ---------- */
function renderStrip() {
  const s = $("#strip"); s.hidden = view !== "days" && view !== "discover"; const ds = daysFor(fam);
  s.innerHTML = ds.map((d, i) => { const w = wxFor(d.d, d.wx[0]); return `<button class="chip" role="tab" aria-selected="${i === dayIdx}" data-i="${i}">
    ${d.d === today ? '<span class="today">היום</span>' : ""}<b>${+d.d.slice(8)}</b><span>${d.dow}</span>${w ? `<i aria-hidden="true">${wmo(w.c)[0]}</i>` : `<i aria-hidden="true">·</i>`}</button>` }).join("");
  s.querySelectorAll(".chip").forEach(c => c.onclick = () => { dayIdx = +c.dataset.i; render(); window.scrollTo({ top: 0 }) });
  const sel = s.querySelector('[aria-selected="true"]');
  if (sel) { const r = sel.getBoundingClientRect(), sr = s.getBoundingClientRect(); s.scrollBy({ left: (r.left + r.width / 2) - (sr.left + sr.width / 2) }); } // horizontal only, never moves the page
}
function wxHTML(d) {
  const isToday = d.d === today;
  const rows = d.wx.map(l => {
    const w = wxFor(d.d, l); if (!w) return ""; const [ic, txt] = wmo(w.c);
    const bad = (w.c >= 71 && w.c <= 77) || w.c >= 85 || w.p >= 70; const tip = WXTIP[d.d + "|" + l];
    const n = isToday && WXNOW[l] && Date.now() - WXNOW[l].at < 3 * 3600e3 ? WXNOW[l] : null;
    return `<div class="wxrow${bad ? " bad" : ""}"><div class="wxi" aria-hidden="true">${n ? wmo(n.c)[0] : ic}</div>
    <div class="wxt"><b>${esc(LOCS[l].n)} · ${esc(txt)}</b>${n ? `<span class="wxnow">🌡️ עכשיו <b>${n.t}°</b>${n.f != null && n.f !== n.t ? ` · מרגיש כמו ${n.f}°` : ""}</span>` : ""}${tip ? `<span>${esc(tip)}</span>` : ""}<span>גשם ${w.p != null ? w.p + "%" : "–"}${w.wd != null ? ` · רוח עד ${w.wd} קמ"ש` : ""}</span><span class="dress"><b>👕 מה ללבוש:</b> ${esc(dress(w))}</span></div>
    <div class="wxn"><b>${w.hi}° / ${w.lo}°</b><span>${fF(w.hi)}°F / ${fF(w.lo)}°F</span><span class="hl">מקס' / מינ'</span></div></div>`
  }).join("");
  const ll = LOCS[d.wx[d.wx.length - 1]].ll, ss = sunset(d.d, ll[0], ll[1]);
  const t = WXTIME ? WXTIME.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: "America/Los_Angeles" }) : "", old = WXTIME && Date.now() - WXTIME > 3 * 3600e3;
  const status = WXLIVE && !old ? `<span class="live">● תחזית חיה · עודכנה ב-${t}</span>`
    : WXLIVE ? `<span class="wxold">⚠️ עדכון אחרון ${WXTIME.toLocaleString("he-IL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Los_Angeles" })}</span>`
    : rows ? `<span class="wxold">⚠️ מוצגת תחזית ישנה מ-18.11</span>` : `<span>התחזית תופיע כשיהיה חיבור</span>`;
  return `<section class="wx" aria-label="מזג אוויר">${rows}<div class="wxfoot"><span>🌅 שקיעה ב-${ss}</span>${status}<button class="linkbtn" id="wxrefresh" type="button">${wxLoading ? "מעדכן…" : "🔄 רענון"}</button></div></section>`;
}
function flightBox(fl) {
  const x = flightInfo(fl); if (!x) return "";
  const bad = flightBad(x), st = STATUS_HE[x.status] || x.status || "";
  const upd = FLIGHTS.updated ? new Date(FLIGHTS.updated).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : "";
  return `<div class="fstat ${bad ? "bad" : "good"}"><div class="row1"><span class="st">${esc(st)}</span>
    ${x.depGate ? `<span>שער <span class="gate">${esc(x.depGate)}</span></span>` : `<span>שער: עוד לא פורסם</span>`}${x.depTerminal ? `<span>טרמינל ${esc(x.depTerminal)}</span>` : ""}</div>
    ${x.depRevised && hhmm(x.depRevised) !== hhmm(x.depSched) ? `<span>המראה מעודכנת: <b>${hhmm(x.depRevised)}</b> (במקום ${hhmm(x.depSched)})</span>` : ""}
    ${x.arrRevised ? `<span>נחיתה משוערת: ${hhmm(x.arrRevised)}</span>` : ""}<small>עדכון אחרון ${upd}</small></div>`;
}
function itemHTML(it) {
  const facts = it.facts ? `<dl class="facts">${it.facts.filter(f => !(fam === "a" && ((f[1] && f[1].s) || f[2] === "b"))).map(([l, v]) => `<dt>${l}</dt><dd>${secret(v)}</dd>`).join("")}</dl>` : "";
  let seats = "";
  if (it.seats) seats = SECRETS && SECRETS[it.seats]
    ? `<div class="seats">${Object.entries(SECRETS[it.seats]).map(([n, s]) => `<span>${esc(n)} <b>${esc(s)}</b></span>`).join("")}</div>`
    : `<div class="seats"><span>מושבים <b>${esc(it.seatList)}</b></span><button class="reveal" type="button"><span class="lbl">הצג שמות</span></button></div>`;
  const acts = [];
  if (it.addr) acts.push(`<a class="btn primary" href="${gdest(it.addr)}" target="_blank" rel="noopener">ניווט</a>`);
  if (it.doc && fam === "b") acts.push(`<button class="btn" data-doc="${it.doc}">📄 קובץ ההזמנה</button>`);
  if (it.phone) acts.push(`<a class="btn" href="tel:${it.phone.replace(/[^+\d]/g, "")}">${esc(it.phone)}</a><button class="btn" data-copy="${esc(it.phone)}">העתקה</button>`);
  const u = it.countdown && untilText(it.countdown);
  const famNote = fam === "a" && it.k === "stay" ? `<div class="note">האישור אצל משפחת בן אדרת.</div>` : "";
  return `<article class="card k-${it.k}"><div class="kind">${esc(it.time)} · ${esc(it.kind)}</div><h3>${esc(it.title)}</h3>
   ${it.sub ? `<p>${esc(it.sub)}</p>` : ""}${u ? `<p>עוד <b style="color:var(--sea)">${u}</b></p>` : ""}
   ${it.fl ? flightBox(it.fl) : ""}${facts}${seats}${it.note ? `<div class="note">${esc(it.note)}</div>` : ""}${famNote}
   ${acts.length ? `<div class="actions">${acts.join("")}</div>` : ""}</article>`;
}
/* Check-in reminder: JetBlue opens online check-in 24h before departure */
const CHECKINS = [
  { fl: "B6 377", dep: "2026-11-20T08:45:00-05:00", route: "פורט לודרדייל ← סן פרנסיסקו", when: "שישי 20.11, 08:45 (שעון פלורידה)" },
  { fl: "B6 1700", dep: "2026-11-26T08:30:00-08:00", route: "לוס אנג'לס ← פורט לודרדייל", when: "חמישי 26.11, 08:30" }
];
function checkinHTML() {
  if (fam !== "b") return "";
  const now = Date.now(), done = store.get("checkin", {});
  return CHECKINS.map(c => {
    const dep = new Date(c.dep).getTime(), open = dep - 24 * 3600e3;
    if (done[c.fl] || now >= dep - 60 * 60e3 || now < open - 24 * 3600e3) return "";
    if (now < open) return `<div class="ci soon"><b>✈️ הצ'ק-אין ל-JetBlue ${c.fl.slice(3)} נפתח בעוד ${untilText(new Date(open).toISOString())}</b><span>${c.route} · ${c.when}</span></div>`;
    return `<section class="ci open" aria-label="צ'ק-אין"><b>✈️ הצ'ק-אין לטיסה פתוח: JetBlue ${c.fl.slice(3)}</b><span>${c.route} · ${c.when}. ההמראה בעוד ${untilText(c.dep)}.</span>
      <span>עושים צ'ק-אין לכל 5 הנוסעים באפליקציית JetBlue או באתר. צריך את קוד ההזמנה ואת שם המשפחה.</span>
      <div class="actions"><a class="btn primary" href="https://www.jetblue.com/" target="_blank" rel="noopener">jetblue.com</a>
        <span class="ci-code">קוד ההזמנה: ${secret(S("jb"))}</span><button class="btn" data-ci="${c.fl}">✓ עשינו צ'ק-אין</button></div></section>`;
  }).join("");
}
function bannerHTML() {
  if (fam !== "b" || !FLIGHTS || !FLIGHTS.flights) return "";
  return Object.entries(FLIGHTS.flights).filter(([, x]) => flightBad(x)).map(([fl, x]) =>
    `<div class="banner"><b>שינוי בטיסה ${esc(fl)}:</b> ${esc(STATUS_HE[x.status] || x.status || "")}${x.depRevised ? ` · המראה ${hhmm(x.depRevised)}` : ""}${x.depGate ? ` · שער ${esc(x.depGate)}` : ""}</div>`).join("");
}
let nextInfoOpen = false;
/* Open / close a stop card in place, without redrawing the page */
function toggleInfo(btn) {
  const k = btn.dataset.info, li = btn.closest("li"), [, i] = k.split(":"), d = daysFor(fam)[dayIdx], inf = INFO[d.stops[+i].n];
  const open = !openStops.has(k);
  open ? openStops.add(k) : openStops.delete(k);
  btn.setAttribute("aria-expanded", open);
  btn.querySelector(".st-more").textContent = open ? "סגירה ▲" : "מה זה? ▼";
  const old = li.querySelector(".sinfo"); if (old) old.remove();
  if (open) { li.insertAdjacentHTML("beforeend", infoHTML(inf, d.stops[+i].n)); const box = li.querySelector(".sinfo"); hydrateImages(box); requestAnimationFrame(() => { const r = box.getBoundingClientRect(); if (r.bottom > innerHeight) box.scrollIntoView({ block: "nearest", behavior: "smooth" }); }); }
}
function toggleNextInfo(btn) {
  const sec = btn.closest(".next"), d = daysFor(fam)[dayIdx], inf = INFO[d.stops[+btn.dataset.nxinfo].n];
  nextInfoOpen = !nextInfoOpen; btn.textContent = nextInfoOpen ? "סגירה" : "ℹ️ מה זה?";
  const old = sec.querySelector(".sinfo"); if (old) old.remove();
  if (nextInfoOpen) { sec.querySelector(".actions").insertAdjacentHTML("afterend", infoHTML(inf, d.stops[+btn.dataset.nxinfo].n)); hydrateImages(sec); }
}
function nextHTML(d) {
  const stops = d.stops.map((s, i) => [s, i]).filter(([s]) => forFam(s)), done = doneSet(d);
  const rest = stops.filter(([, i]) => !done.has(i));
  if (!rest.length) return `<div class="next all"><b>✓ כל התחנות של היום הושלמו</b></div>`;
  const [s, i] = rest[0], after = rest[1];
  const isToday = d.d === today;
  return `<section class="next" aria-label="התחנה הבאה">
    <div class="nx-top"><span class="nx-lbl">${isToday ? (done.size ? "עכשיו" : "מתחילים") : "התחנה הראשונה"}</span>${s.t ? `<span class="nx-t">${esc(s.t)}</span>` : ""}</div>
    <div class="nx-n"><span class="nx-i" aria-hidden="true">${s.i || "📍"}</span>${esc(s.n)}</div>${s.x ? `<p>${esc(s.x)}</p>` : ""}
    <div class="actions"><a class="btn primary" href="${gdest(s.ll)}" target="_blank" rel="noopener">ניווט</a><button class="btn" data-done="${i}">✓ סיימנו, לתחנה הבאה</button>${INFO[s.n] ? `<button class="btn" data-nxinfo="${i}">${nextInfoOpen ? "סגירה" : "ℹ️ מה זה?"}</button>` : ""}</div>
    ${INFO[s.n] && nextInfoOpen ? infoHTML(INFO[s.n], s.n) : ""}
    ${after ? `<div class="nx-after">אחר כך: ${esc(after[0].n)}</div>` : ""}</section>`;
}
const openStops = new Set();
/* Place photo: lead image of the stop's Wikipedia article, loaded on the phone (cached for offline by the service worker) */
/* Place photos: modern photos (mostly Flickr) via the Openverse open image search API. No key needed; cached for offline. */
const photoMem = store.get("ovgal", {});
const NO_PHOTO = /Hertz|Airport|Maxella|Star Motel|Arbor Inn|LAX/i;
async function ovSearch(q, extra) {
  const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=12&mature=false&aspect_ratio=wide${extra}`;
  const r = await fetch(u, { signal: tmo(8000) }); if (!r.ok) throw new Error(r.status);
  return (await r.json()).results || [];
}
async function placePhotos(q) {
  if (photoMem[q]) return photoMem[q];
  let res = [];
  try {
    res = await ovSearch(q, "&source=flickr");
    if (res.length < 3) res = res.concat(await ovSearch(q, "&excluded_source=wikimedia"));
  } catch (e) { return []; }
  const seen = new Set(), out = [];
  res.forEach(it => { if (out.length >= 6 || seen.has(it.id) || (it.width && it.width < 800)) return; seen.add(it.id);
    out.push({ src: it.thumbnail || it.url, full: it.url, cap: it.title || "", by: it.creator || "", lic: (it.license || "").toUpperCase(), page: it.foreign_landing_url || it.url }); });
  if (out.length) { photoMem[q] = out; store.set("ovgal", photoMem); }
  return out;
}
function hydrateImages(root) {
  (root || document).querySelectorAll(".simg[data-q]:not(.done)").forEach(async el => {
    el.classList.add("done");
    const imgs = await placePhotos(el.dataset.q);
    if (!imgs.length) { el.remove(); return; }
    el.classList.add("gal-wrap");
    el.innerHTML = `<div class="gal" tabindex="0" aria-label="תמונות">${imgs.map((im, i) => `<figure>
        <img src="${esc(im.src)}" alt="${esc(im.cap)}" loading="${i ? "lazy" : "eager"}" decoding="async" referrerpolicy="no-referrer" onerror="this.closest('figure').remove()">
        <figcaption>${el.dataset.note ? `<span>${esc(el.dataset.note)}</span>` : ""}<a href="${esc(im.page)}" target="_blank" rel="noopener">📷 ${esc(im.by || "photo")}${im.lic ? " · " + esc(im.lic) : ""}</a></figcaption></figure>`).join("")}</div>
      ${imgs.length > 1 ? `<span class="gcount">1 / ${imgs.length}</span>` : ""}`;
    const g = el.querySelector(".gal"), c = el.querySelector(".gcount");
    if (c) g.addEventListener("scroll", () => { const figs = [...g.children]; const gr = g.getBoundingClientRect(); let best = 0, bd = 1e9;
      figs.forEach((f, i) => { const r = f.getBoundingClientRect(), dd = Math.abs((r.left + r.width / 2) - (gr.left + gr.width / 2)); if (dd < bd) { bd = dd; best = i; } });
      c.textContent = `${best + 1} / ${figs.length}`; }, { passive: true });
  });
}
function infoHTML(inf, name) {
  const q = name && PLACEQ[name] && !NO_PHOTO.test(PLACEQ[name]) ? PLACEQ[name] : null;
  const photos = q ? `<div class="simg" data-q="${esc(q)}"><span class="sk"></span></div>` : "";
  return `<div class="sinfo">${photos}<div><h4>מה זה</h4><p>${esc(inf.a)}</p></div><div><h4>מה מחכה שם</h4><p>${esc(inf.e)}</p></div>
    <div class="gold"><h4>טיפ זהב</h4>${inf.t.map(t => `<p>${esc(t.replace(/^💡\s*/, ""))}</p>`).join("")}</div></div>`;
}
function stopsHTML(d) {
  const done = doneSet(d); let n = 0;
  return `<ol class="stops">${d.stops.map((s, i) => { if (!forFam(s)) return ""; n++; const ok = done.has(i);
    return `<li class="${ok ? "ok" : ""}${s.opt ? " opt" : ""}"><button class="num" data-done="${i}" aria-label="${ok ? "בטל סימון" : "סמן כבוצע"}: ${esc(s.n)}">${ok ? "✓" : n}</button>
      ${(() => { const inf = INFO[s.n], op = inf && openStops.has(d.d + ":" + i);
        const body = `<span class="st-n">${s.i ? `<span aria-hidden="true">${s.i}</span> ` : ""}${esc(s.n)}</span>${s.x || s.t ? `<span class="st-x">${s.t ? `<b>${esc(s.t)}</b> ` : ""}${s.x ? esc(s.x) : ""}</span>` : ""}`;
        return inf ? `<button class="st-b st-btn" data-info="${d.d}:${i}" aria-expanded="${op}">${body}<span class="st-more">${op ? "סגירה ▲" : "מה זה? ▼"}</span></button>` : `<div class="st-b">${body}</div>`; })()}
      <a class="nav" href="${gdest(s.ll)}" target="_blank" rel="noopener" aria-label="ניווט אל ${esc(s.n)}">➤</a>
      ${INFO[s.n] && openStops.has(d.d + ":" + i) ? infoHTML(INFO[s.n], s.n) : ""}</li>` }).join("")}</ol>`;
}
function remindHTML(d) {
  if (d.d !== today) return "";
  const now = Date.now(), out = [];
  d.stops.filter(forFam).forEach(s => { if (!s.t || !/^\d\d:\d\d$/.test(s.t)) return;
    const t = new Date(`${d.d}T${s.t}:00-08:00`).getTime(), m = Math.round((t - now) / 60000);
    if (m > 0 && m <= 90) out.push(`בעוד ${m} דק': ${s.n}`); });
  return out.length ? `<div class="remind">⏰ ${out.map(esc).join(" · ")}</div>` : "";
}
function renderDay() {
  const ds = daysFor(fam), d = ds[dayIdx];
  const dateStr = new Date(d.d + "T12:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "long" });
  const items = (d.items || []).filter(forFam), alerts = ALERTS.filter(forFam), showAlerts = dayIdx === 0 || d.d === today;
  const prep = d.prep && (typeof d.prep === "string" ? d.prep : d.prep[fam]);
  const roads = d.roads ? ROADS[d.roads] : null;
  return `${checkinHTML()}${bannerHTML()}
   <section class="hero${heroEnter ? " enter" : ""}" aria-label="${esc(SCENES[d.scene].label)}">${sceneSVG(d.scene)}<div class="txt">
     <span class="place">${esc(SCENES[d.scene].label)}</span><h2>${esc(d.title)}</h2>
     <span class="meta"><span>יום ${dayIdx + 1} מתוך ${ds.length} · ${d.dow}, ${dateStr}</span><span>לינה: <b>${esc(d.sleep)}</b></span></span></div></section>
   ${remindHTML(d)}
   ${wxHTML(d)}
   ${showAlerts && alerts.length ? `<details class="alertbox" id="alerts" open><summary>התראות (${alerts.length})</summary><div class="alerts">${alerts.map(a => `<div class="alert ${a.lvl}"><span class="dot"></span><div>${a.t}</div></div>`).join("")}</div></details>` : ""}
   ${nextHTML(d)}
   <section class="route"><div class="route-h"><h3 class="sect-title">מסלול היום</h3>
     <div class="actions"><button class="btn" id="mapbtn" type="button">🗺️ מפה</button><a class="btn" href="${routeURL(d)}" target="_blank" rel="noopener">מסלול בגוגל מפות</a></div></div>
     <div id="map" class="map" hidden></div>${stopsHTML(d)}
     ${prep ? `<div class="prep"><b>להכנה:</b> ${esc(prep)}</div>` : ""}${d.log ? `<div class="prep daylog">${esc(d.log)}</div>` : ""}</section>
   ${d.planB ? `<details class="more" id="pb-${d.d}"><summary>תוכנית ב'</summary><div class="note">${d.planB}</div></details>` : ""}
   ${roads ? `<div class="roads">${roads.map(([t, u]) => `<a class="btn" href="${u}" target="_blank" rel="noopener">🚧 ${esc(t)}</a>`).join("")}</div>` : ""}
   ${items.length ? `<details class="more" id="bk-${d.d}"><summary>הזמנות ופרטים (${items.length})</summary><div class="cards">${items.map(itemHTML).join("")}</div></details>` : ""}
   ${d.events && d.events.length ? `<details class="more" id="ev-${d.d}"><summary>מה קורה בסביבה (${d.events.length})</summary>
     <div class="evts">${d.events.map(e => `<div class="evt"><b>${esc(e.n)}</b><span>${esc(e.w)} · ${esc(e.t)}</span>${e.x ? `<span>${esc(e.x)}</span>` : ""}</div>`).join("")}</div></details>` : ""}`;
}
function renderDocs() {
  if (fam === "a") return `<section class="group"><h2>הזמנות</h2><p class="src">ההזמנות של משפחת בן אדרת לא שמורות כאן. טלפונים של המלונות המשותפים:</p>
    ${[["Star Motel", "+1 415-875-9707"], ["Yosemite View Lodge", "+1 209-379-2681"], ["Arbor Inn Monterey", "+1 831-372-3381"], ["Venice Beach Stay", "+1 213-758-5028"]].map(([n, p]) => `<div class="row"><span class="l">${n}</span><button class="code" data-copy="${p}">${p}</button></div>`).join("")}</section>`;
  return `<div class="alerts"><div class="alert danger"><span class="dot"></span><div>${ALERTS[1].t}</div></div></div>` +
    DOCS.map(g => `<section class="group"><h2>${g.g}</h2>${g.rows.map(([l, c, s, doc]) => `<div class="row"><span class="l">${esc(l)}</span>${secret(c)}<span class="s">${esc(s)}${doc ? ` · <button class="linkbtn" data-doc="${doc}">📄 פתיחת הקובץ</button>` : ""}</span></div>`).join("")}</section>`).join("") +
    `<p class="src">לחיצה על מספר מעתיקה אותו. קודי ה-PIN של Booking נמצאים רק במיילים ובאפליקציה.</p>`;
}
const APP_VERSION = "2026.11.21-22";
async function forceUpdate() {
  toast("מעדכן…");
  try { if (window.caches) for (const k of await caches.keys()) await caches.delete(k);
    if (navigator.serviceWorker) for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch (e) { }
  location.reload();
}
/* ---------- clothes: morning / evening outfits and a per-person packing count ---------- */
const CL = { shell: "מעיל גשם דק", tee: "חולצה קצרה", long: "חולצה ארוכה", sweat: "סווטשירט / פליז", light: "מעיל גשם דק (כחוסם רוח)", warm: "מעיל פוך", rainc: "מעיל גשם דק", pants: "מכנסיים ארוכים", shorts: "מכנסיים קצרים", hat: "כובע צמר וכפפות" };
function outfit(T, w) {
  const snow = (w.c >= 71 && w.c <= 77) || w.c >= 85, rain = (w.c >= 51 && w.c <= 67) || (w.c >= 80 && w.c <= 82) || w.c >= 95 || w.p >= 50;
  let k;
  if (snow || T <= 5) k = ["long", "sweat", "warm", "pants", "hat"];
  else if (T <= 11) k = ["long", "sweat", "light", "pants"];
  else if (T <= 16) k = ["long", "sweat", "pants"];
  else if (T <= 21) k = ["tee", "pants"];
  else k = ["tee", "shorts"];
  if (rain && !snow) k.push("rainc");
  if (w.wd != null && w.wd >= 30 && !k.includes("warm") && !k.includes("light")) k.push("light");
  return { T, k, rain, snow };
}
function dayOutfits(d) {
  const wa = wxFor(d.d, d.wx[0]), wp = wxFor(d.d, d.wx[d.wx.length - 1]);
  const home = /בבית/.test(d.sleep);
  return {
    am: wa ? outfit(Math.round(wa.lo + (wa.hi - wa.lo) * .6), wa) : null, wa,
    pm: wp && !home ? outfit(Math.round(wp.lo + (wp.hi - wp.lo) * .25), wp) : null, wp
  };
}
/* Capsule packing: one carry-on per person, no laundry. Layers are reused; the bulkiest items are worn on the plane. */
function packTotals(ds) {
  const n = ds.length, o = ds.map(dayOutfits);
  const sets = o.flatMap(x => [x.am, x.pm].filter(Boolean));
  const has = k => sets.some(t => t.k.includes(k));
  const warmDays = o.filter(x => x.am && x.am.k.includes("tee")).length;
  const cold = sets.some(t => t.snow || t.T <= 5);
  const tops = Math.ceil(n * 0.75);                       // a shirt is worn ~1.3 days: morning and evening, sometimes the next morning
  const short = warmDays ? Math.min(warmDays, 2) : 0;
  const shell = has("rainc") || has("light");
  const worn = [
    ["tee", "חולצה קצרה", 1, "בפלורידה חם"], ["pants", "מכנסיים ארוכים", 1, "במטוס קר"], ["shoes", "נעלי הליכה עמידות למים", 1, "הנעליים הכבדות עליך"]
  ];
  const bag = [
    ["long", "חולצות ארוכות", Math.max(tops - 1 - (short > 1 ? 1 : 0), 1), "כל חולצה משמשת לבוקר ולערב"],
    ["tee", "חולצות קצרות", short > 1 ? 1 : 0, "לימים החמים"],
    ["pants", "מכנסיים ארוכים", 2, "ועוד זוג אחד עליך = 3"],
    ["sweat", "פליז / סווטשירט", has("sweat") ? 1 : 0, "על היד כשיוצאים מהמטוס בסן פרנסיסקו"],
    ["warm", "מעיל פוך דחיס", has("warm") ? 1 : 0, "נדחס לשקית קטנה. ליוסמיטי ולערבים הקרים"],
    ["shell", "מעיל גשם דק", shell ? 1 : 0, "משמש גם כחוסם רוח"],
    ["hat", "כובע צמר וכפפות", has("hat") ? 1 : 0, ""],
    ["under", "תחתונים", n + 1, `${n} ליום ועוד ספייר אחד`],
    ["socks", "זוגות גרביים", n + 1, `${n} ליום ועוד ספייר${cold ? ", אחד מהם צמר ליוסמיטי" : ""}`],
    ["pj", "פיג'מות", n > 7 ? 2 : 1, ""]
  ];
  return { worn: worn.filter(r => r[2] > 0), bag: bag.filter(r => r[2] > 0) };
}
function outfitLine(o) { const k = o.k.includes("rainc") ? o.k.filter(x => x !== "light") : o.k; return k.map(x => CL[x]).join(" · "); }
function eveningLine(am, pm) {
  if (!am) return outfitLine(pm);
  const extra = pm.k.filter(k => !am.k.includes(k) && !["tee", "long", "pants", "shorts"].includes(k));
  const swapLegs = pm.k.includes("pants") && am.k.includes("shorts");
  return "כמו בבוקר" + (extra.length || swapLegs ? ", ועוד " + [...extra.map(k => CL[k]), ...(swapLegs ? ["מכנסיים ארוכים"] : [])].join(" · ") : "");
}
function renderClothes() {
  const ds = daysFor(fam), t = packTotals(ds), done = store.get("clothes:" + fam, {});
  const bagN = t.bag.reduce((a, r) => a + r[2], 0);
  const row = (grp) => ([k, l, c, x]) => { const id = grp + "-" + k; return `<label class="ct${done[id] ? " ok" : ""}" for="cl-${id}"><input type="checkbox" id="cl-${id}" data-c="${id}" ${done[id] ? "checked" : ""}>
     <span class="ct-n">${c}</span><span class="ct-l"><b>${l}</b>${x ? `<small>${esc(x)}</small>` : ""}</span><span class="ct-pp">לאדם</span></label>`; };
  return `<div class="perperson"><span class="pp-ic" aria-hidden="true">👤</span><div><b>כל הכמויות הן לאדם אחד</b><span>טרולי אחד לכל אחד, בלי כביסה. ${ds.length} ימים של משפחת ${FAMILIES[fam]}, לפי התחזית${WXLIVE ? " החיה" : ""}.</span></div></div>
   <details class="more" id="cl-assume"><summary>איך חישבתי</summary><ul class="assume">
     <li><b>טרולי אחד לאדם, בלי כביסה.</b> לכן ממחזרים כל מה שאפשר.</li>
     <li><b>חולצה משמשת ליום שלם:</b> בבוקר ובערב. בערב רק מוסיפים מעליה שכבה. יוצא בערך 3 חולצות לכל 4 ימים.</li>
     <li><b>3 זוגות מכנסיים לכל הטיול,</b> אחד מהם עליך.</li>
     <li><b>שכבות שחוזרות כל יום:</b> פליז אחד, מעיל פוך דחיס אחד, ומעיל גשם דק שמשמש גם כחוסם רוח.</li>
     <li><b>טסים מפלורידה,</b> אז בטיסה לובשים חולצה קצרה ומכנסיים ארוכים. את הנעליים הכבדות נועלים. המעיל והפליז נכנסים לטרולי, ולכן כדאי מעיל פוך דחיס.</li>
     <li><b>תחתונים וגרביים לא ממחזרים:</b> זוג לכל יום ועוד ספייר אחד.</li>
     <li><b>לילדים הקטנים:</b> כדאי להוסיף חולצה ומכנסיים רזרביים לבוץ, למים ולחוף.</li></ul></details>
   <section class="group"><h2>✈️ עליך בטיסה <small>לאדם אחד</small></h2><div class="ctotals">${t.worn.map(row("w")).join("")}</div></section>
   <section class="group"><h2>🧳 בטרולי <small>לאדם אחד</small></h2><div class="ctotals">${t.bag.map(row("b")).join("")}</div>
   <p class="src">סה"כ ${bagN} פריטים בטרולי לאדם, ועוד הבגדים שעליך בטיסה.</p></section>
   <section class="group"><h2>תלבושות לפי יום</h2>
   ${ds.map(d => { const o = dayOutfits(d), w = o.wa;
     return `<article class="oday"><div class="od-h"><b>${d.dow} ${+d.d.slice(8)}.11</b><span>${esc(LOCS[d.wx[0]].n)}${d.wx.length > 1 ? " ← " + esc(LOCS[d.wx[d.wx.length - 1]].n) : ""}</span>${w ? `<span class="od-w">${wmo(w.c)[0]} ${w.hi}°/${w.lo}°</span>` : ""}</div>
       ${o.am ? `<div class="od-r"><span class="od-t">☀️ בוקר <small>~${o.am.T}°</small></span><span>${outfitLine(o.am)}</span></div>` : ""}
       ${o.pm ? `<div class="od-r"><span class="od-t">🌙 ערב <small>~${o.pm.T}°</small></span><span>${eveningLine(o.am, o.pm)}</span></div>` : `<div class="od-r"><span class="od-t">🌙 ערב</span><span>בבית</span></div>`}
     </article>` }).join("")}</section>`;
}
function renderPack() {
  const done = store.get("pack", {}), n = PACK.filter((_, i) => done[i]).length;
  return `<section class="group"><h2>רשימת ציוד</h2><div class="progress"><i style="width:${Math.round(n / PACK.length * 100)}%"></i></div>
   <p class="src">${n} מתוך ${PACK.length} נארזו. הסימונים נשמרים רק בטלפון הזה.</p>
   <div class="pack">${PACK.map((p, i) => `<label for="pk${i}"><input type="checkbox" id="pk${i}" data-i="${i}" ${done[i] ? "checked" : ""}><span>${esc(p)}</span></label>`).join("")}</div></section>
   <section class="ver"><span>גרסה ${APP_VERSION}</span><button class="btn" id="updbtn" type="button">🔄 לבדוק עדכונים</button></section>`;
}

let heroEnter = true, lastKey = "";
function render() {
  if (typeof ttsStop === "function" && ttsOn) ttsStop(true);
  document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", t.dataset.view === view));
  document.querySelectorAll(".famb").forEach(b => b.setAttribute("aria-pressed", b.dataset.fam === fam));
  $("#lockbtn").textContent = SECRETS ? "🔓" : "🔒"; $("#lockbtn").setAttribute("aria-label", SECRETS ? "הסתר פרטים" : "פרטים מוגנים");
  $("#lockbtn").hidden = fam === "a";
  const ds = daysFor(fam); if (dayIdx >= ds.length) dayIdx = ds.length - 1;
  const d = ds[dayIdx], key = fam + d.d;
  heroEnter = view === "days" && key !== lastKey; if (view === "days") lastKey = key;
  document.documentElement.style.setProperty("--hdr", view === "days" ? SCENES[d.scene].hdr : "#0E5E6F");
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = view === "days" ? SCENES[d.scene].hdr : "#0E5E6F";
  renderStrip();
  const open = [...document.querySelectorAll("details")].map(x => [x.id, x.open]);
  const mapOpen = !$("#map")?.hidden;
  if (mapInst) { mapInst.remove(); mapInst = null; }
  $("#view").innerHTML = view === "days" ? renderDay() : view === "docs" ? renderDocs() : view === "clothes" ? renderClothes() : view === "food" ? renderFood() : view === "discover" ? renderDiscover() : renderPack();
  if (view === "food") initFood();
  open.forEach(([id, o]) => { const el = id && document.getElementById(id); if (el) el.open = o; });
  hydrateImages($("#view"));
  if (view === "days") { $("#mapbtn").onclick = () => { const m = $("#map"); if (!m.hidden) { m.hidden = true; if (mapInst) { mapInst.remove(); mapInst = null; } } else showMap(d); };
    if (mapOpen && !heroEnter) showMap(d); }
  if (view === "clothes") $("#view").querySelectorAll("input[data-c]").forEach(c => c.onchange = () => { const x = store.get("clothes:" + fam, {}); x[c.dataset.c] = c.checked; store.set("clothes:" + fam, x); render() });
  if (view === "days") { const wr = $("#wxrefresh"); if (wr) wr.onclick = () => { wr.textContent = "מעדכן…"; loadWeather(true); }; }
  if (view === "pack") { const u = $("#updbtn"); if (u) u.onclick = forceUpdate; }
  if (view === "pack") $("#view").querySelectorAll("input").forEach(c => c.onchange = () => { const x = store.get("pack", {}); x[c.dataset.i] = c.checked; store.set("pack", x); render() });
}

document.addEventListener("click", e => {
  const c = e.target.closest("[data-copy]"); if (c) { copy(c.dataset.copy); return }
  const ci = e.target.closest("[data-ci]"); if (ci) { const x = store.get("checkin", {}); x[ci.dataset.ci] = true; store.set("checkin", x); render(); toast("מעולה, הצ'ק-אין סומן"); return }
  const inf = e.target.closest("[data-info]"); if (inf) { toggleInfo(inf); return }
  const nx = e.target.closest("[data-nxinfo]"); if (nx) { toggleNextInfo(nx); return }
  const dn = e.target.closest("[data-done]"); if (dn) nextInfoOpen = false; if (dn) { toggleDone(daysFor(fam)[dayIdx], +dn.dataset.done); return }
  const dc = e.target.closest("[data-doc]"); if (dc) { openDoc(dc.dataset.doc); return }
  if (e.target.closest(".reveal")) askUnlock();
});
document.querySelectorAll(".tab").forEach(t => t.onclick = () => { view = t.dataset.view; store.set("view", view); render(); window.scrollTo({ top: 0 }) });
/* Swipe between tabs (ticket #112122073o). RTL: finger moving right = next tab (to the left), moving left = previous.
   Ignored when the swipe starts on something that scrolls sideways, a map, a form field or an open sheet. */
(function swipeTabs() {
  let sx = 0, sy = 0, st = 0, ok = false;
  const scrollsX = el => { for (; el && el !== document.body; el = el.parentElement) { if (el.matches?.(".leaflet-container,input,textarea,select,.scrim,.docview")) return true; const o = getComputedStyle(el).overflowX; if ((o === "auto" || o === "scroll") && el.scrollWidth > el.clientWidth + 2) return true; } return false; };
  addEventListener("touchstart", e => { const t = e.touches[0]; ok = e.touches.length === 1 && !scrollsX(e.target); sx = t.clientX; sy = t.clientY; st = Date.now(); }, { passive: true });
  addEventListener("touchend", e => {
    if (!ok) return; ok = false;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < 70 || Math.abs(dx) < 2 * Math.abs(dy) || Date.now() - st > 700) return;
    const tabs = [...document.querySelectorAll(".tab")], i = tabs.findIndex(x => x.dataset.view === view), n = tabs[i + (dx > 0 ? 1 : -1)];
    if (n) { n.click(); n.scrollIntoView({ inline: "nearest", block: "nearest" }); }
  }, { passive: true });
})();
document.querySelectorAll(".famb").forEach(b => b.onclick = () => { if (fam === b.dataset.fam) return; fam = b.dataset.fam; store.set("fam", fam); pickToday(); render(); window.scrollTo({ top: 0 }); toast("משפחת " + FAMILIES[fam]); });

render();
requestAnimationFrame(() => setTimeout(() => { tryStoredKey(); loadWeather(true); loadFlights(); }, 0));
setInterval(() => { loadFlights(); if (view === "days" && $("#unlock").hidden && $("#map").hidden) render(); }, 5 * 60000);
setInterval(() => loadWeather(true), 30 * 60000);
if ("serviceWorker" in navigator && location.protocol === "https:" && location.hostname.endsWith("github.io")) {
  const hadController = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
  navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(r => r.update()).catch(() => { });
}
