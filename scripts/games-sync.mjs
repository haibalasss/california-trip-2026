// Copies the games' shared data from the ntfy.sh inboxes into git, so nothing is lost when the inbox forgets (files after 3h, messages after 12h):
//  1. Nature hunt photos -> site/nature/<file>.jpg + site/nature/index.json  (deleted photos are removed; "del <file>" messages)
//  2. Bingo / trivia events -> site/road-archive.json  (append only: a backup that can restore the marks; never removes anything)
import fs from "fs";
const BASE = process.env.NTFY_BASE || "https://ntfy.sh/";
const topic = (file, name) => new RegExp(`${name} = "([^"]+)"`).exec(fs.readFileSync(file, "utf8"))[1];
const poll = async t => { const r = await fetch(`${BASE}${t}/json?poll=1&since=all`); if (!r.ok) throw new Error("poll " + t + " " + r.status); return (await r.text()).split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(m => m && m.event === "message"); };
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return d; } };

// 1. nature
const RE = /^n(\d+)_(\d+)_([0-9a-z]+)_([0-9a-z]+)\.jpg$/;
const nmsgs = await poll(topic("site/nature.js", "NAT_TOPIC"));
fs.mkdirSync("site/nature", { recursive: true });
const idx = readJson("site/nature/index.json", { photos: [], deleted: [] });
idx.photos ||= []; idx.deleted ||= [];
const dels = new Set(idx.deleted);
nmsgs.forEach(m => { if (typeof m.message === "string" && m.message.startsWith("del ")) dels.add(m.message.slice(4).trim()); });
let added = 0, removed = 0;
for (const m of nmsgs) {
  const a = m.attachment; if (!a || !a.name || !a.url) continue;
  const g = RE.exec(a.name); if (!g || dels.has(a.name) || idx.photos.some(p => p.file === a.name)) continue;
  if (a.size > 3e6) continue;
  const r = await fetch(a.url); if (!r.ok) { console.log("skip (download failed)", a.name, r.status); continue; }
  fs.writeFileSync("site/nature/" + a.name, Buffer.from(await r.arrayBuffer()));
  idx.photos.push({ file: a.name, item: +g[1], kid: +g[2], at: parseInt(g[3], 36), dev: g[4] }); added++;
}
idx.photos = idx.photos.filter(p => { if (dels.has(p.file)) { try { fs.unlinkSync("site/nature/" + p.file); } catch (e) { } removed++; return false; } return true; });
idx.deleted = [...dels];
idx.photos.sort((a, b) => a.at - b.at);
fs.writeFileSync("site/nature/index.json", JSON.stringify(idx) + "\n");
console.log(`nature: +${added} -${removed}, total ${idx.photos.length}`);

// 2. road archive (append only)
const rmsgs = await poll(topic("site/road.js", "ROAD_TOPIC"));
const arc = readJson("site/road-archive.json", []), ids = new Set(arc.map(e => e.id));
let n = 0;
for (const m of rmsgs) { try { const e = JSON.parse(m.message); if (e && e.id && !ids.has(e.id)) { ids.add(e.id); arc.push(e); n++; } } catch (e) { } }
fs.writeFileSync("site/road-archive.json", JSON.stringify(arc) + "\n");
console.log(`road archive: +${n}, total ${arc.length}`);
