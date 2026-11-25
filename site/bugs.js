/* Bug tickets: anyone opens a ticket (name required). It is posted to a shared inbox (an ntfy.sh topic, free, no account),
   a GitHub Action copies new tickets into site/bugs.json in git every 15 minutes, and Claude reads and marks them there.
   Nothing is sent to anyone. Tickets wait in a queue on the phone until the inbox confirms them. */
const NTFY = "https://ntfy.sh/";
const BUG_NAMES = ["חי", "מור", "מאור", "רום", "אדם", "עדי", "אורי", "פלג", "ליאן", "איציק", "נופר"];
let BUGS = [], INBOX = [];
const bugQ = () => store.get("bugq", []);
async function bugDB() {
  if (bugDB.topic) return bugDB.topic;
  const r = await fetch("bugs-db.json?t=" + Date.now(), { cache: "no-store" }); if (!r.ok) return null;
  return bugDB.topic = (await r.json()).topic || null;
}
async function bugInbox(topic) {
  const r = await fetch(NTFY + topic + "/json?poll=1&since=all", { cache: "no-store" });
  if (!r.ok) throw new Error("inbox " + r.status);
  return (await r.text()).split("\n").filter(Boolean).map(l => { try { const m = JSON.parse(l); return m.event === "message" ? JSON.parse(m.message) : null; } catch (e) { return null; } }).filter(t => t && t.id);
}
/* Post queued tickets; a ticket leaves the phone's queue only after the inbox accepted it. */
async function flushBugs() {
  if (flushBugs.busy) return; flushBugs.busy = true;
  try {
    const topic = await bugDB(); if (!topic) return;
    for (const t of bugQ()) {
      const r = await fetch(NTFY + topic, { method: "POST", body: JSON.stringify(t) });
      if (r.ok) { INBOX.push(t); store.set("bugq", bugQ().filter(x => x.id !== t.id)); }
    }
    const got = await bugInbox(topic); INBOX = [...got, ...INBOX.filter(t => !got.some(g => g.id === t.id))];
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
  /* Closed tickets stay visible for 12 hours so the opener sees the answer, then leave the list (ticket 11212306b6).
     They are kept in git (site/bugs.json) as history. */
  const CLOSED = ["fixed", "notabug", "wont"], keep = 12 * 3600e3;
  const all = BUGS.filter(b => !CLOSED.includes(b.s) || (b.closed && Date.now() - Date.parse(b.closed) < keep));
  for (const t of INBOX) if (!seen.has(t.id)) { seen.add(t.id); all.push({ ...t, s: "open" }); }
  for (const t of bugQ()) if (!seen.has(t.id)) { seen.add(t.id); all.push({ ...t, s: "queued" }); }
  if (!all.length) { el.innerHTML = `<p>אין טיקטים פתוחים 🎉</p>`; return; }
  const lab = { open: ["🔴", "פתוח"], fixed: ["✅", "תוקן"], queued: ["⏳", "ממתין לאינטרנט, יישמר אוטומטית"], info: ["🟡", "המפתח צריך עוד פרטים"], notabug: ["🙅", "לא באג, לפי המפתח"], wont: ["⚪", "לא יתוקן"] };
  all.sort((a, b) => (b.n || 1e9) - (a.n || 1e9) || (b.at || "").localeCompare(a.at || ""));
  /* Collapsed: title + status. Tap to open details, the developer's reply and the fix. Open state survives refreshes. */
  const open = drawBugList.open || (drawBugList.open = new Set());
  el.querySelectorAll("details").forEach(d => d.open ? open.add(d.dataset.bid) : open.delete(d.dataset.bid));
  el.innerHTML = all.map(b => { let [i, l] = lab[b.s] || lab.open; if (b.k === "feature" && b.s === "fixed") l = "נוסף"; const kk = b.k === "feature" ? "✨ פיצ'ר" : b.k === "bug" ? "🐞 באג" : "";
    const body = `${b.d ? `<span class="bdesc">${esc(b.d)}</span>` : ""}${b.r ? `<span class="bdev">👨‍💻 המפתח: ${esc(b.r)}</span>` : ""}${b.fix ? `<span class="bfix">🔧 ${esc(b.fix)}</span>` : ""}${!b.d && !b.r && !b.fix ? `<span class="bmeta">עוד אין תגובה מהמפתח.</span>` : ""}`;
    return `<li><details data-bid="${esc(b.id)}"${open.has(b.id) ? " open" : ""}><summary><b>${i} <span class="bnum">#${b.n || "?"}</span> ${esc(b.t)}</b><span class="bmeta">${kk ? kk + " · " : ""}נפתח ע"י <b>${esc(b.by)}</b> · ${l}${b.r ? " · 💬" : ""}</span></summary><div class="bbody">${body}<span class="bmeta">טיקט מספר ${b.n || "ממתין למספר"}</span></div></details></li>`; }).join("");
}
let bugKind = "";
function setBugKind(k) {
  bugKind = k;
  document.querySelectorAll(".bugkind button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === k));
  $("#bugtl").textContent = k === "feature" ? "מה הפיצ'ר שאתם רוצים?" : "מה הבעיה?";
  $("#bugt").placeholder = k === "feature" ? "למשל: לעבור בין לשוניות בהחלקה" : "למשל: מזג האוויר לא מתעדכן";
}
function openBugSheet() {
  const s = $("#bugsheet"); s.hidden = false;
  $("#bugtab").textContent = bugTabName();
  $("#bugby").value = store.get("bugby", ""); $("#bugerr").textContent = "";
  $("#bugt").value = ""; $("#bugd").value = ""; setBugKind(""); $("#bugt").dispatchEvent(new Event("input"));
  drawBugList(); loadBugs();
  setTimeout(() => ($("#bugby").value ? $("#bugt") : $("#bugby")).focus(), 50);
}
async function sendBug(ev) {
  ev.preventDefault();
  const by = $("#bugby").value.trim(), t = $("#bugt").value.trim(), d = $("#bugd").value.trim();
  if (!by) { $("#bugerr").textContent = "חובה לרשום מי פותח את הטיקט."; $("#bugby").focus(); return; }
  if (!bugKind) { $("#bugerr").textContent = "חובה לבחור: באג או בקשה לפיצ'ר חדש."; return; }
  if (!t) { $("#bugerr").textContent = bugKind === "feature" ? "חסר: מה הפיצ'ר?" : "חסר: מה הבעיה?"; $("#bugt").focus(); return; }
  store.set("bugby", by);
  const now = new Date(), id = now.toISOString().slice(5, 16).replace(/[-T:]/g, "").slice(0, 8) + Math.random().toString(36).slice(2, 4);
  const tk = { id, k: bugKind, by, t, d, at: now.toISOString(), tab: bugTabName(), fam: typeof fam !== "undefined" ? fam : "", ver: typeof APP_VERSION !== "undefined" ? APP_VERSION : "", ua: navigator.userAgent.replace(/\s+/g, " ").slice(0, 120), w: innerWidth + "x" + innerHeight };
  const q = bugQ(); q.push(tk); store.set("bugq", q);
  drawBugList(); await flushBugs();
  toast(bugQ().some(x => x.id === id) ? "נשמר בטלפון, יישלח כשיהיה אינטרנט" : "הטיקט נשמר 👍");
  $("#bugt").value = ""; $("#bugd").value = ""; drawBugList();
}
(function initBugs() {
  document.body.insertAdjacentHTML("beforeend", `<button class="bugfab" id="bugfab" type="button" aria-label="פתיחת טיקט באג">🐞</button>
<div class="scrim" id="bugsheet" hidden><form class="sheet bugsheet" id="bugform" autocomplete="off">
  <h2>🐞 פתיחת טיקט</h2>
  <p>משהו לא עובד, או שיש לכם רעיון? הטיקט נשמר ברשימה המשותפת, ואחר כך נעבור על הכל.</p>
  <label>מי פותח את הטיקט? <em>(חובה)</em><input id="bugby" list="bugnames" maxlength="30" placeholder="השם שלך"></label>
  <datalist id="bugnames">${BUG_NAMES.map(n => `<option value="${n}">`).join("")}</datalist>
  <div class="bugkind" role="radiogroup" aria-label="סוג הטיקט"><button type="button" data-k="bug" aria-pressed="false">🐞 באג</button><button type="button" data-k="feature" aria-pressed="false">✨ בקשה לפיצ'ר חדש</button></div>
  <label><span id="bugtl">מה הבעיה?</span><input id="bugt" maxlength="150" placeholder="למשל: מזג האוויר לא מתעדכן"></label>
  <label>פרטים (לא חובה)<textarea id="bugd" rows="3" maxlength="1000" placeholder="מה עשיתם, מה ציפיתם שיקרה ומה קרה בפועל"></textarea></label>
  <p class="bugcount" id="bugcount" aria-live="polite"></p>
  <p class="bugctx">לשונית: <b id="bugtab"></b> · הגרסה, הטלפון והשעה מצורפים אוטומטית.</p>
  <div class="err" id="bugerr" role="alert"></div>
  <div class="btns"><button type="button" id="bugcancel">סגירה</button><button type="submit" class="go">שמירת הטיקט</button></div>
  <h3>טיקטים</h3><ul class="buglist" id="buglist"></ul>
</form></div>`);
  $("#bugfab").onclick = openBugSheet;
  document.querySelectorAll(".bugkind button").forEach(b => b.onclick = () => { setBugKind(b.dataset.k); $("#bugerr").textContent = ""; });
  const cnt = () => { const t = $("#bugt").value.length, d = $("#bugd").value.length; $("#bugcount").textContent = `כותרת ${t}/150 · פרטים ${d}/1000`; $("#bugcount").classList.toggle("near", t > 130 || d > 900); };
  $("#bugt").addEventListener("input", cnt); $("#bugd").addEventListener("input", cnt); cnt();
  $("#bugcancel").onclick = () => $("#bugsheet").hidden = true;
  $("#bugsheet").onclick = e => { if (e.target.id === "bugsheet") $("#bugsheet").hidden = true; };
  $("#bugform").onsubmit = sendBug;
  addEventListener("online", flushBugs); setTimeout(flushBugs, 3000);
})();
