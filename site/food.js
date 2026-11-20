/* ---------- Food tab: family-friendly places within walking distance ----------
   Location: the phone's GPS (asked only when the tab is opened), or the next stop of the selected day.
   Data: OpenStreetMap via the Overpass API (free, no key). Family score from OSM tags + cuisine. */
const FOOD = { mode: store.get("foodmode", "gps"), status: "idle", items: [], where: null, err: "", at: null, radius: 900 };

const CUISINE_HE = { pizza: "פיצה", burger: "המבורגרים", american: "אמריקאי", diner: "דיינר", mexican: "מקסיקני", italian: "איטלקי", pancake: "פנקייקים", breakfast: "ארוחת בוקר",
  sandwich: "סנדוויצ'ים", chicken: "עוף", ice_cream: "גלידה", donut: "דונאטס", bagel: "בייגלס", noodle: "נודלס", sushi: "סושי", japanese: "יפני", chinese: "סיני",
  thai: "תאילנדי", indian: "הודי", seafood: "פירות ים", fish_and_chips: "פיש אנד צ'יפס", steak_house: "סטייקים", coffee_shop: "קפה", bakery: "מאפייה",
  vietnamese: "וייטנאמי", korean: "קוריאני", mediterranean: "ים תיכוני", greek: "יווני", french: "צרפתי", vegan: "טבעוני", vegetarian: "צמחוני",
  hot_dog: "נקניקיות", tacos: "טאקו", burrito: "בוריטו", frozen_yogurt: "פרוזן יוגורט", chocolate: "שוקולד", crepe: "קרפים", salad: "סלטים", bbq: "ברביקיו", ramen: "ראמן" };
const KID_CUISINE = /pizza|burger|american|diner|mexican|italian|pancake|breakfast|sandwich|chicken|ice_cream|donut|bagel|noodle|hot_dog|tacos|burrito|frozen_yogurt|crepe|fish_and_chips|chocolate|bbq/;
const AMENITY_HE = { restaurant: "מסעדה", fast_food: "אוכל מהיר", cafe: "בית קפה", ice_cream: "גלידרייה", food_court: "מתחם אוכל" };

function haversine(a, b) { const R = 6371000, r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }

/* Minimal opening_hours parser for the common forms ("Mo-Fr 07:00-15:00; Sa,Su 08:00-14:00", "24/7"). Returns true / false / null (unknown). */
function openNow(oh, now = new Date()) {
  if (!oh) return null; oh = oh.trim(); if (oh === "24/7") return true;
  const D = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"], day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
  let result = null;
  for (const rule of oh.split(";").map(x => x.trim()).filter(Boolean)) {
    const m = rule.match(/^((?:[A-Z][a-z](?:-[A-Z][a-z])?,?)+)?\s*(.*)$/); if (!m) return null;
    const daysPart = m[1], times = (m[2] || "").trim();
    let days = [0, 1, 2, 3, 4, 5, 6], prevDays = [];
    if (daysPart) { days = []; for (const seg of daysPart.split(",").filter(Boolean)) { const [a, b] = seg.split("-"); const ia = D.indexOf(a), ib = b ? D.indexOf(b) : ia; if (ia < 0 || ib < 0) return null;
      for (let i = ia; ; i = (i + 1) % 7) { days.push(i); if (i === ib) break; } } }
    if (/^off$|^closed$/i.test(times)) { if (days.includes(day)) result = false; continue; }
    if (!/^\d/.test(times)) return null;
    let hit = false;
    for (const tr of times.split(",")) { const t = tr.trim().match(/^(\d\d):(\d\d)-(\d\d):(\d\d)\+?$/); if (!t) return null;
      const s = +t[1] * 60 + +t[2], e = +t[3] * 60 + +t[4];
      if (e > s) { if (days.includes(day) && mins >= s && mins < e) hit = true; }
      else { if (days.includes(day) && mins >= s) hit = true; if (days.includes((day + 6) % 7) && mins < e) hit = true; } }
    if (days.includes(day) || hit) result = hit ? true : (result === true ? true : false);
  }
  return result;
}

