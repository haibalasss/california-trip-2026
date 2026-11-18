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
let view = store.get("view", "days");
const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
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
async function loadWeather() {
  try {
    const out = {};
    await Promise.all(Object.entries(LOCS).map(async ([k, v]) => {
      const u = `https://api.open-meteo.com/v1/forecast?latitude=${v.ll[0]}&longitude=${v.ll[1]}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=America%2FLos_Angeles&start_date=2026-11-20&end_date=2026-11-29`;
      const r = await fetch(u, { signal: tmo(6000) }); if (!r.ok) throw 0; const j = await r.json();
      j.daily.time.forEach((t, i) => { if (j.daily.temperature_2m_max[i] == null) return;
        out[t + "|" + k] = { c: j.daily.weather_code[i], hi: Math.round(j.daily.temperature_2m_max[i]), lo: Math.round(j.daily.temperature_2m_min[i]), p: j.daily.precipitation_probability_max[i], wd: j.daily.wind_speed_10m_max ? Math.round(j.daily.wind_speed_10m_max[i]) : null }; });
    }));
    WXLIVE = out; WXTIME = new Date(); if (view === "days") render();
  } catch (e) { }
}
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
  const s = $("#strip"); s.hidden = view !== "days"; const ds = daysFor(fam);
  s.innerHTML = ds.map((d, i) => { const w = wxFor(d.d, d.wx[0]); return `<button class="chip" role="tab" aria-selected="${i === dayIdx}" data-i="${i}">
    ${d.d === today ? '<span class="today">היום</span>' : ""}<b>${+d.d.slice(8)}</b><span>${d.dow}</span>${w ? `<i aria-hidden="true">${wmo(w.c)[0]}</i>` : `<i aria-hidden="true">·</i>`}</button>` }).join("");
  s.querySelectorAll(".chip").forEach(c => c.onclick = () => { dayIdx = +c.dataset.i; render(); window.scrollTo({ top: 0 }) });
  const sel = s.querySelector('[aria-selected="true"]'); if (sel) sel.scrollIntoView({ inline: "center", block: "nearest" });
}
function wxHTML(d) {
  const rows = d.wx.map(l => {
    const w = wxFor(d.d, l); if (!w) return ""; const [ic, txt] = wmo(w.c);
    const bad = (w.c >= 71 && w.c <= 77) || w.c >= 85 || w.p >= 70; const tip = WXTIP[d.d + "|" + l];
    return `<div class="wxrow${bad ? " bad" : ""}"><div class="wxi" aria-hidden="true">${ic}</div>
    <div class="wxt"><b>${esc(LOCS[l].n)} · ${esc(txt)}</b>${tip ? `<span>${esc(tip)}</span>` : ""}<span>גשם ${w.p != null ? w.p + "%" : "–"}${w.wd != null ? ` · רוח עד ${w.wd} קמ"ש` : ""}</span><span class="dress"><b>👕 מה ללבוש:</b> ${esc(dress(w))}</span></div>
    <div class="wxn"><b>${w.hi}° / ${w.lo}°</b><span>${fF(w.hi)}°F / ${fF(w.lo)}°F</span></div></div>`
  }).join("");
  const ll = LOCS[d.wx[d.wx.length - 1]].ll, ss = sunset(d.d, ll[0], ll[1]);
  return `<section class="wx" aria-label="מזג אוויר">${rows}<div class="wxfoot"><span>🌅 שקיעה ב-${ss}</span>${WXLIVE ? `<span class="live">● תחזית חיה</span>` : (rows ? `<span>תחזית מ-18.11</span>` : `<span>התחזית תופיע כשיהיה חיבור</span>`)}</div></section>`;
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
function bannerHTML() {
  if (fam !== "b" || !FLIGHTS || !FLIGHTS.flights) return "";
  return Object.entries(FLIGHTS.flights).filter(([, x]) => flightBad(x)).map(([fl, x]) =>
    `<div class="banner"><b>שינוי בטיסה ${esc(fl)}:</b> ${esc(STATUS_HE[x.status] || x.status || "")}${x.depRevised ? ` · המראה ${hhmm(x.depRevised)}` : ""}${x.depGate ? ` · שער ${esc(x.depGate)}` : ""}</div>`).join("");
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
    <div class="actions"><a class="btn primary" href="${gdest(s.ll)}" target="_blank" rel="noopener">ניווט</a><button class="btn" data-done="${i}">✓ סיימנו, לתחנה הבאה</button></div>
    ${after ? `<div class="nx-after">אחר כך: ${esc(after[0].n)}</div>` : ""}</section>`;
}
function stopsHTML(d) {
  const done = doneSet(d); let n = 0;
  return `<ol class="stops">${d.stops.map((s, i) => { if (!forFam(s)) return ""; n++; const ok = done.has(i);
    return `<li class="${ok ? "ok" : ""}${s.opt ? " opt" : ""}"><button class="num" data-done="${i}" aria-label="${ok ? "בטל סימון" : "סמן כבוצע"}: ${esc(s.n)}">${ok ? "✓" : n}</button>
      <div class="st-b"><span class="st-n">${s.i ? `<span aria-hidden="true">${s.i}</span> ` : ""}${esc(s.n)}</span>${s.x || s.t ? `<span class="st-x">${s.t ? `<b>${esc(s.t)}</b> ` : ""}${s.x ? esc(s.x) : ""}</span>` : ""}</div>
      <a class="nav" href="${gdest(s.ll)}" target="_blank" rel="noopener" aria-label="ניווט אל ${esc(s.n)}">➤</a></li>` }).join("")}</ol>`;
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
  return `${bannerHTML()}
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
     ${prep ? `<div class="prep"><b>להכנה:</b> ${esc(prep)}</div>` : ""}</section>
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
function renderPack() {
  const done = store.get("pack", {}), n = PACK.filter((_, i) => done[i]).length;
  return `<section class="group"><h2>רשימת ציוד</h2><div class="progress"><i style="width:${Math.round(n / PACK.length * 100)}%"></i></div>
   <p class="src">${n} מתוך ${PACK.length} נארזו. הסימונים נשמרים רק בטלפון הזה.</p>
   <div class="pack">${PACK.map((p, i) => `<label for="pk${i}"><input type="checkbox" id="pk${i}" data-i="${i}" ${done[i] ? "checked" : ""}><span>${esc(p)}</span></label>`).join("")}</div></section>`;
}

let heroEnter = true, lastKey = "";
function render() {
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
  $("#view").innerHTML = view === "days" ? renderDay() : view === "docs" ? renderDocs() : renderPack();
  open.forEach(([id, o]) => { const el = id && document.getElementById(id); if (el) el.open = o; });
  if (view === "days") { $("#mapbtn").onclick = () => { const m = $("#map"); if (!m.hidden) { m.hidden = true; if (mapInst) { mapInst.remove(); mapInst = null; } } else showMap(d); };
    if (mapOpen && !heroEnter) showMap(d); }
  if (view === "pack") $("#view").querySelectorAll("input").forEach(c => c.onchange = () => { const x = store.get("pack", {}); x[c.dataset.i] = c.checked; store.set("pack", x); render() });
}

document.addEventListener("click", e => {
  const c = e.target.closest("[data-copy]"); if (c) { copy(c.dataset.copy); return }
  const dn = e.target.closest("[data-done]"); if (dn) { toggleDone(daysFor(fam)[dayIdx], +dn.dataset.done); return }
  const dc = e.target.closest("[data-doc]"); if (dc) { openDoc(dc.dataset.doc); return }
  if (e.target.closest(".reveal")) askUnlock();
});
document.querySelectorAll(".tab").forEach(t => t.onclick = () => { view = t.dataset.view; store.set("view", view); render(); window.scrollTo({ top: 0 }) });
document.querySelectorAll(".famb").forEach(b => b.onclick = () => { if (fam === b.dataset.fam) return; fam = b.dataset.fam; store.set("fam", fam); pickToday(); render(); window.scrollTo({ top: 0 }); toast("משפחת " + FAMILIES[fam]); });

render();
requestAnimationFrame(() => setTimeout(() => { tryStoredKey(); loadWeather(); loadFlights(); }, 0));
setInterval(() => { loadFlights(); if (view === "days" && $("#unlock").hidden && $("#map").hidden) render(); }, 5 * 60000);
setInterval(loadWeather, 60 * 60000);
if ("serviceWorker" in navigator && location.protocol === "https:" && location.hostname.endsWith("github.io")) {
  const hadController = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
  navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(r => r.update()).catch(() => { });
}
