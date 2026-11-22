/* ---------- Road tab: car-vs-car trivia and road bingo for the drives ----------
   Each family is a car. Answers and bingos are kept on the phone first and synced through a shared ntfy.sh topic
   when there is reception, so it works in the mountains too. One answer per question per car (the first one counts). */
const ROAD_BASE = (location.hostname === "localhost" && new URLSearchParams(location.search).get("ntfy")) || "https://ntfy.sh/";
const ROAD_TOPIC = "trip26-road-m8agutcbf4", ROAD_NTFY = ROAD_BASE + ROAD_TOPIC;
const CARS = { b: "🚙 מכונית בלס", a: "🚗 מכונית בן אדרת" };
const QUIZ = [
  ["באיזו שנה נפתח גשר הגולדן גייט?", ["1937", "1907", "1967"], "הגשר נפתח ב-1937. אז הוא היה גשר התלוי הארוך בעולם."],
  ["מה פירוש השם \"אלקטרז\"?", ["שקנאים", "סלעים", "כלא"], "המגלים הספרדים קראו לאי La Isla de los Alcatraces, האי של השקנאים."],
  ["מה גדל בהמון בעמק המרכזי של קליפורניה, ותראו אותו מהחלון?", ["שקדים", "בננות", "אננס"], "רוב השקדים בעולם גדלים בקליפורניה, בשורות ארוכות של עצים בעמק המרכזי."],
  ["מה התחיל את הבהלה לזהב בקליפורניה?", ["מצאו זהב בנהר ב-1848", "גילו נפט בים", "מטאוריט מזהב נפל"], "ב-1848 נמצא זהב ליד Sutter's Mill. תוך שנה הגיעו לקליפורניה עשרות אלפי מחפשי זהב."],
  ["ג'ינס הומצאו בסן פרנסיסקו בשביל מי?", ["כורי זהב", "שוטרים", "מלחים"], "ליוויי שטראוס וג'ייקוב דייוויס הוסיפו ניטים למכנסי עבודה של כורים, כדי שלא ייקרעו."],
  ["מה קרה בסן פרנסיסקו ב-1906?", ["רעידת אדמה ושריפה ענקית", "שיטפון", "סופת שלגים"], "רעידת האדמה והשריפות שאחריה הרסו את רוב העיר."],
  ["איזו חיה מופיעה על הדגל של קליפורניה?", ["דוב גריזלי", "נשר", "אריה ים"], "על הדגל יש דוב גריזלי והכיתוב California Republic. היום כבר אין גריזלים בקליפורניה."],
  ["כמה אנשים גרים בקליפורניה, בערך?", ["39 מיליון", "4 מיליון", "390 מיליון"], "בערך 39 מיליון. זו המדינה הכי מאוכלסת בארצות הברית, פי 4 מישראל."],
  ["בכמה מעלות פרנהייט מים קופאים?", ["32", "0", "100"], "32°F זה 0°C. כשרואים 32 בתחזית של יוסמיטי, צריך מעיל."],
  ["איזה נשיא חתם ב-1864 על החוק שהגן לראשונה על יוסמיטי?", ["אברהם לינקולן", "ג'ורג' וושינגטון", "ברק אובמה"], "לינקולן חתם על ה-Yosemite Grant באמצע מלחמת האזרחים. זו הפעם הראשונה שהממשלה שמרה טבע בשביל כולם."],
  ["איזה נשיא ישן ביוסמיטי והתעורר מכוסה בשלג?", ["תאודור רוזוולט", "אברהם לינקולן", "ג'ון קנדי"], "ב-1903 רוזוולט ישן בשטח עם ג'ון מיור, ובבוקר אחד התעוררו מתחת לשלג."],
  ["מה הצבע של רוב ה\"דובים השחורים\" ביוסמיטי?", ["חום או קינמון", "שחור תמיד", "לבן"], "למרות השם, הרבה מהדובים השחורים ביוסמיטי חומים. שחור זה שם הזן, לא הצבע."],
  ["למה אסור להשאיר אוכל ברכב ביוסמיטי?", ["דובים פורצים לרכבים בשביל אוכל", "האוכל קופא", "זה מושך דבורים"], "לדובים יש חוש ריח מטורף, והם יודעים לשבור חלון בשביל חטיף. שמים אוכל בארגז הפלדה."],
  ["מה עושים כשרואים דוב ליד הכביש?", ["ממשיכים לנסוע לאט ולא עוצרים", "יוצאים לצלם", "זורקים לו אוכל"], "עצירות יוצרות פקקים ומלמדות דובים להתקרב לכבישים. כל שנה דובים נדרסים ביוסמיטי."],
  ["מה העץ הכי גדול בעולם לפי נפח?", ["סקויה ענקית", "אלון", "דקל"], "הסקויות הענקיות של סיירה נבדה הן העצים הכי גדולים בעולם. חלקן חיות אלפי שנים."],
  ["איזה צוק ביוסמיטי גבוה כמעט פי שלושה ממגדל אייפל?", ["El Capitan", "Glacier Point", "Tunnel View"], "El Capitan מתנשא כ-900 מטר מעל העמק."],
  ["מי טיפס על El Capitan בלי חבלים בסרט Free Solo?", ["אלכס הונולד", "טום קרוז", "ג'ון מיור"], "ב-2017 אלכס הונולד טיפס בלי חבלים בכלל, בפחות מ-4 שעות."],
  ["מה גובה מפלי יוסמיטי?", ["739 מטר", "73 מטר", "7,390 מטר"], "739 מטר בשלושה חלקים. זה המפל הגבוה בצפון אמריקה."],
  ["מה רואים מ-Tunnel View?", ["El Capitan, Half Dome ומפל Bridalveil ביחד", "את האוקיינוס", "את סן פרנסיסקו"], "זו התצפית הכי מפורסמת ביוסמיטי, ממש ביציאה מהמנהרה."],
  ["איזו חיה קטנה עם פסים על הגב תראו הרבה ביוסמיטי?", ["צ'יפמאנק", "אוגר", "דביבון"], "צ'יפמאנק הוא סנאי קרקע קטן. הם חמודים, אבל אסור להאכיל אותם: הם נושכים ומתרגלים לאוכל של בני אדם."],
];
const BINGO = ["🚙 לוחית מנבדה", "🗺️ לוחית ממדינה רחוקה", "⚡ טסלה", "🐄 פרה", "🐎 סוס", "🍔 In-N-Out", "🌉 גשר", "🐻 שלט דובים",
  "🛻 טנדר ענק", "🌸 מכונית ורודה", "🏞️ שלט Yosemite", "🌊 נהר", "🌳 מטע שקדים", "🚂 רכבת", "🚐 קרוואן", "🪵 משאית עם עצים",
  "🚓 ניידת משטרה", "🏍️ אופנוע", "🏔️ הר עם שלג", "🚧 עבודות בכביש", "🦅 ציפור גדולה", "🚌 אוטובוס", "⛽ תחנת דלק", "🌲 עץ ענק", "🐿️ סנאי"];
