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

const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
let overpassLast = store.get("overpassOK", 0), overpassErrs = [];
async function overpass(ll, radius) {
  const q = `[out:json][timeout:15];nwr["amenity"~"^(restaurant|fast_food|cafe|ice_cream|food_court)$"]["name"](around:${radius},${ll[0].toFixed(5)},${ll[1].toFixed(5)});out tags center 120;`;
  overpassErrs = [];
  const order = OVERPASS.map((u, i) => (i + overpassLast) % OVERPASS.length);   // start with the server that worked last time
  for (const i of order) {
    const u = OVERPASS[i], host = new URL(u).hostname;
    try {
      const r = await fetch(u, { method: "POST", body: new URLSearchParams({ data: q }), signal: tmo(12000) });
      if (!r.ok) { overpassErrs.push(`${host}: ${r.status}`); continue; }
      const j = await r.json();
      if (j.remark && /error|runtime/i.test(j.remark) && !(j.elements || []).length) { overpassErrs.push(`${host}: ${j.remark.slice(0, 60)}`); continue; }
      overpassLast = i; store.set("overpassOK", i);
      return j.elements || [];
    } catch (e) { overpassErrs.push(`${host}: ${e.name === "TimeoutError" || e.name === "AbortError" ? "timeout" : (e.message || "network")}`); }
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
      : "שירותי המפות לא ענו כרגע. נסו שוב בעוד רגע.";
    if (overpassErrs.length) FOOD.err += "\n" + overpassErrs.join(" · ");
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

const CUISINE_PHOTO = { pizza: "pizza slice", burger: "cheeseburger fries", american: "american diner food", diner: "american diner", mexican: "tacos mexican food", italian: "pasta italian food",
  pancake: "pancakes breakfast", breakfast: "breakfast pancakes", sandwich: "sandwich", chicken: "fried chicken", ice_cream: "ice cream cone", donut: "donuts", bagel: "bagels",
  noodle: "noodles bowl", sushi: "sushi", japanese: "japanese food", chinese: "chinese food", thai: "thai food", indian: "indian curry", seafood: "seafood clam chowder",
  fish_and_chips: "fish and chips", steak_house: "steak dinner", coffee_shop: "coffee latte", bakery: "bakery pastries", vietnamese: "pho", korean: "korean bbq",
  mediterranean: "mediterranean food", greek: "greek food", french: "french bistro food", hot_dog: "hot dog", tacos: "tacos", burrito: "burrito", frozen_yogurt: "frozen yogurt",
  crepe: "crepes", salad: "salad bowl", bbq: "barbecue ribs", ramen: "ramen", chocolate: "chocolate dessert" };
const AMENITY_PHOTO = { restaurant: "restaurant food", fast_food: "fast food", cafe: "cafe coffee", ice_cream: "ice cream", food_court: "food court" };
const FOOD_OPEN = new Set();

function cuisineList(t) { return (t.cuisine || "").split(/[;,]/).map(c => c.trim()).filter(Boolean); }
function foodAbout(x) {
  const t = x.t, cu = cuisineList(t).map(c => CUISINE_HE[c]).filter(Boolean);
  const fem = /restaurant|ice_cream/.test(t.amenity);
  let a = (AMENITY_HE[t.amenity] || "מקום אוכל") + (cu.length ? (fem ? " שמגישה " : " שמגיש ") + cu.join(", ") : "");
  if (t.brand) a += `. שייך לרשת ${t.brand}`;
  if (t["addr:street"]) a += `, ב-${t["addr:housenumber"] ? t["addr:housenumber"] + " " : ""}${t["addr:street"]}`;
  return a + ".";
}
function foodExpect(x) {
  const t = x.t, l = [], min = Math.max(1, Math.round(x.dist / 80));
  l.push(`${min === 1 ? "דקת הליכה אחת" : min + " דקות הליכה"} (כ-${Math.round(x.dist / 10) * 10} מ').`);
  if (x.open === true) l.push("פתוח עכשיו לפי שעות הפתיחה במפה."); else if (x.open === false) l.push("סגור עכשיו לפי שעות הפתיחה במפה.");
  const seat = []; if (t.indoor_seating === "yes") seat.push("ישיבה בפנים"); if (t.outdoor_seating === "yes") seat.push("ישיבה בחוץ");
  if (t.takeaway === "yes") seat.push("טייק אווי"); if (t.takeaway === "only") seat.push("טייק אווי בלבד"); if (t.delivery === "yes") seat.push("משלוחים");
  if (seat.length) l.push(seat.join(", ") + ".");
  const kids = []; if (t.highchair === "yes") kids.push("כיסאות תינוק"); if (t.kids_area === "yes" || t["kids_area:indoor"] === "yes") kids.push("פינת משחקים"); if (t.changing_table === "yes") kids.push("משטח החתלה");
  if (kids.length) l.push("לילדים: " + kids.join(", ") + ".");
  if (t.wheelchair === "yes") l.push("נגיש, נוח גם עם עגלה.");
  const diet = []; if (/yes|only/.test(t["diet:vegetarian"] || "")) diet.push("צמחוני"); if (/yes|only/.test(t["diet:vegan"] || "")) diet.push("טבעוני"); if (/yes|only/.test(t["diet:gluten_free"] || "")) diet.push("ללא גלוטן"); if (/yes|only/.test(t["diet:kosher"] || "")) diet.push("כשר");
  if (diet.length) l.push("אפשרויות: " + diet.join(", ") + ".");
  return l.join(" ");
}
function foodTips(x) {
  const t = x.t, tips = [], c = t.cuisine || "";
  if (/fast_food|ice_cream/.test(t.amenity)) tips.push("מהיר וזול. מתאים כשהילדים רעבים עכשיו ואין כוח לשבת הרבה.");
  if (/pizza/.test(c)) tips.push("בקבוצה של עשרה, פיצות גדולות לשיתוף הן בדרך כלל הדרך הכי זולה ומהירה להאכיל את כולם.");
  if (/seafood|fish_and_chips/.test(c)) tips.push("באזור החוף כדאי לנסות קלאם צ'אודר. ילדים שלא אוהבים פירות ים יכולים להזמין פיש אנד צ'יפס.");
  if (t.reservation === "required" || t.reservation === "recommended") tips.push("מומלץ להזמין מקום מראש. אתם עשרה אנשים.");
  if (t.takeaway === "yes" && t.outdoor_seating !== "yes") tips.push("אפשר לקחת ולאכול בפארק או על החוף הקרוב.");
  if (x.open === false) tips.push("סגור עכשיו. כדאי לבדוק מתי הוא נפתח, או לבחור מקום אחר מהרשימה.");
  if (!t.opening_hours) tips.push("השעות לא מופיעות במפה. אם יש טלפון, כדאי להתקשר לפני שהולכים.");
  if (new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }) === "2026-11-26") tips.push("היום חג ההודיה. הרבה מקומות סגורים או בשעות מקוצרות, אז עדיף להתקשר.");
  if (!tips.length) tips.push("במסעדות בארה\"ב נהוג להשאיר טיפ של 18–20%. בקבוצה גדולה הוא לפעמים כבר כלול בחשבון (\"gratuity\"). כדאי לבדוק.");
  return tips;
}
function foodPhotoQ(t) { const c = cuisineList(t).find(c => CUISINE_PHOTO[c]); return c ? CUISINE_PHOTO[c] : (AMENITY_PHOTO[t.amenity] || "restaurant food"); }
function foodInfoHTML(x) {
  const t = x.t, own = t.image && /^https:\/\//.test(t.image) ? t.image : null;
  const gal = own ? `<div class="simg gal-wrap"><div class="gal"><figure><img src="${esc(own)}" alt="${esc(t.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.simg').remove()"><figcaption><span>${esc(t.name)}</span></figcaption></figure></div></div>`
    : `<div class="simg" data-q="${esc(foodPhotoQ(t))}" data-note="תמונה להמחשה"><span class="sk"></span></div>`;
  return `<div class="sinfo">${gal}<div><h4>מה זה</h4><p>${esc(foodAbout(x))}</p>${t.description ? `<p dir="ltr" class="fdesc">${esc(t.description)}</p>` : ""}</div>
    <div><h4>מה מחכה שם</h4><p>${esc(foodExpect(x))}</p>${t.opening_hours ? `<p class="fi-o">🕒 <span dir="ltr">${esc(t.opening_hours)}</span></p>` : ""}</div>
    <div class="gold"><h4>טיפ זהב</h4>${foodTips(x).map(p => `<p>${esc(p)}</p>`).join("")}</div>
    <div class="actions"><a class="btn primary" href="https://www.google.com/maps/dir/?api=1&destination=${x.ll.join(",")}&travelmode=walking" target="_blank" rel="noopener">🚶 הליכה לשם</a>
      ${t.phone || t["contact:phone"] ? `<a class="btn" href="tel:${esc((t.phone || t["contact:phone"]).replace(/[^+\d]/g, ""))}">${esc(t.phone || t["contact:phone"])}</a>` : ""}
      ${t.website || t["contact:website"] ? `<a class="btn" href="${esc(t.website || t["contact:website"])}" target="_blank" rel="noopener">אתר / תפריט</a>` : ""}</div></div>`;
}
function toggleFood(btn) {
  const i = +btn.dataset.food, li = btn.closest("li"), x = FOOD.items[i], open = !FOOD_OPEN.has(i);
  open ? FOOD_OPEN.add(i) : FOOD_OPEN.delete(i);
  btn.setAttribute("aria-expanded", open); btn.querySelector(".st-more").textContent = open ? "סגירה ▲" : "מה זה? ▼";
  const old = li.querySelector(".sinfo"); if (old) old.remove();
  if (open) { li.insertAdjacentHTML("beforeend", foodInfoHTML(x)); const box = li.querySelector(".sinfo"); hydrateImages(box);
    requestAnimationFrame(() => { const r = box.getBoundingClientRect(); if (r.bottom > innerHeight) box.scrollIntoView({ block: "nearest", behavior: "smooth" }); }); }
}
document.addEventListener("click", e => { const b = e.target.closest("[data-food]"); if (b) toggleFood(b); });

