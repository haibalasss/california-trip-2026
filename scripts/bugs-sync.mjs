// Copies bug tickets that phones put in the shared inbox (jsonblob.com) into site/bugs.json in git.
// Git is the source of truth for status ("open" | "fixed" | "wont") and fix notes; the inbox only adds new tickets.
import fs from "fs";
const API = "https://jsonblob.com/api/jsonBlob";
const DBF = "site/bugs-db.json", BF = "site/bugs.json";
const hdr = { "Content-Type": "application/json", Accept: "application/json" };
let db = fs.existsSync(DBF) ? JSON.parse(fs.readFileSync(DBF, "utf8")) : {};
if (!db.id) {
  const r = await fetch(API, { method: "POST", headers: hdr, body: JSON.stringify({ tickets: [] }) });
  db.id = (r.headers.get("location") || "").split("/").pop();
  if (!r.ok || !db.id) throw new Error("create failed " + r.status);
  fs.writeFileSync(DBF, JSON.stringify(db) + "\n");
  console.log("created inbox", db.id);
}
const r = await fetch(`${API}/${db.id}`, { headers: { ...hdr, Origin: "https://example.org" } });
console.log("inbox", r.status, "CORS:", r.headers.get("access-control-allow-origin"));
if (!r.ok) throw new Error("read failed " + r.status);
const inbox = (await r.json()).tickets || [];
const bugs = fs.existsSync(BF) ? JSON.parse(fs.readFileSync(BF, "utf8")) : [];
const clean = (v, n) => String(v ?? "").slice(0, n);
let added = 0;
for (const t of inbox) {
  if (!t || !t.id || bugs.some(b => b.id === t.id)) continue;
  bugs.push({ id: clean(t.id, 20), by: clean(t.by, 30), t: clean(t.t, 90), d: clean(t.d, 1000), at: clean(t.at, 30), tab: clean(t.tab, 30), fam: clean(t.fam, 2), ver: clean(t.ver, 30), w: clean(t.w, 20), ua: clean(t.ua, 160), s: "open" });
  added++;
}
fs.writeFileSync(BF, JSON.stringify(bugs, null, 1) + "\n");
console.log("new tickets:", added, "total:", bugs.length);