const BN = 5;   // board is BN x BN
const roadDev = (() => { let d = store.get("roaddev", ""); if (!d) { d = Math.random().toString(36).slice(2, 8); store.set("roaddev", d); } return d; })();
let ROADEV = store.get("roadev", []);   // all known events (mine + synced)
const roadQ = () => store.get("roadq", []);
let roadSeq = 0;
function roadAdd(ev) { ev.id = roadDev + Date.now().toString(36) + (roadSeq++).toString(36); ev.at = ev.at || new Date().toISOString(); ev.dev = roadDev; ROADEV.push(ev); store.set("roadev", ROADEV); const q = roadQ(); q.push(ev); store.set("roadq", q); roadSync(); }
function roadMerge(list) {
  const ids = new Set(ROADEV.map(e => e.id)); let added = 0;
  list.forEach(e => { if (e && e.id && !ids.has(e.id)) { ids.add(e.id); ROADEV.push(e); added++; } });
  if (added) { store.set("roadev", ROADEV); if (view === "road") { clearTimeout(roadMerge.t); roadMerge.t = setTimeout(() => { if (view === "road") render(); }, 120); } }
  return added;
}
/* Live updates: while the Road tab is open the phone listens to the shared topic (server-sent events), so a tap on one
   phone shows on the others within a second or two. If the stream drops, the 15-second poll below catches up. */
