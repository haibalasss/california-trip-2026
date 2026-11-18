// Flight status without any API key: reads the public FlightAware flight page
// (falls back to FlightStats) on GitHub's servers and writes site/flights.json.
// The phone only ever downloads that small JSON file, in the background.
//
// Usage: node scripts/flights.mjs [out.json]      (normal, only inside each flight's watch window)
//        PROBE=1 node scripts/flights.mjs          (ignore the window; exit 1 if nothing could be read)
import { writeFileSync } from "node:fs";

const OUT = process.argv[2] || "site/flights.json";
const PROBE = process.env.PROBE === "1";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const FLIGHTS = [
  { key: "B6 377", icao: "JBU377", iata: ["B6", "377"], date: "2026-11-20", dep: "2026-11-20T08:45:00-05:00", tzDep: "America/New_York", tzArr: "America/Los_Angeles" },
  { key: "B6 1700", icao: "JBU1700", iata: ["B6", "1700"], date: "2026-11-26", dep: "2026-11-26T08:30:00-08:00", tzDep: "America/Los_Angeles", tzArr: "America/New_York" },
];

const now = Date.now();
const active = PROBE ? FLIGHTS : FLIGHTS.filter(f => {
  const t = new Date(f.dep).getTime();
  return now >= t - 24 * 3600e3 && now <= t + 4 * 3600e3;
});
if (!active.length) { console.log("No flight in its watch window."); process.exit(0); }

// "2026-11-20 08:45" in the airport's own time zone
const local = (epochSec, tz) => {
  if (!epochSec) return null;
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(epochSec * 1000)).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
};

async function get(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html", "Accept-Language": "en-US" }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

function balancedJson(html, marker) {
  const i = html.indexOf(marker); if (i < 0) return null;
  const s = html.indexOf("{", i); if (s < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let k = s; k < html.length; k++) {
    const c = html[k];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true; else if (c === "{") depth++; else if (c === "}" && --depth === 0) return JSON.parse(html.slice(s, k + 1));
  }
  return null;
}

async function fromFlightAware(f) {
  const html = await get(`https://www.flightaware.com/live/flight/${f.icao}`);
  const boot = balancedJson(html, "trackpollBootstrap");
  if (!boot || !boot.flights) throw new Error("no trackpollBootstrap");
  const legs = Object.values(boot.flights).flatMap(fl => [fl, ...((fl.activityLog && fl.activityLog.flights) || [])]);
  const target = new Date(f.dep).getTime() / 1000;
  const leg = legs
    .filter(l => l && l.gateDepartureTimes && l.gateDepartureTimes.scheduled)
    .sort((a, b) => Math.abs(a.gateDepartureTimes.scheduled - target) - Math.abs(b.gateDepartureTimes.scheduled - target))[0];
  if (!leg || Math.abs(leg.gateDepartureTimes.scheduled - target) > 6 * 3600) throw new Error("flight date not listed yet");
  const g = leg.gateDepartureTimes, a = leg.gateArrivalTimes || {};
  let status = "Expected";
  if (leg.cancelled) status = "Canceled";
  else if (leg.diverted) status = "Diverted";
  else if (a.actual || /arriv/i.test(leg.flightStatus || "")) status = "Arrived";
  else if (leg.takeoffTimes && leg.takeoffTimes.actual) status = "EnRoute";
  else if (g.actual) status = "Departed";
  else if (g.estimated && g.estimated - g.scheduled >= 15 * 60) status = "Delayed";
  return {
    status,
    depSched: local(g.scheduled, f.tzDep), depRevised: local(g.actual || g.estimated, f.tzDep),
    depTerminal: (leg.origin && leg.origin.terminal) || null, depGate: (leg.origin && leg.origin.gate) || null,
    arrSched: local(a.scheduled, f.tzArr), arrRevised: local(a.actual || a.estimated, f.tzArr),
    arrTerminal: (leg.destination && leg.destination.terminal) || null, baggage: null, src: "FlightAware",
  };
}

async function fromFlightStats(f) {
  const [y, m, d] = f.date.split("-");
  const html = await get(`https://www.flightstats.com/v2/flight-tracker/${f.iata[0]}/${f.iata[1]}?year=${y}&month=${+m}&date=${+d}`);
  const m2 = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  const data = m2 ? JSON.parse(m2[1]) : balancedJson(html, "__NEXT_DATA__");
  const fl = data && JSON.stringify(data).includes("flightState") ? findKey(data, "flight") : null;
  if (!fl || !fl.schedule) throw new Error("no flight in page");
  const s = fl.schedule, st = (fl.status && (fl.status.status || fl.status.statusDescription)) || "";
  const map = { Scheduled: "Expected", Departed: "Departed", "In Air": "EnRoute", Landed: "Arrived", Arrived: "Arrived", Cancelled: "Canceled", Canceled: "Canceled", Diverted: "Diverted", Delayed: "Delayed" };
  let status = map[st] || "Expected";
  if (status === "Expected" && fl.status && /delay/i.test(fl.status.delay && JSON.stringify(fl.status.delay) || "") ) status = "Delayed";
  const t = v => v ? String(v).replace("T", " ").slice(0, 16) : null;
  return {
    status,
    depSched: t(s.scheduledDeparture), depRevised: t(s.estimatedActualDeparture),
    depTerminal: fl.departureAirport && fl.departureAirport.terminal || null, depGate: fl.departureAirport && fl.departureAirport.gate || null,
    arrSched: t(s.scheduledArrival), arrRevised: t(s.estimatedActualArrival),
    arrTerminal: fl.arrivalAirport && fl.arrivalAirport.terminal || null, baggage: fl.arrivalAirport && fl.arrivalAirport.baggage || null, src: "FlightStats",
  };
}
function findKey(o, k) {
  if (!o || typeof o !== "object") return null;
  if (o[k] && typeof o[k] === "object" && o[k].schedule) return o[k];
  for (const v of Object.values(o)) { const r = findKey(v, k); if (r) return r; }
  return null;
}

const result = { updated: new Date().toISOString(), flights: {} };
for (const f of active) {
  for (const src of [fromFlightAware, fromFlightStats]) {
    try { result.flights[f.key] = await src(f); console.log(f.key, JSON.stringify(result.flights[f.key])); break; }
    catch (e) { console.log(f.key, src.name, "failed:", e.message); }
  }
}

const n = Object.keys(result.flights).length;
if (n && !PROBE) writeFileSync(OUT, JSON.stringify(result, null, 1));
if (PROBE) { console.log(`probe: ${n}/${active.length} flights read`); process.exit(n ? 0 : 1); }
