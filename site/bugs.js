/* Bug tickets: anyone opens a ticket (name required). It is saved in a shared inbox (jsonblob.com, no account needed),
   a GitHub Action copies new tickets into site/bugs.json in git every 15 minutes, and Claude reads and marks them there.
   Nothing is sent to anyone. Tickets wait in a queue on the phone until the inbox confirms them. */
const BUG_API = "https://jsonblob.com/api/jsonBlob/";
const BUG_NAMES = ["חי", "מור", "מאור", "רום", "אדם", "עדי", "אורי", "פלג", "ליאן", "איציק", "נופר"];
let BUGS = [], INBOX = [];
const bugQ = () => store.get("bugq", []);
async function bugDB() {
  if (bugDB.id) return bugDB.id;
  const r = await fetch("bugs-db.json?t=" + Date.now(), { cache: "no-store" }); if (!r.ok) return null;
  return bugDB.id = (await r.json()).id || null;
}
async function bugInbox(id) {
  const r = await fetch(BUG_API + id, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error("inbox " + r.status);
  const j = await r.json(); return Array.isArray(j.tickets) ? j.tickets : [];
}
/* Push queued tickets to the inbox; a ticket leaves the queue only after it is read back from the inbox. */
async function flushBugs() {
  if (flushBugs.busy) return; flushBugs.busy = true;
  try {
    const id = await bugDB(); if (!id) return;
    let q = bugQ();
    INBOX = await bugInbox(id);
    const missing = q.filter(t => !INBOX.some(x => x.id === t.id));
    if (missing.length) {
      const r = await fetch(BUG_API + id, { method: "PUT", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ tickets: [...INBOX, ...missing] }) });
      if (r.ok) INBOX = await bugInbox(id);
    }
    q = bugQ().filter(t => !INBOX.some(x => x.id === t.id)); store.set("bugq", q);
  } catch (e) { } finally { flushBugs.busy = false; drawBugList(); }
}
async function loadBugs() {
  try { const r = await fetch("bugs.json?t=" + Date.now(), { cache: "no-store" }); if (r.ok) BUGS = await r.json(); } catch (e) { }
  drawBugList(); flushBugs();
}
function bugTabName() { const t = document.querySelector('.tab[aria-selected="true"]'); return t ? t.textContent.trim() : ""; }
function drawBugList() {
  const el = $("#buglist"); if (!el) return;
  const seen = new Set(BUGS.map(b => b.id));
  const all = [...BUGS];
  for (const t of INBOX) if (!seen.has(t.id)) { seen.add(t.id); all.push({ ...t, s: "open" }); }
  for (const t of bugQ()) if (!seen.has(t.id)) { seen.add(t.id); all.push({ ...t, s: "queued" }); }
  if (!all.length) { el.innerHTML = `<p>עוד אין טיקטים.</p>`; return; }
  const lab = { open: ["🔴", "פתוח"], fixed: ["✅", "תוקן"], queued: ["⏳", "ממתין לאינטרנט, יישמר אוטומטית"], wont: ["⚪", "לא יתוקן"] };
  all.sort((a, b) => (b.at || "").localeCompare(a.at || ""));
  el.innerHTML = all.map(b => { const [i, l] = lab[b.s] || lab.open; return `<li><div><b>${i} ${esc(b.t)}</b><span class="bmeta">#${esc(b.id)} · נפתח ע"י <b>${esc(b.by)}</b> · ${l}</span>${b.fix ? `<span class="bfix">🔧 ${esc(b.fix)}</span>` : ""}</div></li>`; }).join("");
}
function openBugSheet() {
  const s = $("#bugsheet"); s.hidden = false;
  $("#bugtab").textContent = bugTabName();
  $("#bugby").value = store.get("bugby", ""); $("#bugerr").textContent = "";
  $("#bugt").value = ""; $("#bugd").value = "";
  drawBugList(); loadBugs();
  setTimeout(() => ($("#bugby").value ? $("#bugt") : $("#bugby")).focus(), 50);
}
async function sendBug(ev) {
  ev.preventDefault();
  const by = $("#bugby").value.trim(), t = $("#bugt").value.trim(), d = $("#bugd").value.trim();
  if (!by) { $("#bugerr").textContent = "חובה לרשום מי פותח את הטיקט."; $("#bugby").focus(); return; }
  if (!t) { $("#bugerr").textContent = "חסר: מה הבעיה?"; $("#bugt").focus(); return; }
  store.set("bugby", by);
  const now = new Date(), id = now.toISOString().slice(5, 16).replace(/[-T:]/g, "").slice(0, 8) + Math.random().toString(36).slice(2, 4);
  const tk = { id, by, t, d, at: now.toISOString(), tab: bugTabName(), fam: typeof fam !== "undefined" ? fam : "", ver: typeof APP_VERSION !== "undefined" ? APP_VERSION : "", ua: navigator.userAgent.replace(/\s+/g, " ").slice(0, 120), w: innerWidth + "x" + innerHeight };
  const q = bugQ(); q.push(tk); store.set("bugq", q);
  drawBugList(); await flushBugs();
  toast(bugQ().some(x => x.id === id) ? "נשמר בטלפון, יישלח כשיהיה אינטרנט" : "הטיקט נשמר 👍");
  $("#bugt").value = ""; $("#bugd").value = ""; drawBugList();
}
(function initBugs() {
  document.body.insertAdjacentHTML("beforeend", `<button class="bugfab" id="bugfab" type="button" aria-label="פתיחת טיקט באג">🐞</button>
<div class="scrim" id="bugsheet" hidden><form class="sheet bugsheet" id="bugform" autocomplete="off">
  <h2>🐞 פתיחת טיקט באג</h2>
  <p>משהו לא עובד? כתבו מה קרה. הטיקט נשמר ברשימה המשותפת, ואחר כך נעבור על כל הבאגים ונתקן.</p>
  <label>מי פותח את הטיקט? <em>(חובה)</em><input id="bugby" list="bugnames" maxlength="30" placeholder="השם שלך"></label>
  <datalist id="bugnames">${BUG_NAMES.map(n => `<option value="${n}">`).join("")}</datalist>
  <label>מה הבעיה?<input id="bugt" maxlength="90" placeholder="למשל: מזג האוויר לא מתעדכן"></label>
  <label>פרטים (לא חובה)<textarea id="bugd" rows="3" placeholder="מה עשיתם, מה ציפיתם שיקרה ומה קרה בפועל"></textarea></label>
  <p class="bugctx">לשונית: <b id="bugtab"></b> · הגרסה, הטלפון והשעה מצורפים אוטומטית.</p>
  <div class="err" id="bugerr" role="alert"></div>
  <div class="btns"><button type="button" id="bugcancel">סגירה</button><button type="submit" class="go">שמירת הטיקט</button></div>
  <h3>טיקטים</h3><ul class="buglist" id="buglist"></ul>
</form></div>`);
  $("#bugfab").onclick = openBugSheet;
  $("#bugcancel").onclick = () => $("#bugsheet").hidden = true;
  $("#bugsheet").onclick = e => { if (e.target.id === "bugsheet") $("#bugsheet").hidden = true; };
  $("#bugform").onsubmit = sendBug;
  addEventListener("online", flushBugs); setTimeout(flushBugs, 3000);
})();