let roadES = null;
function roadStream() {
  if (view !== "road" || document.visibilityState !== "visible" || !window.EventSource || roadES) return;
  try {
    roadES = new EventSource(ROAD_NTFY + "/sse?since=all");
    roadES.onmessage = m => { try { const j = JSON.parse(m.data); if (j.event === "message") roadMerge([JSON.parse(j.message)]); } catch (e) { } };
    roadES.onerror = () => { /* the browser reconnects by itself */ };
  } catch (e) { roadES = null; }
}
function roadStreamStop() { if (roadES) { roadES.close(); roadES = null; } }
setInterval(() => { if (view === "road" && document.visibilityState === "visible") roadStream(); else roadStreamStop(); }, 2000);
async function roadSync() {
  if (roadSync.busy || !navigator.onLine) return; roadSync.busy = true;
  try {
    for (const ev of roadQ()) { const r = await fetch(ROAD_NTFY, { method: "POST", body: JSON.stringify(ev) }); if (r.ok) store.set("roadq", roadQ().filter(x => x.id !== ev.id)); }
    const r = await fetch(ROAD_NTFY + "/json?poll=1&since=all", { cache: "no-store" });
    if (r.ok) { const got = (await r.text()).split("\n").filter(Boolean).map(l => { try { const m = JSON.parse(l); return m.event === "message" ? JSON.parse(m.message) : null; } catch (e) { return null; } }).filter(e => e && e.id);
      roadMerge(got); }
  } catch (e) { } finally { roadSync.busy = false; }
}
/* Score: first answer per car per question counts */
function roadScore() {
  const first = {}; [...ROADEV].filter(e => e.k === "q").sort((a, b) => a.at.localeCompare(b.at)).forEach(e => { const key = e.fam + "|" + e.qi; if (!(key in first)) first[key] = e; });
  const sc = { a: { ok: 0, n: 0 }, b: { ok: 0, n: 0 } }, mine = {};
  Object.values(first).forEach(e => { if (!sc[e.fam]) return; sc[e.fam].n++; if (e.ok) sc[e.fam].ok++; if (e.fam === fam) mine[e.qi] = e; });
  return { sc, mine };
}
let roadPick = null;   // { qi, choice } shown after answering
function quizHTML() {
  const { sc, mine } = roadScore(), other = fam === "a" ? "b" : "a";
  const qi = roadPick ? roadPick.qi : QUIZ.findIndex((_, i) => !mine[i]);
  const lead = sc.a.ok === sc.b.ok ? "תיקו!" : (sc.a.ok > sc.b.ok ? CARS.a : CARS.b) + " מובילה";
  let card;
  if (qi < 0) card = `<p class="qdone">🏁 עניתם על כל ${QUIZ.length} השאלות! ${sc[fam].ok > sc[other].ok ? "ניצחתם 🏆" : sc[fam].ok === sc[other].ok ? "בינתיים תיקו" : "המכונית השנייה עדיין מובילה"}</p>`;
  else {
    const [q, opts, ex] = QUIZ[qi], order = opts.map((o, i) => i).sort((x, y) => ((x * 7 + qi * 3) % 5) - ((y * 7 + qi * 3) % 5));
    const ans = roadPick || (mine[qi] ? { qi, choice: mine[qi].ch } : null);
    card = `<div class="qcard"><span class="qnum">שאלה ${qi + 1} מתוך ${QUIZ.length}</span><h3>${esc(q)}</h3>
      <div class="qopts">${order.map(i => `<button class="qopt${ans ? (i === 0 ? " ok" : i === ans.choice ? " bad" : "") : ""}" data-qi="${qi}" data-ch="${i}" type="button"${ans ? " disabled" : ""}>${esc(opts[i])}</button>`).join("")}</div>
      ${ans ? `<p class="qex">${ans.choice === 0 ? "✅ נכון!" : "❌ לא נכון."} ${esc(ex)}</p><button class="btn primary" id="qnext" type="button">לשאלה הבאה ←</button>` : ""}</div>`;
  }
  const bar = f => `<div class="sc${f === fam ? " me" : ""}"><span>${CARS[f]}</span><b>${sc[f].ok}</b><small>${sc[f].n} נענו</small></div>`;
  return `<section class="group road"><h2>🏆 טריוויה: מכונית מול מכונית</h2>
    <div class="scores">${bar("b")}${bar("a")}</div><p class="src">${lead} · אתם משחקים בתור <b>${CARS[fam]}</b> (מחליפים למעלה בבחירת המשפחה). התשובה הראשונה של כל מכונית נחשבת. בלי קליטה הניקוד נשמר ונשלח כשהקליטה חוזרת${roadQ().length ? ` · ⏳ ${roadQ().length} ממתינים לשליחה` : ""}.</p>${card}</section>`;
}
function bingoKey() { return "bingo5:" + fam + ":" + today; }   // old per-phone marks: only read once, to carry them over
/* Marks are shared by every phone of the same family: each tap is an event ("mark" cell on/off), the newest event per
   cell wins, and phones merge events (never overwrite each other). One board for everyone; one reset event (sent with
   the password) clears the marks on both cars. Events from before the reset are ignored, nothing else ever clears marks. */
