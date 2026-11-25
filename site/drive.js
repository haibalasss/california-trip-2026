/* ---------- 17-Mile Drive bingo (Games tab): 5x5 board of things you can see on the drive ----------
   Marks are shared by every phone of the same family (events through a shared ntfy.sh topic, newest event per cell wins,
   works offline and merges later). A reset (with the family password) clears both cars. Nothing else ever clears marks.
   Separate from the road bingo: its own topic, its own storage keys. */
const DRV_BASE = (location.hostname === "localhost" && new URLSearchParams(location.search).get("ntfy")) || "https://ntfy.sh/";
const DRV_URL = DRV_BASE + "trip26-drive-quqikc8";
const DRV = [
  "🌲 הברוש הבודד", "🌊 גל שמתפוצץ על סלעים", "🦭 כלב ים או אריה ים", "🪨 סלע מלא ציפורים", "🦆 קורמורן",
  "🐦 שקנאי", "⛳ מגרש גולף", "🚩 דגל על גרין", "🚙 עגלת גולף", "🏎️ מכונית יוקרה",
  "🦌 צבי פרא", "🏖️ חוף עם חול לבן", "🏰 אחוזה ענקית", "🌫️ ערפל", "🌿 אצות קלפ שצפות",
  "🦦 לוטרת ים", "🌳 עץ ברוש מעוות", "🚧 שער האגרה בכניסה", "🚴 רוכב אופניים", "🐿️ סנאי אדמה",
  "🏝️ בריכת גאות", "🏨 מלון Lodge at Pebble Beach", "🌅 קו האופק של האוקיינוס", "👻 Ghost Tree", "🐚 צדפה או קונכייה על החוף",
];   // position = cell id: only ever append, never reorder
const drvDev = (() => { let d = store.get("drvdev", ""); if (!d) { d = Math.random().toString(36).slice(2, 7); store.set("drvdev", d); } return d; })();
let DRVEV = store.get("drvev", []), drvSeq = 0;
const drvQ = () => store.get("drvq", []);
function drvAdd(ev) { ev.id = drvDev + Date.now().toString(36) + (drvSeq++).toString(36); ev.at = new Date().toISOString(); ev.dev = drvDev; DRVEV.push(ev); store.set("drvev", DRVEV); const q = drvQ(); q.push(ev); store.set("drvq", q); drvSync(); }
function drvMerge(list) {
  const ids = new Set(DRVEV.map(e => e.id)); let n = 0;
  list.forEach(e => { if (e && e.id && !ids.has(e.id)) { ids.add(e.id); DRVEV.push(e); n++; } });
  if (n) { store.set("drvev", DRVEV); if (view === "nature") { clearTimeout(drvMerge.t); drvMerge.t = setTimeout(() => { if (view === "nature") render(); }, 120); } }
}
const drvParse = txt => txt.split("\n").filter(Boolean).map(l => { try { const m = JSON.parse(l); return m.event === "message" ? JSON.parse(m.message) : null; } catch (e) { return null; } }).filter(e => e && e.id);
async function drvSync() {
  if (drvSync.busy || !navigator.onLine) return; drvSync.busy = true;
  try {
    for (const ev of drvQ()) { const r = await fetch(DRV_URL, { method: "POST", body: JSON.stringify(ev) }); if (r.ok) store.set("drvq", drvQ().filter(x => x.id !== ev.id)); }
    const r = await fetch(DRV_URL + "/json?poll=1&since=all", { cache: "no-store" }); if (r.ok) drvMerge(drvParse(await r.text()));
  } catch (e) { } finally { drvSync.busy = false; }
}
let drvES = null;
function drvStream() {
  if (view !== "nature" || document.visibilityState !== "visible" || !window.EventSource || drvES) return;
  try { drvES = new EventSource(DRV_URL + "/sse?since=all"); drvES.onmessage = m => { try { const j = JSON.parse(m.data); if (j.event === "message") drvMerge([JSON.parse(j.message)]); } catch (e) { } }; } catch (e) { drvES = null; }
}
setInterval(() => { if (view === "nature" && document.visibilityState === "visible") drvStream(); else if (drvES) { drvES.close(); drvES = null; } }, 2000);
setInterval(() => { if (view === "nature" && document.visibilityState === "visible") drvSync(); }, 15000);
addEventListener("online", drvSync); setTimeout(drvSync, 3000);

