/* Bug tickets: anyone in the family opens a ticket (name required), it is sent to Hai via the phone's share sheet / WhatsApp,
   Hai pastes it to Claude, and Claude publishes the status in bugs.json so everyone sees the list. */
const BUG_NAMES = ["חי", "מור", "מאור", "רום", "אדם", "עדי", "אורי", "פלג", "ליאן", "איציק", "נופר"];
let BUGS = [];
async function loadBugs() {
  try { const r = await fetch("bugs.json?t=" + Date.now(), { cache: "no-store" }); if (r.ok) BUGS = await r.json(); } catch (e) { }
  drawBugList();
}
function bugTabName() { const t = document.querySelector('.tab[aria-selected="true"]'); return t ? t.textContent.trim() : ""; }
function drawBugList() {
  const el = $("#buglist"); if (!el) return;
  const mine = store.get("mybugs", []);
  const all = [...BUGS, ...mine.filter(m => !BUGS.some(b => b.id === m.id)).map(m => ({ ...m, s: "sent" }))];
  if (!all.length) { el.innerHTML = `<p>עוד אין טיקטים.</p>`; return; }
  const lab = { open: ["🔴", "פתוח"], fixed: ["✅", "תוקן"], sent: ["📤", "נשלח, עוד לא טופל"], wont: ["⚪", "לא יתוקן"] };
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
  const text = `🐞 טיקט באג #${tk.id}\n👤 נפתח ע"י: ${tk.by}\n📝 ${tk.t}${tk.d ? "\n" + tk.d : ""}\n\n📍 לשונית: ${tk.tab} · משפחה: ${tk.fam}\n🕒 ${now.toLocaleString("he-IL")}\n⚙️ גרסה ${tk.ver} · מסך ${tk.w}\n📱 ${tk.ua}`;
  const mine = store.get("mybugs", []); mine.push({ id, by, t, at: tk.at }); store.set("mybugs", mine);
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text).catch(() => { }); location.href = "https://wa.me/?text=" + encodeURIComponent(text); }
    toast("הטיקט נשלח 👍");
  } catch (e) {
    try { await navigator.clipboard.writeText(text); toast("הטיקט הועתק. הדביקו בוואטסאפ לחי"); } catch (e2) { toast("לא הצלחתי לשתף"); }
  }
  $("#bugt").value = ""; $("#bugd").value = ""; drawBugList();
}
(function initBugs() {
  document.body.insertAdjacentHTML("beforeend", `<button class="bugfab" id="bugfab" type="button" aria-label="פתיחת טיקט באג">🐞</button>
<div class="scrim" id="bugsheet" hidden><form class="sheet bugsheet" id="bugform" autocomplete="off">
  <h2>🐞 פתיחת טיקט באג</h2>
  <p>משהו לא עובד? כתבו מה קרה. הטיקט יישלח לחי בוואטסאפ, ואז נעבור על הבאגים ונתקן.</p>
  <label>מי פותח את הטיקט? <em>(חובה)</em><input id="bugby" list="bugnames" maxlength="30" placeholder="השם שלך"></label>
  <datalist id="bugnames">${BUG_NAMES.map(n => `<option value="${n}">`).join("")}</datalist>
  <label>מה הבעיה?<input id="bugt" maxlength="90" placeholder="למשל: מזג האוויר לא מתעדכן"></label>
  <label>פרטים (לא חובה)<textarea id="bugd" rows="3" placeholder="מה עשיתם, מה ציפיתם שיקרה ומה קרה בפועל"></textarea></label>
  <p class="bugctx">לשונית: <b id="bugtab"></b> · הגרסה, הטלפון והשעה מצורפים אוטומטית.</p>
  <div class="err" id="bugerr" role="alert"></div>
  <div class="btns"><button type="button" id="bugcancel">סגירה</button><button type="submit" class="go">שליחת הטיקט</button></div>
  <h3>טיקטים</h3><ul class="buglist" id="buglist"></ul>
</form></div>`);
  $("#bugfab").onclick = openBugSheet;
  $("#bugcancel").onclick = () => $("#bugsheet").hidden = true;
  $("#bugsheet").onclick = e => { if (e.target.id === "bugsheet") $("#bugsheet").hidden = true; };
  $("#bugform").onsubmit = sendBug;
})();
