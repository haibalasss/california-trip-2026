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
    items.forEach(x => { x.rank = x.score + (x.open === true ? 1.5 : x.open === false ? -4 : 0) + (pickFor(x.t.name) ? 3 : 0); });
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
  const pk = pickFor(t.name), [sc, st] = pk && pk.ks ? [pk.ks, pk.kst] : osmSeating(t);
  return `<div class="sinfo">${gal}<div><h4>מה זה</h4><p>${esc(foodAbout(x))}</p>${t.description ? `<p dir="ltr" class="fdesc">${esc(t.description)}</p>` : ""}</div>
    ${seatHTML(sc, st)}
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
  const ask = document.getElementById("askbox"); if (ask) ask.hidden = FOOD.status !== "done";
  drawLive();
  const pk = document.getElementById("foodpicks");
  if (pk) { const ll = FOOD.where ? FOOD.where.ll : (FOOD.status === "error" || FOOD.status === "idle" ? nextStopLL().ll : null); const h = (ll || mustAll ? mustHTML(ll) : "") + (ll ? picksHTML(ll) : ""); if (pk.dataset.h !== h) { pk.innerHTML = h; pk.dataset.h = h; } }
  const loc = FOOD.where ? `<p class="src">${FOOD.mode === "gps" ? "📍 ליד המיקום שלך" : "🧭 ליד: " + esc(FOOD.where.label)}${FOOD.at ? " · עודכן ב-" + FOOD.at.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : ""}</p>` : "";
  if (FOOD.status === "loading") { box.innerHTML = `<div class="fload"><span class="sk"></span>${FOOD.mode === "gps" ? "מאתר מיקום ומחפש מסעדות קרובות…" : "מחפש מסעדות ליד התחנה…"}</div>`; return; }
  if (FOOD.status === "error") { const [m, d] = FOOD.err.split("\n"); box.innerHTML = `<div class="alert"><span class="dot"></span><div>${esc(m)}${d ? `<div class="src" dir="ltr" style="margin-top:4px">${esc(d)}</div>` : ""}</div></div>`; return; }
  if (FOOD.status !== "done") { box.innerHTML = ""; return; }
  if (!FOOD.items.length) { box.innerHTML = loc + `<p class="src">לא נמצאו מקומות אוכל במרחק הליכה.</p>`; return; }
  FOOD_OPEN.clear();
  const icon = t => ({ pizza: "🍕", burger: "🍔", mexican: "🌮", tacos: "🌮", ice_cream: "🍦", donut: "🍩", sushi: "🍣", japanese: "🍱", chinese: "🥡", italian: "🍝", pancake: "🥞", breakfast: "🥞", coffee_shop: "☕", seafood: "🦞", chicken: "🍗", sandwich: "🥪", bakery: "🥐", noodle: "🍜", ramen: "🍜", thai: "🍜", indian: "🍛", hot_dog: "🌭" })[cuisineList(t)[0]] || ({ cafe: "☕", ice_cream: "🍦", fast_food: "🍟" })[t.amenity] || "🍽️";
  box.innerHTML = loc + `<h3 class="sect-title">📍 עוד מקומות קרובים</h3><ol class="stops foods">${FOOD.items.map((x, i) => { const t = x.t, min = Math.max(1, Math.round(x.dist / 80));
    const cu = cuisineList(t).map(c => CUISINE_HE[c]).filter(Boolean).slice(0, 2).join(" · ");
    return `<li><span class="num fnum" aria-hidden="true">${icon(t)}</span>
      <button class="st-b st-btn" data-food="${i}" aria-expanded="false"><span class="st-n" dir="auto">${esc(t.name)}</span>
        <span class="st-x">${esc(AMENITY_HE[t.amenity] || "")}${cu ? " · " + esc(cu) : ""}${x.open === true ? ` · <b class="op">פתוח</b>` : x.open === false ? ` · <b class="cl">סגור</b>` : ""}${x.score >= 2.5 ? ` · <b class="famb2">👨‍👩‍👧 למשפחות</b>` : ""}${pickFor(t.name) ? ` · <b class="stars">⭐ ${pickFor(t.name).r || "מומלץ"}</b>` : ""}${(() => { const pk = pickFor(t.name), c = pk && pk.ks ? pk.ks : osmSeating(t)[0]; return KS_SHORT[c] ? ` · <b class="ks ks-${c}">${KS_SHORT[c]}</b>` : ""; })()}</span>
        <span class="st-more">מה זה? ▼</span></button>
      <span class="fmin">🚶 ${min}′</span></li>`; }).join("")}</ol>
    <p class="src">הנתונים מ-OpenStreetMap. התיאור והטיפ נבנים מפרטי המקום שבמפה, כמו סוג המטבח, שעות, ישיבה וכיסא תינוק, ולא מביקורות. כשאין תמונה של המקום עצמו, מוצגות תמונות להמחשה של סוג האוכל.</p>`;
}
const KS_LABEL = { y: "✅ מתאים לישיבה עם ילדים", t: "🟡 עדיף לקחת", u: "❔ לא ידוע" };
const KS_SHORT = { y: "✅ ישיבה עם ילדים", t: "🟡 עדיף לקחת", u: "" };
/* Seating with kids, from OSM tags (only claims what the tags support) */
function osmSeating(t) {
  if (t.takeaway === "only") return ["t", "טייק אווי בלבד, בלי ישיבה."];
  const kids = t.highchair === "yes" || t.kids_area === "yes" || t["kids_area:indoor"] === "yes" || t.changing_table === "yes";
  const seats = t.indoor_seating === "yes" || t.outdoor_seating === "yes";
  if (kids) return ["y", [t.highchair === "yes" && "יש כיסאות תינוק", (t.kids_area === "yes" || t["kids_area:indoor"] === "yes") && "יש פינת משחקים", t.changing_table === "yes" && "יש משטח החתלה"].filter(Boolean).join(", ") + "."];
  if (t.amenity === "food_court") return ["y", "מתחם אוכל עם ישיבה משותפת, נוח לקבוצה."];
  if (t.amenity === "restaurant" && seats) return ["y", "מסעדה עם " + [t.indoor_seating === "yes" && "ישיבה בפנים", t.outdoor_seating === "yes" && "ישיבה בחוץ"].filter(Boolean).join(" ו") + "."];
  if (/fast_food|ice_cream|cafe/.test(t.amenity) && !seats) return ["u", "במפה אין מידע על מקומות ישיבה. בדרך כלל יש כמה שולחנות."];
  if (seats) return ["y", [t.indoor_seating === "yes" && "יש ישיבה בפנים", t.outdoor_seating === "yes" && "יש ישיבה בחוץ"].filter(Boolean).join(", ") + "."];
  return ["u", "במפה אין מידע על הישיבה."];
}
function seatHTML(code, txt) { return code ? `<div class="seat seat-${code}"><h4>🪑 ישיבה עם ילדים</h4><p><b>${KS_LABEL[code]}</b>${txt ? " · " + esc(txt) : ""}</p></div>` : ""; }

function areaFor(ll) {
  let best = null, bd = 1e12;
  FOOD_AREAS.forEach(a => { const d = haversine(ll, a.ll); if (d < a.km * 1000 && d < bd) { bd = d; best = a; } });
  return best;
}
const normName = n => (n || "").toLowerCase().replace(/[^a-z0-9]/g, "");
function pickFor(name) { const k = normName(name); return k.length > 3 ? FOOD_PICKS.find(p => { const pk = normName(p.n.split("(")[0]); return pk.includes(k) || k.includes(pk); }) : null; }
function pickInfoHTML(p) {
  return `<div class="sinfo"><div class="simg" data-q="${esc(p.q)}" data-note="תמונה להמחשה"><span class="sk"></span></div>
    <div><h4>מה זה</h4><p>${esc(p.w)}</p></div>
    ${p.hd !== undefined ? `<div class="hai"><h4>🍽️ מה חי יזמין</h4>${p.hd ? p.hd.map(([n, x]) => `<p><b dir="auto">${esc(n)}</b> · ${esc(x)}</p>`).join("") : `<p class="muted">${esc(p.hdn || HD_NONE)}</p>`}</div>` : ""}
    ${seatHTML(p.ks, p.kst)}
    <div><h4>דירוג ומקור</h4><p>${p.r ? `<b class="stars">⭐ ${p.r}</b> · ` : ""}${esc(p.s)}</p></div>
    <div class="gold"><h4>טיפ זהב</h4><p>${esc(p.k)}</p></div>
    <div class="actions"><a class="btn primary" href="${p.navll ? `https://www.google.com/maps/dir/?api=1&destination=${p.navll.join(",")}&travelmode=walking` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.n + ", " + p.c)}`}" target="_blank" rel="noopener">🧭 ניווט</a>${p.u ? `<a class="btn" href="${esc(p.u)}" target="_blank" rel="noopener">אתר / תפריט</a>` : ""}</div></div>`;
}
let mustAll = false;
function mustHTML(ll) {
  const a = ll && areaFor(ll);
  const list = MUST_TRY.map((m, i) => [m, i]).filter(([m]) => mustAll || !a || [].concat(m.a).includes(a.id)).sort((x, y) => (y[0].tr ? 1 : 0) - (x[0].tr ? 1 : 0));
  if (!list.length) return a ? `<section class="picks must"><div class="must-h"><h3 class="sect-title">🔥 מנות שחייבים לטעום: ${esc(a.n)}</h3><button class="linkbtn" id="mustall" type="button">כל המסלול</button></div><p class="src">באזור הזה לא מצאתי מנה שמצדיקה עצירה מיוחדת. עדיף פיקניק או ארוחה פשוטה, ולחסוך את התיאבון ליעד הבא.</p></section>` : "";
  return `<section class="picks must"><div class="must-h"><h3 class="sect-title">🔥 מנות שחייבים לטעום${!mustAll && a ? ": " + esc(a.n) : ": כל המסלול"}</h3>
      <button class="linkbtn" id="mustall" type="button">${mustAll ? "רק האזור שלי" : "כל המסלול"}</button></div>
    <ol class="stops foods">${list.map(([m, i]) => `<li><span class="num fnum mk" aria-hidden="true">🔥</span>
      <button class="st-b st-btn" data-must="${i}" aria-expanded="false"><span class="st-n" dir="auto">${esc(m.d)}</span>
        <span class="st-x" dir="auto">${esc(m.p)} · ${esc(m.c)}${m.tr ? ` · <b class="trop">🥭 ניגוד טרופי</b>` : ""}</span><span class="st-more">למה זה מיוחד? ▼</span></button><span></span></li>`).join("")}</ol></section>`;
}
function mustInfoHTML(m) {
  return `<div class="sinfo"><div class="simg" data-q="${esc(m.q)}" data-note="תמונה להמחשה"><span class="sk"></span></div>
    <div><h4>למה זה מיוחד</h4><p>${esc(m.w)}</p></div>${m.tr ? `<div class="tropbox"><h4>🥭 ניגוד טרופי</h4><p>${esc(m.tr)}</p></div>` : ""}<div><h4>איך זה נראה</h4><p>${esc(m.l)}</p></div>
    <div class="verdict"><h4>⚖️ טעים או רק יפה?</h4><p>${esc(m.v)}</p></div>
    ${m.t ? `<div class="gold"><h4>טיפ זהב</h4><p>${esc(m.t)}</p></div>` : ""}
    <div class="actions"><a class="btn primary" href="https://www.google.com/maps/dir/?api=1&destination=${m.ll.join(",")}" target="_blank" rel="noopener">🧭 ניווט</a></div></div>`;
}
document.addEventListener("click", e => {
  if (e.target.closest("#mustall")) { mustAll = !mustAll; const box = document.getElementById("foodpicks"); if (box) { box.dataset.h = ""; drawFood(); } return; }
  const b = e.target.closest("[data-must]"); if (!b) return;
  const li = b.closest("li"), m = MUST_TRY[+b.dataset.must], old = li.querySelector(".sinfo"), open = !old;
  b.setAttribute("aria-expanded", open); b.querySelector(".st-more").textContent = open ? "סגירה ▲" : "למה זה מיוחד? ▼";
  if (old) old.remove(); else { li.insertAdjacentHTML("beforeend", mustInfoHTML(m)); hydrateImages(li); } });

function picksHTML(ll) {
  const a = ll && areaFor(ll); if (!a) return "";
  const list = FOOD_PICKS.map((p, i) => [p, i]).filter(([p]) => p.a === a.id);
  return `<section class="picks"><h3 class="sect-title">⭐ מומלצים באזור: ${esc(a.n)}</h3>
    <ol class="stops foods">${list.map(([p, i]) => `<li><span class="num fnum pk" aria-hidden="true">${p.r ? p.r : "★"}</span>
      <button class="st-b st-btn" data-pick="${i}" aria-expanded="false"><span class="st-n" dir="auto">${esc(p.n)}</span>
        <span class="st-x">${esc(p.t)} · ${p.r ? `⭐ ${p.r} · ` : ""}${esc(p.s)}${KS_SHORT[p.ks] ? ` · <b class="ks ks-${p.ks}">${KS_SHORT[p.ks]}</b>` : ""}</span><span class="st-more">מה זה? ▼</span></button><span></span></li>`).join("")}</ol>
    <p class="src">נבחרו לפי ביקורות ומדריכים למשפחות ברשת (נובמבר 2026). הדירוג מוצג רק כשנמצא, יחד עם המקור שלו.</p></section>`;
}
document.addEventListener("click", e => { const b = e.target.closest("[data-pick]"); if (!b) return;
  const li = b.closest("li"), p = FOOD_PICKS[+b.dataset.pick], old = li.querySelector(".sinfo"), open = !old;
  b.setAttribute("aria-expanded", open); b.querySelector(".st-more").textContent = open ? "סגירה ▲" : "מה זה? ▼";
  if (old) old.remove(); else { li.insertAdjacentHTML("beforeend", pickInfoHTML(p)); hydrateImages(li); } });

/* ---------- Live picks from Claude: the family sends their location in the chat, Claude researches and publishes food-live.json ---------- */
let LIVE = null;
async function loadLive() {
  try { const r = await fetch("food-live.json?t=" + Date.now(), { cache: "no-store", signal: tmo(6000) }); if (!r.ok) return; LIVE = await r.json(); drawLive(); } catch (e) { }
}
function ago(iso) { const m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 60 ? `לפני ${Math.max(1, m)} דק'` : m < 1440 ? `לפני ${Math.round(m / 60)} שע'` : new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" }); }
function drawLive() {
  const box = document.getElementById("foodlive"); if (!box) return;
  if (!LIVE || !LIVE.items || !LIVE.items.length) { box.innerHTML = ""; return; }
  const here = FOOD.where && FOOD.where.ll, far = here && LIVE.where && LIVE.where.ll ? haversine(here, LIVE.where.ll) > 3000 : false;
  box.innerHTML = `<section class="picks live"><h3 class="sect-title">✨ ההמלצות של Claude למיקום שלכם</h3>
    <p class="src">${esc(LIVE.where && LIVE.where.label || "")} · עודכן ${ago(LIVE.updated)}${far ? " · ⚠️ נשלח ממקום אחר, רחוק ממכם עכשיו" : ""}</p>
    ${LIVE.note ? `<div class="note">${esc(LIVE.note)}</div>` : ""}
    <ol class="stops foods">${LIVE.items.map((p, i) => { const d = here && p.ll ? Math.max(1, Math.round(haversine(here, p.ll) / 80)) : null;
      return `<li><span class="num fnum pk" aria-hidden="true">${p.r || "★"}</span>
      <button class="st-b st-btn" data-live="${i}" aria-expanded="false"><span class="st-n" dir="auto">${esc(p.n)}</span>
        <span class="st-x">${esc(p.t || "")}${p.r ? ` · ⭐ ${p.r}` : ""}${p.s ? " · " + esc(p.s) : ""}${KS_SHORT[p.ks] ? ` · <b class="ks ks-${p.ks}">${KS_SHORT[p.ks]}</b>` : ""}</span><span class="st-more">מה זה? ▼</span></button>
      <span class="fmin">${d ? `🚶 ${d}′` : ""}</span></li>`; }).join("")}</ol></section>`;
}
document.addEventListener("click", e => { const b = e.target.closest("[data-live]"); if (!b || !LIVE) return;
  const li = b.closest("li"), p = LIVE.items[+b.dataset.live], old = li.querySelector(".sinfo"), open = !old;
  b.setAttribute("aria-expanded", open); b.querySelector(".st-more").textContent = open ? "סגירה ▲" : "מה זה? ▼";
  if (old) old.remove(); else { li.insertAdjacentHTML("beforeend", pickInfoHTML(Object.assign({ c: p.c || "" }, p, { navll: p.ll }))); hydrateImages(li); } });

function liveRequestText() {
  const w = FOOD.where; if (!w) return null;
  const now = new Date(), area = areaFor(w.ll);
  const list = FOOD.items.slice(0, 12).map((x, i) => `${i + 1}. ${x.t.name}${x.t.cuisine ? " (" + x.t.cuisine + ")" : ""} · ${Math.round(x.dist)}m${x.open === true ? " · open" : x.open === false ? " · closed" : ""}${x.t.opening_hours ? " · " + x.t.opening_hours : ""}`).join("\n");
  return `🍽️ בקשת המלצות אוכל ממשפחת ${FAMILIES[fam]}\n📍 ${w.ll[0].toFixed(5)},${w.ll[1].toFixed(5)}${area ? " (" + area.n + ")" : ""} · ${w.label}\n🕒 ${now.toLocaleString("he-IL", { timeZone: "America/Los_Angeles", weekday: "long", hour: "2-digit", minute: "2-digit" })} (שעון קליפורניה)\n👨‍👩‍👧‍👦 10 אנשים, כולל ילדים\n\nמקומות קרובים מהמפה:\n${list || "(לא נמצאו)"}\n\nבבקשה: המלצות עם דירוג, מידע, תמונות, והאם המקום מתאים לישיבה עם ילדים. לפי הטעם של חי: מנות ספציפיות ומפתיעות עם אפקט WOW, אוכל רחוב, פיוז'ן, טעמים חזקים, ניגודים טרופיים של חמוץ-מתוק (מנגו, אננס, ליים, פסיפלורה), בלי פירות ים (דגים בסדר), ולא המלצות גנריות. ולעדכן את האפליקציה.`;
}
async function sendToClaude(btn) {
  const txt = liveRequestText(); if (!txt) { toast("קודם מחפשים מסעדות"); return; }
  let ok = false;
  try { await navigator.clipboard.writeText(txt); ok = true; } catch (e) { }
  if (ok) { btn.textContent = "✓ הועתק. הדביקו בשיחה עם Claude ושלחו"; toast("הועתק. עכשיו מדביקים בשיחה עם Claude"); }
  else if (navigator.share) { try { await navigator.share({ text: txt }); } catch (e) { } }
  else { const ta = document.getElementById("livetxt"); ta.hidden = false; ta.value = txt; ta.select(); toast("סמנו והעתיקו את הטקסט"); }
}