const bingoEpoch = () => ROADEV.filter(e => e.k === "bingoreset").reduce((m, e) => e.at > m ? e.at : m, "");
function bingoMarks(f) {
  const ep = bingoEpoch(), m = {};
  ROADEV.filter(e => e.k === "mark" && e.fam === f && e.day === today && e.at > ep).sort((x, y) => x.at < y.at ? -1 : x.at > y.at ? 1 : x.id < y.id ? -1 : 1).forEach(e => { m[e.i] = !!e.on; });
  return m;
}
/* Marks that were saved only on one phone (before sharing existed, on the 4x4 or the 5x5 board) become shared marks.
   Done per cell and only once per cell (so an un-tap or a reset is never undone). They get the oldest possible timestamp, so
   any newer tap from anywhere still wins. The old data is never deleted from the phone. */
function bingoCarryOver() {
  const cur = bingoMarks(fam), done = store.get("bingocarried:" + fam + ":" + today, {});
  const old = Object.assign({}, store.get("bingo:" + fam + ":" + today, {}), store.get(bingoKey(), {}));   // 4x4 and 5x5 keys: same item numbering
  let changed = false;
  Object.keys(old).filter(i => old[i] && !done[i] && +i < BINGO.length).forEach(i => { done[i] = 1; changed = true; if (!(i in cur)) roadAdd({ k: "mark", fam, day: today, i: +i, on: true, at: "2000-01-01T00:00:00.000Z" }); });
  if (changed) store.set("bingocarried:" + fam + ":" + today, done);
}
function bingoLines(m) { const L = [], r = [...Array(BN).keys()]; for (let i = 0; i < BN; i++) { L.push(r.map(j => i * BN + j)); L.push(r.map(j => j * BN + i)); } L.push(r.map(j => j * (BN + 1)), r.map(j => j * (BN - 1) + BN - 1)); return L.filter(l => l.every(i => m[i])).length; }
function bingoHTML() {
  bingoCarryOver();
  const m = bingoMarks(fam), lines = bingoLines(m), other = fam === "a" ? "b" : "a", ol = bingoLines(bingoMarks(other));
  return `<section class="group road"><h2>🎯 בינגו דרכים</h2><p class="src">לוח אחד לכולם. הסימונים משותפים לכל מי שבאותה מכונית, בכל הטלפונים. רואים משהו מהלוח? לוחצים עליו. לחיצה נוספת מבטלת. שורה, טור או אלכסון שלם זה בינגו!</p>
    <div class="bingo">${BINGO.map((t, i) => { const sp = t.indexOf(" "); return `<button class="bcell${m[i] ? " on" : ""}" data-b="${i}" type="button" aria-pressed="${!!m[i]}"><span class="bem">${esc(t.slice(0, sp))}</span><span class="btx">${esc(t.slice(sp + 1))}</span></button>`; }).join("")}</div>
    <p class="bstat">${lines ? `🎉 ${lines} בינגו אצלכם` : "עוד אין בינגו"} · ${CARS[other]}: ${ol ? `🎉 ${ol} בינגו` : "עוד אין בינגו"}</p>
    <button class="linkbtn" id="bingoreset" type="button">🔄 לוח חדש לכולם</button></section>`;
}
/* Each game opens at a set time (California time) on the drive day; before that it shows a countdown instead of the game. */
const GAME_OPEN = { date: "2026-11-22", bingo: "09:30", quiz: "10:15" };
const gameOpenAt = g => Date.parse(`${GAME_OPEN.date}T${GAME_OPEN[g]}:00-08:00`);
function gameLeft(g) { return GAME_OPEN.date === today ? gameOpenAt(g) - Date.now() : (today < GAME_OPEN.date ? gameOpenAt(g) - Date.now() : 0); }
function gameFmt(ms) { const t = Math.ceil(ms / 1000), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), sc = t % 60, p = n => String(n).padStart(2, "0"); return (h ? h + ":" + p(m) : m) + ":" + p(sc); }
function lockedHTML(g, title) {
  const ms = gameLeft(g);
  return `<section class="group road locked" data-game="${g}"><h2>${title}</h2><div class="gcd"><span class="glock">🔒</span><b dir="ltr" data-cd="${g}">${gameFmt(ms)}</b><span>עד שהמשחק נפתח, ב-${GAME_OPEN[g]} שעון קליפורניה</span></div></section>`;
}
function renderRoad() {
  return (gameLeft("bingo") > 0 ? lockedHTML("bingo", "🎯 בינגו דרכים") : bingoHTML()) + (gameLeft("quiz") > 0 ? lockedHTML("quiz", "🏆 טריוויה: מכונית מול מכונית") : quizHTML());
}
/* Tick the countdowns; the moment a game opens, redraw so it appears (with a toast). */
setInterval(() => {
  if (view !== "road") return;
  let open = false;
  document.querySelectorAll("[data-cd]").forEach(el => { const g = el.dataset.cd, ms = gameLeft(g); if (ms <= 0) { open = true; toast(g === "bingo" ? "🎯 הבינגו נפתח!" : "🏆 הטריוויה נפתחה!"); } else el.textContent = gameFmt(ms); });
  if (open) render();
}, 1000);
document.addEventListener("click", e => {
  const o = e.target.closest(".qopt[data-qi]");
  if (o && !o.disabled) { const qi = +o.dataset.qi, ch = +o.dataset.ch; roadPick = { qi, choice: ch }; roadAdd({ k: "q", fam, qi, ch, ok: ch === 0 }); render(); return; }
  if (e.target.closest("#qnext")) { roadPick = null; render(); window.scrollTo({ top: 0 }); return; }
  const c = e.target.closest(".bcell[data-b]");
  if (c) { const i = +c.dataset.b, m = bingoMarks(fam), before = bingoLines(m); roadAdd({ k: "mark", fam, day: today, i, on: !m[i] });
    if (bingoLines(bingoMarks(fam)) > before) toast("🎉 בינגו!"); render(); return; }
  if (e.target.closest("#bingoreset")) { askBingoPw(); return; }
});
addEventListener("online", roadSync);
setInterval(() => { if (document.visibilityState === "visible") roadSync(); }, 15000);
setTimeout(roadSync, 4000);

