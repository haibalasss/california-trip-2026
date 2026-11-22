/* ---------- Road tab: car-vs-car trivia and road bingo for the drives ----------
   Each family is a car. Answers and bingos are kept on the phone first and synced through a shared ntfy.sh topic
   when there is reception, so it works in the mountains too. One answer per question per car (the first one counts). */
const ROAD_TOPIC = "trip26-road-m8agutcbf4", ROAD_NTFY = "https://ntfy.sh/" + ROAD_TOPIC;
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
  "🛻 טנדר ענק", "🌸 מכונית ורודה", "🏞️ שלט Yosemite", "🌊 נהר", "🌳 מטע שקדים", "🚂 רכבת", "🚐 קרוואן", "🪵 משאית עם עצים"];
const roadDev = (() => { let d = store.get("roaddev", ""); if (!d) { d = Math.random().toString(36).slice(2, 8); store.set("roaddev", d); } return d; })();
let ROADEV = store.get("roadev", []);   // all known events (mine + synced)
const roadQ = () => store.get("roadq", []);
function roadAdd(ev) { ev.id = roadDev + Date.now().toString(36); ev.at = new Date().toISOString(); ev.dev = roadDev; ROADEV.push(ev); store.set("roadev", ROADEV); const q = roadQ(); q.push(ev); store.set("roadq", q); roadSync(); }
async function roadSync() {
  if (roadSync.busy || !navigator.onLine) return; roadSync.busy = true;
  try {
    for (const ev of roadQ()) { const r = await fetch(ROAD_NTFY, { method: "POST", body: JSON.stringify(ev) }); if (r.ok) store.set("roadq", roadQ().filter(x => x.id !== ev.id)); }
    const r = await fetch(ROAD_NTFY + "/json?poll=1&since=all", { cache: "no-store" });
    if (r.ok) { const got = (await r.text()).split("\n").filter(Boolean).map(l => { try { const m = JSON.parse(l); return m.event === "message" ? JSON.parse(m.message) : null; } catch (e) { return null; } }).filter(e => e && e.id);
      const ids = new Set(ROADEV.map(e => e.id)); let added = 0; got.forEach(e => { if (!ids.has(e.id)) { ROADEV.push(e); added++; } });
      if (added) { store.set("roadev", ROADEV); if (view === "road") render(); } }
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
function bingoKey() { return "bingo:" + fam + ":" + today; }
function bingoLines(m) { const L = []; for (let i = 0; i < 4; i++) { L.push([0, 1, 2, 3].map(j => i * 4 + j)); L.push([0, 1, 2, 3].map(j => j * 4 + i)); } L.push([0, 5, 10, 15], [3, 6, 9, 12]); return L.filter(l => l.every(i => m[i])).length; }
function bingoHTML() {
  const m = store.get(bingoKey(), {}), lines = bingoLines(m), other = fam === "a" ? "b" : "a";
  const ob = ROADEV.filter(e => e.k === "bingo" && e.day === today);
  const best = f => Math.max(0, ...ob.filter(e => e.fam === f).map(e => e.n));
  return `<section class="group road"><h2>🎯 בינגו דרכים</h2><p class="src">רואים משהו מהלוח? לוחצים עליו. שורה, טור או אלכסון שלם זה בינגו!</p>
    <div class="bingo">${BINGO.map((t, i) => `<button class="bcell${m[i] ? " on" : ""}" data-b="${i}" type="button" aria-pressed="${!!m[i]}">${esc(t)}</button>`).join("")}</div>
    <p class="bstat">${lines ? `🎉 ${lines} בינגו אצלכם` : "עוד אין בינגו"} · ${CARS[other]}: ${best(other) ? `🎉 ${best(other)} בינגו` : "עוד אין בינגו"}</p>
    <button class="linkbtn" id="bingoreset" type="button">🔄 לוח חדש</button></section>`;
}
function renderRoad() { return quizHTML() + bingoHTML(); }
document.addEventListener("click", e => {
  const o = e.target.closest(".qopt[data-qi]");
  if (o && !o.disabled) { const qi = +o.dataset.qi, ch = +o.dataset.ch; roadPick = { qi, choice: ch }; roadAdd({ k: "q", fam, qi, ch, ok: ch === 0 }); render(); return; }
  if (e.target.closest("#qnext")) { roadPick = null; render(); window.scrollTo({ top: 0 }); return; }
  const c = e.target.closest(".bcell[data-b]");
  if (c) { const m = store.get(bingoKey(), {}), i = +c.dataset.b, before = bingoLines(m); m[i] = !m[i]; store.set(bingoKey(), m); const after = bingoLines(m);
    if (after > before) { toast("🎉 בינגו!"); roadAdd({ k: "bingo", fam, day: today, n: after }); } render(); return; }
  if (e.target.closest("#bingoreset")) { askBingoPw(); return; }
});
addEventListener("online", roadSync);
setInterval(() => { if (document.visibilityState === "visible") roadSync(); }, 60000);
setTimeout(roadSync, 4000);

/* "New board" needs the family password (checked by trying to open the vault, so the password itself is never in the code). */
function askBingoPw() {
  let sh = document.getElementById("bingopw");
  if (!sh) {
    document.body.insertAdjacentHTML("beforeend", `<div class="scrim" id="bingopw" hidden><form class="sheet" id="bingopwform" autocomplete="off">
      <h2>🔄 לוח בינגו חדש</h2><p>כדי למחוק את הלוח הנוכחי ולהתחיל מחדש, מקלידים את הסיסמה המשפחתית.</p>
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
      store.set(bingoKey(), {}); sh.hidden = true; render(); toast("לוח חדש 🎯");
    };
  }
  document.getElementById("bingopwerr").textContent = ""; document.getElementById("bingopwin").value = ""; sh.hidden = false;
  setTimeout(() => document.getElementById("bingopwin").focus(), 50);
}