function familyScore(t, dist) {
  let s = 0; const c = (t.cuisine || "").toLowerCase(), n = (t.name || "");
  if (t.highchair === "yes") s += 3; if (t.kids_area === "yes" || t["kids_area:indoor"] === "yes") s += 3; if (t.changing_table === "yes") s += 2;
  if (KID_CUISINE.test(c)) s += 2; if (/fast_food|ice_cream|food_court/.test(t.amenity)) s += 1;
  if (t.wheelchair === "yes") s += 0.5; if (t.opening_hours) s += 0.5;
  if (/\b(bar|lounge|tavern|pub|wine|cocktail|saloon)\b/i.test(n) || t["diet:alcohol"] === "only") s -= 3;
  if (/fine_dining|tasting/.test(c)) s -= 2;
  return s - dist / 350;
}

async function overpass(ll, radius) {
  const q = `[out:json][timeout:20];(nwr["amenity"~"^(restaurant|fast_food|cafe|ice_cream|food_court)$"]["name"](around:${radius},${ll[0]},${ll[1]}););out center tags 120;`;
  const urls = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
  for (const u of urls) {
    try { const r = await fetch(u + "?data=" + encodeURIComponent(q), { signal: tmo(20000) }); if (r.ok) return (await r.json()).elements || []; } catch (e) { }
  }
  throw new Error("overpass");
}

function nextStopLL() {
  const d = daysFor(fam)[dayIdx], done = doneSet(d);
  const s = d.stops.map((x, i) => [x, i]).filter(([x, i]) => forFam(x) && !done.has(i))[0];
  return s ? { ll: s[0].ll, label: s[0].n } : { ll: d.stops[d.stops.length - 1].ll, label: d.stops[d.stops.length - 1].n };
}

function getGPS() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error("nogeo"));
    navigator.geolocation.getCurrentPosition(p => res([p.coords.latitude, p.coords.longitude]), e => rej(e), { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 });
  });
}

async function loadFood() {
  FOOD.status = "loading"; FOOD.err = ""; drawFood();
  try {
    let where;
    if (FOOD.mode === "gps") { const ll = await getGPS(); where = { ll, label: "המיקום שלך" }; }
    else where = nextStopLL();
    FOOD.where = where;
    let els = await overpass(where.ll, FOOD.radius);
    if (els.length < 6 && FOOD.radius < 1600) els = await overpass(where.ll, 1600);
    const items = els.map(e => { const t = e.tags || {}, ll = e.lat != null ? [e.lat, e.lon] : e.center ? [e.center.lat, e.center.lon] : null; if (!ll) return null;
      const dist = haversine(where.ll, ll); return { t, ll, dist, open: openNow(t.opening_hours), score: familyScore(t, dist) }; }).filter(Boolean);
    items.forEach(x => { x.rank = x.score + (x.open === true ? 1.5 : x.open === false ? -4 : 0); });
    items.sort((a, b) => b.rank - a.rank);
    FOOD.items = items.slice(0, 15); FOOD.at = new Date(); FOOD.status = "done";
  } catch (e) {
    FOOD.status = "error";
    FOOD.err = e && e.code === 1 ? "לא אישרתם גישה למיקום. אפשר לאשר בהגדרות הדפדפן, או לבחור \"ליד התחנה הבאה\"."
      : e && (e.code === 2 || e.code === 3 || e.message === "nogeo") ? "לא הצלחתי לקבל מיקום. נסו שוב, או בחרו \"ליד התחנה הבאה\"."
      : "אין חיבור לשירות המפות כרגע. נסו שוב בעוד רגע.";
  }
  drawFood();
}

function foodTags(t) {
  const b = [];
  if (t.highchair === "yes") b.push("👶 כיסא תינוק"); if (t.kids_area === "yes" || t["kids_area:indoor"] === "yes") b.push("🛝 פינת משחקים");
  if (t.changing_table === "yes") b.push("🚼 משטח החתלה"); if (t.outdoor_seating === "yes") b.push("☀️ ישיבה בחוץ");
  if (t.takeaway === "yes" || t.takeaway === "only") b.push("🥡 טייק אווי"); if (t["diet:vegetarian"] === "yes" || t["diet:vegetarian"] === "only") b.push("🥗 צמחוני");
  if (/kosher/.test(t["diet:kosher"] || "") || t["diet:kosher"] === "yes") b.push("✡️ כשר");
  return b;
}

