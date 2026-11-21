// Copies bug tickets that phones posted to the shared inbox (an ntfy.sh topic, free, no account) into site/bugs.json in git.
// ntfy keeps messages ~12 hours, and this runs every 15 minutes, so nothing is lost.
// Git is the source of truth for status ("open" | "fixed" | "wont") and fix notes; the inbox only adds new tickets.
import fs from "fs";
const DBF = "site/bugs-db.json", BF = "site/bugs.json";
const { topic } = JSON.parse(fs.readFileSync(DBF, "utf8"));
const r = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=all`);
console.log("inbox", r.status);
if (!r.ok) throw new Error("read failed " + r.status);
const inbox = (await r.text()).split("\n").filter(Boolean).map(l => { try { const m = JSON.parse(l); return m.event === "message" ? JSON.parse(m.message) : null; } catch (e) { return null; } }).filter(Boolean);
const bugs = fs.existsSync(BF) ? JSON.parse(fs.readFileSync(BF, "utf8")) : [];
const clean = (v, n) => String(v ?? "").slice(0, n);
let added = 0;
for (const t of inbox) {
  if (!t.id || !t.by || bugs.some(b => b.id === t.id)) continue;
  bugs.push({ id: clean(t.id, 20), by: clean(t.by, 30), t: clean(t.t, 90), d: clean(t.d, 1000), at: clean(t.at, 30), tab: clean(t.tab, 30), fam: clean(t.fam, 2), ver: clean(t.ver, 30), w: clean(t.w, 20), ua: clean(t.ua, 160), s: "open" });
  added++;
}
fs.writeFileSync(BF, JSON.stringify(bugs, null, 1) + "\n");
console.log("new tickets:", added, "total:", bugs.length);