/* "New board" needs the family password (checked by trying to open the vault, so the password itself is never in the code). */
function askBingoPw() {
  let sh = document.getElementById("bingopw");
  if (!sh) {
    document.body.insertAdjacentHTML("beforeend", `<div class="scrim" id="bingopw" hidden><form class="sheet" id="bingopwform" autocomplete="off">
      <h2>🔄 לוח בינגו חדש</h2><p>האיפוס מוחק את הסימונים בשתי המכוניות. כדי להמשיך, מקלידים את הסיסמה המשפחתית.</p>
      <input type="password" id="bingopwin" aria-label="סיסמה" autocomplete="current-password"><div class="err" id="bingopwerr" role="alert"></div>
      <div class="btns"><button type="button" id="bingopwcancel">ביטול</button><button type="submit" class="go">אישור</button></div></form></div>`);
    sh = document.getElementById("bingopw");
    sh.onclick = e => { if (e.target === sh) sh.hidden = true; };
    document.getElementById("bingopwcancel").onclick = () => sh.hidden = true;
    document.getElementById("bingopwform").onsubmit = async e => {
      e.preventDefault(); const err = document.getElementById("bingopwerr");
      if (typeof VAULT === "undefined" || !crypto.subtle) { err.textContent = "הדפדפן הזה לא תומך בבדיקת סיסמה."; return; }
      err.textContent = "בודק…";
      try { const key = await deriveKey(document.getElementById("bingopwin").value); await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(VAULT.iv) }, key, b64d(VAULT.ct)); }
      catch (x) { err.textContent = "הסיסמה שגויה."; return; }
      roadAdd({ k: "bingoreset", fam }); sh.hidden = true; render(); toast("לוח חדש לשתי המכוניות 🎯");
    };
  }
  document.getElementById("bingopwerr").textContent = ""; document.getElementById("bingopwin").value = ""; sh.hidden = false;
  setTimeout(() => document.getElementById("bingopwin").focus(), 50);
}