const drvEpoch = () => DRVEV.filter(e => e.k === "reset").reduce((m, e) => e.at > m ? e.at : m, "");
function drvMarks(f) {
  const ep = drvEpoch(), m = {};
  DRVEV.filter(e => e.k === "mark" && e.fam === f && e.at > ep).sort((x, y) => x.at < y.at ? -1 : x.at > y.at ? 1 : x.id < y.id ? -1 : 1).forEach(e => { m[e.i] = !!e.on; });
  return m;
}
function drvLines(m) { const L = [], r = [0, 1, 2, 3, 4]; for (let i = 0; i < 5; i++) { L.push(r.map(j => i * 5 + j)); L.push(r.map(j => j * 5 + i)); } L.push(r.map(j => j * 6), r.map(j => j * 4 + 4)); return L.filter(l => l.every(i => m[i])).length; }
function driveHTML() {
  const m = drvMarks(fam), lines = drvLines(m), other = fam === "a" ? "b" : "a", ol = drvLines(drvMarks(other)), found = Object.values(m).filter(Boolean).length;
  return `<section class="group road drive"><h2>🌊 בינגו <bdi dir="ltr">17-Mile Drive</bdi></h2><p class="src">דברים שאפשר לראות בנסיעה. הסימונים משותפים לכל הטלפונים של אותה מכונית. לחיצה נוספת מבטלת. שורה, טור או אלכסון שלם זה בינגו!</p>
    <div class="bingo">${DRV.map((t, i) => { const sp = t.indexOf(" "); return `<button class="bcell${m[i] ? " on" : ""}" data-d="${i}" type="button" aria-pressed="${!!m[i]}"><span class="bem">${esc(t.slice(0, sp))}</span><span class="btx">${esc(t.slice(sp + 1))}</span></button>`; }).join("")}</div>
    <p class="bstat">${lines ? `🎉 ${lines} בינגו אצלכם` : `עוד אין בינגו · ${found} מסומנים`} · ${fam === "a" ? "🚙 מכונית בלס" : "🚗 מכונית בן אדרת"}: ${ol ? `🎉 ${ol} בינגו` : "עוד אין בינגו"}</p>
    <button class="linkbtn" id="drvreset" type="button">🔄 לוח חדש לכולם</button></section>`;
}
function drvAskPw() {
  let sh = document.getElementById("drvpw");
  if (!sh) {
    document.body.insertAdjacentHTML("beforeend", `<div class="scrim" id="drvpw" hidden><form class="sheet" id="drvpwform" autocomplete="off"><h2>🔄 לוח חדש לבינגו <bdi dir="ltr">17-Mile</bdi></h2><p>האיפוס מוחק את הסימונים בשתי המכוניות. כדי להמשיך, מקלידים את הסיסמה המשפחתית.</p><input type="password" id="drvpwin" aria-label="סיסמה" autocomplete="current-password"><div class="err" id="drvpwerr" role="alert"></div><div class="btns"><button type="button" id="drvpwcancel">ביטול</button><button type="submit" class="go">אישור</button></div></form></div>`);
    sh = document.getElementById("drvpw"); sh.onclick = e => { if (e.target === sh) sh.hidden = true; }; document.getElementById("drvpwcancel").onclick = () => sh.hidden = true;
    document.getElementById("drvpwform").onsubmit = async e => {
      e.preventDefault(); const err = document.getElementById("drvpwerr");
      if (typeof VAULT === "undefined" || !crypto.subtle) { err.textContent = "הדפדפן הזה לא תומך בבדיקת סיסמה."; return; }
      err.textContent = "בודק…";
      try { const key = await deriveKey(document.getElementById("drvpwin").value); await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(VAULT.iv) }, key, b64d(VAULT.ct)); } catch (x) { err.textContent = "הסיסמה שגויה."; return; }
      drvAdd({ k: "reset", fam }); sh.hidden = true; render(); toast("לוח חדש לשתי המכוניות 🎯");
    };
  }
  document.getElementById("drvpwerr").textContent = ""; document.getElementById("drvpwin").value = ""; sh.hidden = false; setTimeout(() => document.getElementById("drvpwin").focus(), 50);
}
document.addEventListener("click", e => {
  const c = e.target.closest(".bcell[data-d]");
  if (c) { const i = +c.dataset.d, m = drvMarks(fam), before = drvLines(m); const had = Object.values(m).filter(Boolean).length; drvAdd({ k: "mark", fam, i, on: !m[i] });
    const nm = drvMarks(fam), now = Object.values(nm).filter(Boolean).length;
    if (now === DRV.length && had < DRV.length) drvFireworks(true);                // the whole board: big fireworks
    else if (drvLines(nm) > before) { toast("🎉 בינגו!"); drvFireworks(false); }     // a line: a short colourful burst
    render(); return; }
  if (e.target.closest("#drvreset")) drvAskPw();
});

/* Fireworks (ticket 17): a canvas on top of the screen that removes itself. Skipped when the phone asks for less motion. */
function drvFireworks(big) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { if (big) toast("🎆 כל הכבוד! גמרתם את הבינגו!"); return; }
  const cv = document.createElement("canvas"); cv.className = "drvfx"; cv.width = innerWidth; cv.height = innerHeight; document.body.append(cv);
  let msg = null; if (big) { msg = document.createElement("div"); msg.className = "drvfxmsg"; msg.innerHTML = "<b>🎆 כל הכבוד!</b><span>גמרתם את הבינגו!</span>"; document.body.append(msg); }
  const g = cv.getContext("2d"), cols = ["#ff3b6b", "#ffb400", "#3be08f", "#37a8ff", "#b46bff", "#ffffff"], P = [], dur = big ? 5200 : 1600, t0 = performance.now();
  const burst = (x, y, n) => { const c = cols[Math.floor(Math.random() * cols.length)]; for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = 1.5 + Math.random() * (big ? 5 : 3.5); P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: Math.random() < .3 ? cols[Math.floor(Math.random() * cols.length)] : c }); } };
  let last = 0;
  (function frame(t) {
    const e = t - t0; if (e > dur) { cv.remove(); if (msg) msg.remove(); return; }
    if (e - last > (big ? 380 : 250) && e < dur - 900) { last = e; burst(innerWidth * (.15 + Math.random() * .7), innerHeight * (.12 + Math.random() * .45), big ? 70 : 38); }
    g.clearRect(0, 0, cv.width, cv.height);
    for (let i = P.length - 1; i >= 0; i--) { const q = P[i]; q.x += q.vx; q.y += q.vy; q.vy += .045; q.vx *= .99; q.life -= .012; if (q.life <= 0) { P.splice(i, 1); continue; } g.globalAlpha = Math.max(q.life, 0); g.fillStyle = q.c; g.beginPath(); g.arc(q.x, q.y, big ? 3 : 2.5, 0, 6.283); g.fill(); }
    g.globalAlpha = 1; requestAnimationFrame(frame);
  })(t0);
}