function drawFood() {
  const box = document.getElementById("foodlist"); if (!box) return;
  const loc = FOOD.where ? `<p class="src">${FOOD.mode === "gps" ? "📍 ליד המיקום שלך" : "🧭 ליד: " + esc(FOOD.where.label)}${FOOD.at ? " · עודכן ב-" + FOOD.at.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : ""}</p>` : "";
  if (FOOD.status === "loading") { box.innerHTML = `<div class="fload"><span class="sk"></span>${FOOD.mode === "gps" ? "מאתר מיקום ומחפש מסעדות קרובות…" : "מחפש מסעדות ליד התחנה…"}</div>`; return; }
  if (FOOD.status === "error") { box.innerHTML = `<div class="alert"><span class="dot"></span><div>${esc(FOOD.err)}</div></div>`; return; }
  if (FOOD.status !== "done") { box.innerHTML = ""; return; }
  if (!FOOD.items.length) { box.innerHTML = loc + `<p class="src">לא נמצאו מקומות אוכל במרחק הליכה.</p>`; return; }
  box.innerHTML = loc + FOOD.items.map(x => { const t = x.t, min = Math.max(1, Math.round(x.dist / 80));
    const cu = (t.cuisine || "").split(/[;,]/).map(c => CUISINE_HE[c.trim()] || "").filter(Boolean).slice(0, 2).join(" · ");
    const tags = foodTags(t), fam = x.score >= 2.5;
    return `<article class="fitem">
      <div class="fi-h"><b>${esc(t.name)}</b><span class="fi-d">🚶 ${min} דק'</span></div>
      <div class="fi-m"><span>${esc(AMENITY_HE[t.amenity] || "")}${cu ? " · " + esc(cu) : ""}</span>${x.open === true ? `<span class="op">פתוח עכשיו</span>` : x.open === false ? `<span class="cl">סגור עכשיו</span>` : ""}${fam ? `<span class="fam">👨‍👩‍👧 מתאים למשפחות</span>` : ""}</div>
      ${tags.length ? `<div class="fi-t">${tags.map(esc).join(" · ")}</div>` : ""}
      ${t.opening_hours ? `<div class="fi-o">🕒 <span dir="ltr">${esc(t.opening_hours)}</span></div>` : ""}
      <div class="actions"><a class="btn primary" href="https://www.google.com/maps/dir/?api=1&destination=${x.ll.join(",")}&travelmode=walking" target="_blank" rel="noopener">הליכה לשם</a>
        ${t.phone || t["contact:phone"] ? `<a class="btn" href="tel:${esc((t.phone || t["contact:phone"]).replace(/[^+\d]/g, ""))}">${esc(t.phone || t["contact:phone"])}</a>` : ""}
        ${t.website || t["contact:website"] ? `<a class="btn" href="${esc(t.website || t["contact:website"])}" target="_blank" rel="noopener">אתר / תפריט</a>` : ""}</div></article>`; }).join("") +
    `<p class="src">הנתונים מ-OpenStreetMap. סימון "מתאים למשפחות" מבוסס על סוג המטבח ועל כיסא תינוק או פינת משחקים כשהם מסומנים במפה. כדאי לבדוק שעות לפני שהולכים, במיוחד בחג ההודיה.</p>`;
}

function renderFood() {
  return `<section class="group"><h2>🍽️ אוכל קרוב, במרחק הליכה</h2>
    <div class="seg" role="group" aria-label="חיפוש לפי"><button class="segb" data-fm="gps" aria-pressed="${FOOD.mode === "gps"}">📍 לידי עכשיו</button><button class="segb" data-fm="stop" aria-pressed="${FOOD.mode === "stop"}">🧭 ליד התחנה הבאה</button></div>
    <button class="btn primary fsearch" id="foodgo" type="button">${FOOD.status === "done" ? "🔄 חיפוש מחדש" : "חיפוש מסעדות"}</button>
    <div id="foodlist"></div></section>`;
}
function initFood() {
  document.querySelectorAll("[data-fm]").forEach(b => b.onclick = () => { FOOD.mode = b.dataset.fm; store.set("foodmode", FOOD.mode); document.querySelectorAll("[data-fm]").forEach(x => x.setAttribute("aria-pressed", x === b)); loadFood(); });
  $("#foodgo").onclick = loadFood;
  if (FOOD.status === "idle" && FOOD.mode === "stop") loadFood(); else drawFood();
}
