// Fetches live status for the trip's flights from AeroDataBox (RapidAPI) and writes site/flights.json.
// Runs from the scheduled GitHub Action. Needs the AERODATABOX_KEY secret; without it, exits quietly.
import { writeFileSync } from "node:fs";

const KEY = process.env.AERODATABOX_KEY;
const OUT = process.argv[2] || "site/flights.json";

// Watch each flight from 24h before departure until 4h after.
const FLIGHTS = [
  { key: "B6 377", num: "B6377", date: "2026-11-20", dep: "2026-11-20T08:45:00-05:00" },
  { key: "B6 1700", num: "B61700", date: "2026-11-26", dep: "2026-11-26T08:30:00-08:00" },
];

if (!KEY) { console.log("No AERODATABOX_KEY secret, skipping flight status."); process.exit(0); }

const now = Date.now();
const active = FLIGHTS.filter(f => {
  const t = new Date(f.dep).getTime();
  return now >= t - 24 * 3600e3 && now <= t + 4 * 3600e3;
});
if (!active.length) { console.log("No flight in its watch window."); process.exit(0); }

const pick = (o, ...path) => path.reduce((a, k) => (a == null ? a : a[k]), o) ?? null;
const result = { updated: new Date().toISOString(), source: "AeroDataBox", flights: {} };

for (const f of active) {
  const url = `https://aerodatabox.p.rapidapi.com/flights/number/${f.num}/${f.date}?withAircraftImage=false&withLocation=false`;
  try {
    const r = await fetch(url, { headers: { "X-RapidAPI-Key": KEY, "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com" } });
    if (!r.ok) { console.log(f.key, "HTTP", r.status); continue; }
    const arr = await r.json();
    const x = Array.isArray(arr) ? arr[0] : arr;
    if (!x) { console.log(f.key, "no data"); continue; }
    result.flights[f.key] = {
      status: x.status ?? null,
      depSched: pick(x, "departure", "scheduledTime", "local"),
      depRevised: pick(x, "departure", "revisedTime", "local") ?? pick(x, "departure", "runwayTime", "local"),
      depTerminal: pick(x, "departure", "terminal"),
      depGate: pick(x, "departure", "gate"),
      arrSched: pick(x, "arrival", "scheduledTime", "local"),
      arrRevised: pick(x, "arrival", "revisedTime", "local") ?? pick(x, "arrival", "predictedTime", "local"),
      arrTerminal: pick(x, "arrival", "terminal"),
      baggage: pick(x, "arrival", "baggageBelt"),
    };
    console.log(f.key, JSON.stringify(result.flights[f.key]));
  } catch (e) {
    console.log(f.key, "error", e.message);
  }
}

if (Object.keys(result.flights).length) writeFileSync(OUT, JSON.stringify(result, null, 1));