function drawFood() {
  const box = document.getElementById("foodlist"); if (!box) return;
  const loc = FOOD.where ? `<p class="src">${FOOD.mode === "gps" ? "📍 ליד המיקום שלך" : "🧭 ליד: " + esc(FOOD.where.label)}${FOOD.at ? " · עודכן ב-" + FOOD.at.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : ""}</p>` : "";
  if (FOOD.status === "loading") { box.innerHTML = `<div class="fload"><span class="sk"></span>${FOOD.mode === "gps" ? "מאתר מיקום ומחפש מסעדות קרובות…" : "מחפש מסעדות ליד התחנה…"}</div>`; return; }
  if (FOOD.status === "error") { const [m, d] = FOOD.err.split("\n"); box.innerHTML = `<div class="alert"><span class="dot"></span><div>${esc(m)}${d ? `<div class="src" dir="ltr" style="margin-top:4px">${esc(d)}</div>` : ""}</div></div>`; return; }
  if (FOOD.status !== "done") { box.innerHTML = ""; return; }
  if (!FOOD.items.length) { box.innerHTML = loc + `<p class="src">לא נמצאו מקומות אוכל במרחק הליכה.</p>`; return; }
  FOOD_OPEN.clear();
  const icon = t => ({ pizza: "🍕", burger: "🍔", mexican: "🌮", tacos: "🌮", ice_cream: "🍦", donut: "🍩", sushi: "🍣", japanese: "🍱", chinese: "🥡", italian: "🍝", pancake: "🥞", breakfast: "🥞", coffee_shop: "☕", seafood: "🦞", chicken: "🍗", sandwich: "🥪", bakery: "🥐", noodle: "🍜", ramen: "🍜", thai: "🍜", indian: "🍛", hot_dog: "🌭" })[cuisineList(t)[0]] || ({ cafe: "☕", ice_cream: "🍦", fast_food: "🍟" })[t.amenity] || "🍽️";
  box.innerHTML = loc + `<ol class="stops foods">${FOOD.items.map((x, i) => { const t = x.t, min = Math.max(1, Math.round(x.dist / 80));
    const cu = cuisineList(t).map(c => CUISINE_HE[c]).filter(Boolean).slice(0, 2).join(" · ");
    return `<li><span class="num fnum" aria-hidden="true">${icon(t)}</span>
      <button class="st-b st-btn" data-food="${i}" aria-expanded="false"><span class="st-n" dir="auto">${esc(t.name)}</span>
        <span class="st-x">${esc(AMENITY_HE[t.amenity] || "")}${cu ? " · " + esc(cu) : ""}${x.open === true ? ` · <b class="op">פתוח</b>` : x.open === false ? ` · <b class="cl">סגור</b>` : ""}${x.score >= 2.5 ? ` · <b class="famb2">👨‍👩‍👧 למשפחות</b>` : ""}</span>
        <span class="st-more">מה זה? ▼</span></button>
      <span class="fmin">🚶 ${min}′</span></li>`; }).join("")}</ol>
    <p class="src">הנתונים מ-OpenStreetMap. התיאור והטיפ נבנים מפרטי המקום שבמפה, כמו סוג המטבח, שעות, ישיבה וכיסא תינוק, ולא מביקורות. כשאין תמונה של המקום עצמו, מוצגות תמונות להמחשה של סוג האוכל.</p>`;
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