function renderFood() {
  return `<section class="group"><h2>🍽️ אוכל קרוב, במרחק הליכה</h2>
    <div class="seg" role="group" aria-label="חיפוש לפי"><button class="segb" data-fm="gps" aria-pressed="${FOOD.mode === "gps"}">📍 לידי עכשיו</button><button class="segb" data-fm="stop" aria-pressed="${FOOD.mode === "stop"}">🧭 ליד התחנה הבאה</button></div>
    <button class="btn primary fsearch" id="foodgo" type="button">${FOOD.status === "done" ? "🔄 חיפוש מחדש" : "חיפוש מסעדות"}</button>
    <div id="foodlive"></div>
    <div class="askclaude" ${FOOD.status === "done" ? "" : "hidden"} id="askbox"><button class="btn askbtn" id="askclaude" type="button">📨 שליחה ל-Claude: המלצות, דירוג ותמונות למיקום הזה</button>
      <p class="src">ההודעה כוללת את המיקום ואת רשימת המקומות הקרובים. מדביקים אותה בשיחה עם Claude, ותוך כ-2 דקות ההמלצות מופיעות כאן.</p>
      <textarea id="livetxt" hidden rows="6" readonly></textarea></div>
    <div id="foodpicks"></div><div id="foodlist"></div></section>`;
}
function initFood() {
  document.querySelectorAll("[data-fm]").forEach(b => b.onclick = () => { FOOD.mode = b.dataset.fm; store.set("foodmode", FOOD.mode); document.querySelectorAll("[data-fm]").forEach(x => x.setAttribute("aria-pressed", x === b)); loadFood(); });
  $("#foodgo").onclick = loadFood;
  $("#askclaude").onclick = e => sendToClaude(e.currentTarget);
  drawLive(); loadLive();
  if (FOOD.status === "idle" && FOOD.mode === "stop") loadFood(); else drawFood();
}
