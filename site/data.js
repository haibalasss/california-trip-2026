/* Trip data. Two families share the route until 25.11.
   fam: "b" = Balas only, "a" = Ben Aderet only, omitted = both.
   S("key") = encrypted value from vault.js (Balas bookings only). */
const S = k => ({ s: k });

const FAMILIES = { b: "בלס", a: "בן אדרת" };

const ALERTS = [
  { lvl: "danger", t: "<b>סופת חורף ביוסמיטי ביום ראשון 22.11.</b> צפויים גשם ושלג, ובלילה שלג. הפארק מבקש להצטייד בשרשראות. כשאוספים את הרכב, לשאול אם הוא 4WD או AWD ואם מותר לשים עליו שרשראות. Highway 140 הוא הכביש הפחות מושלג. מצב הכבישים: ‎+1 209-372-0200." },
  { lvl: "danger", fam: "b", t: "<b>הודעה חשודה מהדירה בלוס אנג'לס.</b> הודעה בשם \"Stayspro / Casa Nona\" מבקשת לאמת אמצעי תשלום בקישור חיצוני. לא להזין פרטי כרטיס. הכתובת הנכונה לפי Booking: 13455 Maxella Ave." },
];

const P = {
  sfo: [37.6213, -122.3790], star: [37.7999, -122.4290], crissy: [37.8039, -122.4646], ggb: [37.8077, -122.4750],
  union: [37.7880, -122.4075], powell: [37.7846, -122.4078], lombard: [37.8021, -122.4187],
  pier33: [37.8086, -122.4040], alcatraz: [37.8267, -122.4230], pier39: [37.8087, -122.4098], wharf: [37.8080, -122.4177],
  musee: [37.8094, -122.4159], ghirardelli: [37.8059, -122.4227], hertzsf: [37.8075, -122.4186],
  mariposa: [37.4849, -119.9663], tunnel: [37.7159, -119.6773], bridalveil: [37.7166, -119.6463], yvl: [37.6676, -119.7842],
  lyf: [37.7474, -119.5961], elcap: [37.7213, -119.6385], valleyview: [37.7178, -119.6635],
  arbor: [36.5920, -121.8888], mfw: [36.6037, -121.8932], aquarium: [36.6182, -121.9019], cannery: [36.6155, -121.8996],
  spanishbay: [36.6129, -121.9440], birdrock: [36.5928, -121.9622], cypress: [36.5687, -121.9655], pebble: [36.5680, -121.9476],
  oceanave: [36.5551, -121.9233], carmelbeach: [36.5543, -121.9289],
  bixby: [36.3716, -121.9017], mcway: [36.1580, -121.6722], seals: [35.6626, -121.2577], smpier: [34.0094, -118.4973],
  venice: [33.9850, -118.4729], stay: [33.9866, -118.4402], hertzlax: [33.9480, -118.3812], laxt1: [33.9443, -118.4027],
  witch: [34.0773, -118.4049], rodeo: [34.0696, -118.4053], holmby: [34.0737, -118.4300], belair: [34.0800, -118.4380],
  sunset: [34.0901, -118.3854], walk: [34.1016, -118.3387], tcl: [34.1022, -118.3410], grove: [34.0721, -118.3576], farmers: [34.0719, -118.3604],
  calico: [34.9486, -116.8642], peggy: [34.9041, -116.8233], eddie: [34.9036, -116.8312], lvcar: [36.0636, -115.1653],
  nyny: [36.1023, -115.1745], parkmgm: [36.1022, -115.1774], cosmo: [36.1097, -115.1740], bellagio: [36.1126, -115.1745],
  venetian: [36.1212, -115.1697], linq: [36.1177, -115.1709], caesars: [36.1176, -115.1751], area15: [36.1317, -115.1834],
  fremont: [36.1707, -115.1440], sign: [36.0820, -115.1728], flyover: [36.1046, -115.1720], luxor: [36.0955, -115.1761], las: [36.0840, -115.1537]
};

const ROADS = {
  yos: [["מצב הכבישים ביוסמיטי (NPS)", "https://www.nps.gov/yose/planyourvisit/conditions.htm"]],
  hwy1: [["Caltrans QuickMap: סגירות ושרשראות", "https://quickmap.dot.ca.gov/"]],
  i15: [["Caltrans QuickMap: I-15", "https://quickmap.dot.ca.gov/"]]
};

const DAYS = [
 { d: "2026-11-20", dow: "שישי", scene: "sf", wx: ["sf"], title: "נוחתים בסן פרנסיסקו", sleep: "Star Motel",
   tour: { t: "🎄 סיור הליכה ערב ב-Union Square", sub: "שתי המשפחות · מסלול קומפקטי עם הרבה עצירות בפנים, כי בערב קר",
     url: "https://www.google.com/maps/dir/?api=1&origin=Nintendo+SAN+FRANCISCO%2C+331+Powell+St%2C+San+Francisco%2C+CA&destination=Dragon+Gate%2C+Grant+Ave+and+Bush+St%2C+San+Francisco%2C+CA&travelmode=walking&waypoints=Macy%27s%2C+170+O%27Farrell+St%2C+San+Francisco%2C+CA%7CONE65+Patisserie%2C+165+O%27Farrell+St%2C+San+Francisco%2C+CA%7CUnion+Square%2C+San+Francisco%2C+CA%7CAmorino%2C+338+Grant+Ave%2C+San+Francisco%2C+CA" },
   stops: [
     { t: "12:09", n: "נחיתה ב-SFO", ll: P.sfo, i: "✈️", x: "עד יום ראשון אין רכב. Uber XL מהשדה, כ-30 דקות." },
     { t: "15:00", n: "צ'ק-אין ב-Star Motel", ll: P.star, i: "🏨", x: "1727 Lombard St" },
     { n: "Crissy Field", ll: P.crissy, i: "🌿", x: "טיילת לאורך המפרץ עם נוף לגשר" },
     { n: "Golden Gate Bridge", ll: P.ggb, i: "🌉", x: "נקודת תצפית ב-Welcome Center" },
     { n: "Uber ל-Union Square", ll: P.union, i: "🚕" },
     { n: "Nintendo San Francisco", ll: [37.78852, -122.40867], i: "🎮", w: 1, pri: 1, dur: [20, 25], close: "20:00", addr: "331 Powell St" },
     { n: "Macy's Holiday Windows", ll: [37.78652, -122.40697], i: "🐶", w: 1, dur: [5, 10], addr: "170 O'Farrell St" },
     { n: "ONE65 Patisserie", ll: [37.78664, -122.40640], i: "🧁", w: 1, pri: 1, dur: [15, 20], close: "20:00", addr: "165 O'Farrell St" },
     { n: "Union Square ומשטח ההחלקה", ll: [37.78797, -122.40745], i: "⛸️", w: 1, dur: [10, 15], addr: "333 Post St" },
     { n: "Amorino Gelato", ll: [37.79004, -122.40555], i: "🍦", w: 1, dur: [10, 15], close: "23:00", addr: "338 Grant Ave", opt: true },
     { n: "Chinatown Dragon Gate", ll: [37.79073, -122.40573], i: "🐉", w: 1, dur: [5, 10], addr: "Grant Ave & Bush St" },
     { n: "חזרה למלון", ll: P.star, i: "🏨" }
   ],
   prep: "מחר: להגיע ל-Pier 33 עד 09:25. כל אחד מביא טלפון טעון ואוזניות.",
   items: [
     { time: "08:45", tz: "שעון פלורידה", k: "flight", fam: "b", kind: "טיסה", fl: "B6 377", doc: "jetblue", title: "JetBlue 377 · פורט לודרדייל ← סן פרנסיסקו",
       sub: "המראה מטרמינל 3 ב-FLL, נחיתה ב-12:09 בטרמינל 1 ב-SFO.", facts: [["אישור", S("jb")], ["מחלקה", "Main"]],
       seats: "seats_out", seatList: "28D · 28E · 28F · 29D · 29E", note: "מזוודה ראשונה מ-$49. למבוגרים צריך Real ID או דרכון.", countdown: "2026-11-20T08:45:00-05:00" },
     { time: "15:00", k: "stay", kind: "לינה · 2 לילות", title: "Star Motel", doc: "star", sub: "1727 Lombard St, Marina District",
       addr: "1727 Lombard Street, San Francisco, CA 94123", phone: "+1 415-875-9707",
       facts: [["Booking", S("bk_sf")], ["צ'ק-אין", "15:00–23:00"], ["צ'ק-אאוט", "ראשון 22.11, 11:00"], ["מחיר", "$678.32, לא שולם עדיין", "b"], ["פיקדון", "$300 בכרטיס אשראי"]],
       note: "חניה חינם לרכב אחד. בצ'ק-אין צריך תעודה מזהה וכרטיס אשראי." }
   ],
   events: [
     { n: "Lightscape, מסלול אורות חג", w: "San Francisco Botanical Garden, Golden Gate Park", t: "ערב הפתיחה, בערב בלבד", x: "מסלול הליכה של כקילומטר וחצי בגן הבוטני, עם מיליון נורות, מיצבי אור ומוזיקה. נכנסים בחלונות זמן, וצריך כרטיסים מראש ב-gggp.org. כ-15 דקות נסיעה מהמלון." },
     { n: "The Music Man", w: "Orpheum Theatre, Market St", t: "20–22 בנובמבר, הצגת ערב", x: "מחזמר ברודוויי קלאסי ומשפחתי על נוכל מקסים שמגיע לעיירה קטנה ומקים להקת כלי נשיפה. צריך כרטיסים." }
   ] },

 { d: "2026-11-21", dow: "שבת", scene: "sf", wx: ["sf"], title: "אלקטרז והמזח", sleep: "Star Motel",
   stops: [
     { t: "09:25", n: "להגיע ל-Pier 33", ll: P.pier33, i: "🚕", x: "Uber מהמלון, כ-15 דקות. אין חניה ברציף." },
     { t: "10:10", n: "Alcatraz", ll: P.alcatraz, i: "⛴️", x: "קוד ה-QR במייל. במדריך הקולי משתמשים עם אוזניות." },
     { n: "חזרה ל-Pier 33", ll: P.pier33, i: "⛴️" },
     { n: "Pier 39 וארוחת צהריים", ll: P.pier39, i: "🦭", x: "אריות הים בצד המערבי של המזח" },
     { n: "Fisherman's Wharf", ll: P.wharf, i: "🦀" },
     { n: "Musée Mécanique", ll: P.musee, i: "🕹️", x: "Pier 45. כניסה חופשית, משלמים במטבעות למכונות." },
     { n: "Ghirardelli Square", ll: P.ghirardelli, i: "🍫" },
     { n: "חזרה למלון", ll: P.star, i: "🏨" }
   ],
   prep: "מחר: צ'ק-אאוט לפני 09:00 ואיסוף הרכב. לתדלק לפני העלייה ליוסמיטי.",
   items: [
     { time: "10:10", k: "act", kind: "אטרקציה", title: "סיור יום באלקטרז", doc: "alcatraz", sub: "Pier 33, Alcatraz Landing",
       addr: "Pier 33, San Francisco, CA 94133", phone: "+1 415-981-7625",
       facts: [["אישור", S("alc")], ["הזמנה", S("alc_i")], ["כרטיס", "חבילת משפחה", "b"]],
       note: "יוצאים גם בגשם. גודל תיק מקסימלי 40×50 ס\"מ.", countdown: "2026-11-21T10:10:00-08:00" }
   ],
   events: [
     { n: "Great Dickens Christmas Fair", w: "Cow Palace, Daly City", t: "יום הפתיחה, עד 20.12", x: "יריד חג מקורה שבנוי כמו לונדון של תקופת דיקנס: שחקנים בתלבושות, שירי חג, מופעים, דוכנים ואוכל. כ-20 דקות נסיעה דרומה מהעיר. צריך כרטיסים." },
     { n: "Fall Native Plant Fest", w: "Fort Mason Community Garden", t: "שבת, כניסה חופשית", x: "פסטיבל קהילתי קטן של צמחים מקומיים בגינה הקהילתית של Fort Mason. יש דוכנים, הסברים ופעילות לילדים. כ-10 דקות הליכה מהמלון." }
   ] },

 { d: "2026-11-22", dow: "ראשון", scene: "yos", wx: ["yos"], title: "נוסעים ליוסמיטי", sleep: "Yosemite View Lodge", roads: "yos",
   stops: [
     { t: "09:00", n: "איסוף הרכב, Fisherman's Wharf", ll: P.hertzsf, i: "🚙", x: "צ'ק-אאוט מהמלון לפני כן" },
     { n: "תדלוק במריפוסה", ll: P.mariposa, i: "⛽", x: "בתוך הפארק כמעט אין תחנות דלק" },
     { n: "Tunnel View", ll: P.tunnel, i: "📸", x: "רק אם הכבישים פתוחים. המסלול בפארק לפי מזג האוויר." },
     { n: "Bridalveil Fall", ll: P.bridalveil, i: "💧" },
     { t: "16:00", n: "צ'ק-אין ב-Yosemite View Lodge", ll: P.yvl, i: "🏨", x: "El Portal, על Highway 140" }
   ],
   planB: "<b>אם יורד שלג או שיש חובת שרשראות:</b> נשארים על Highway 140 ונוסעים ישר ללודג', שנמצא מתחת לקו השלג. את העמק עושים מחר בבוקר, אחרי שפינו את הכבישים. רכב 4WD או AWD עם צמיגי חורף פטור בדרך כלל מהחובה הבסיסית, R1. כדאי לבדוק עם חברת ההשכרה.",
   prep: "מחר: לצאת מהעמק עד 12:00–13:00. את המזוודות מעמיסים כבר בבוקר.",
   items: [
     { time: "09:00", k: "car", fam: "b", kind: "השכרת רכב", title: "איסוף מ-Hertz בפישרמנ'ס וורף", doc: "hertz", sub: "Nissan Pathfinder או דומה",
       addr: "500 Beach Street, San Francisco, CA", phone: "+1 415-674-8330",
       facts: [["Hertz", S("hertz")], ["Delta Cars", S("delta")], ["נהג רשום", S("driver")], ["תשלום באיסוף", "$298.59"], ["ביטוח Allianz", S("allianz_plan")], ["החזרה", "חמישי 26.11, 07:00, LAX"]],
       note: "לשאול על 4WD ועל שרשראות. מושבי בטיחות לילדים לא כלולים.", countdown: "2026-11-22T09:00:00-08:00" },
     { time: "09:00", k: "car", fam: "a", kind: "השכרת רכב", title: "איסוף הרכב בסן פרנסיסקו", sub: "החזרה בלאס וגאס ב-27.11, מיד עם ההגעה", note: "פרטי ההזמנה אצל משפחת בן אדרת." },
     { time: "16:00", k: "stay", kind: "לינה · לילה 1", title: "Yosemite View Lodge", doc: "yosemite", sub: "11136 Highway 140, El Portal",
       addr: "11136 Highway 140, El Portal, CA 95318", phone: "+1 209-379-2681",
       facts: [["Booking", S("bk_yos")], ["צ'ק-אין", "מ-16:00"], ["צ'ק-אאוט", "שני 23.11, עד 11:00"], ["פיקדון", "$50, בכרטיס בלבד"]], note: "המפתחות בדלפק הקבלה." }
   ],
   events: [{ n: "Vintners' Holidays", w: "The Ahwahnee, Yosemite Valley", t: "עד 5.12", x: "סדרת אירועי יין וארוחות שף במלון ההיסטורי של יוסמיטי. מיועד למבוגרים ובתשלום. גם בלי להשתתף, שווה להציץ ללובי ולאולם האוכל של המלון." }] },

 { d: "2026-11-23", dow: "שני", scene: "yos", wx: ["yos", "mry"], title: "בוקר ביוסמיטי, ממשיכים למונטריי", sleep: "Arbor Inn Monterey", roads: "yos",
   stops: [
     { t: "08:30", n: "Lower Yosemite Fall", ll: P.lyf, i: "💧", x: "מסלול מעגלי קל, כ-1.6 ק\"מ" },
     { n: "El Capitan Meadow", ll: P.elcap, i: "🧗" },
     { n: "Valley View", ll: P.valleyview, i: "📸" },
     { t: "11:00", n: "צ'ק-אאוט מהלודג'", ll: P.yvl, i: "🏨" },
     { t: "~12:30", n: "יוצאים למונטריי", ll: P.yvl, i: "🚗", x: "כ-4 שעות דרך מרסד, CA-152 וגילרוי" },
     { n: "צ'ק-אין ב-Arbor Inn", ll: P.arbor, i: "🏨", x: "1058 Munras Ave" },
     { n: "ערב רגוע ב-Old Fisherman's Wharf", ll: P.mfw, i: "🍲", x: "קלאם צ'אודר בכיכר לחם" }
   ],
   planB: "<b>אם הכבישים בעמק מושלגים:</b> מוותרים על העמק, עושים הליכה קצרה לאורך נהר Merced ליד הלודג', ויוצאים מוקדם למונטריי.",
   prep: "מחר: האקווריום ב-09:00. כדאי לקנות כרטיסים מראש באתר.",
   items: [
     { time: "15:00", k: "stay", kind: "לינה · 2 לילות", title: "Arbor Inn Monterey", doc: "arbor", sub: "1058 Munras Ave",
       addr: "1058 Munras Avenue, Monterey, CA 93940", phone: "+1 831-372-3381",
       facts: [["Booking", S("bk_mry")], ["צ'ק-אין", "15:00–22:00"], ["צ'ק-אאוט", "רביעי 25.11, עד 11:00"], ["פיקדון", "$150"]],
       note: "חניה חינם." }
   ],
   events: [{ n: "Ice Skating by the Bay", w: "Custom House Plaza, Old Monterey", t: "כל יום עד 3.1", x: "משטח החלקה על הקרח שמוצב בחוץ לעונת החגים, ליד המזח הישן. בדרך כלל אפשר לשכור מחליקיים במקום. פעילות ערב טובה לילדים, 5 דקות מהמלון." }] },

 { d: "2026-11-24", dow: "שלישי", scene: "mry", wx: ["mry"], title: "מונטריי וכרמל", sleep: "Arbor Inn Monterey",
   stops: [
     { t: "09:00", n: "Monterey Bay Aquarium", ll: P.aquarium, i: "🦦", x: "להגיע להאכלת לוטרות הים" },
     { n: "Cannery Row", ll: P.cannery, i: "🏭" },
     { n: "ארוחת צהריים", ll: P.cannery, i: "🍽️" },
     { n: "17-Mile Drive: Spanish Bay", ll: P.spanishbay, i: "🚗", x: "בכניסה יש אגרה לרכב" },
     { n: "Bird Rock", ll: P.birdrock, i: "🦭" },
     { n: "Lone Cypress", ll: P.cypress, i: "🌲" },
     { n: "Pebble Beach", ll: P.pebble, i: "⛳" },
     { n: "Carmel-by-the-Sea: Ocean Avenue", ll: P.oceanave, i: "🏘️" },
     { n: "Carmel Beach בשקיעה", ll: P.carmelbeach, i: "🌅", sunset: true },
     { n: "ארוחת ערב בכרמל", ll: P.oceanave, i: "🍽️" }
   ],
   prep: "מחר: יוצאים מוקדם, עד 08:00. לתדלק הערב, כי בביג סור הדלק יקר ונדיר.",
   events: [{ n: "Ice Skating by the Bay", w: "Custom House Plaza, Old Monterey", t: "כל יום עד 3.1", x: "משטח החלקה על הקרח שמוצב בחוץ לעונת החגים, ליד המזח הישן. בדרך כלל אפשר לשכור מחליקיים במקום. פעילות ערב טובה לילדים." }] },

 { d: "2026-11-25", dow: "רביעי", scene: "bs", wx: ["bs", "la"], title: "Highway 1 עד Venice", sleep: "Modern Venice Beach Stay", roads: "hwy1",
   stops: [
     { t: "08:00", n: "יוצאים ממונטריי", ll: P.arbor, i: "🚗" },
     { n: "Bixby Creek Bridge", ll: P.bixby, i: "🌉", x: "חונים בצד הצפוני של הגשר" },
     { n: "נסיעה דרך Big Sur", ll: P.bixby, i: "🌊", x: "כמעט אין קליטה. המפה שמורה מראש באתר." },
     { n: "McWay Falls", ll: P.mcway, i: "💦", x: "הליכה קצרה מחניון Julia Pfeiffer Burns" },
     { n: "Piedras Blancas Elephant Seals", ll: P.seals, i: "🦭" },
     { n: "המשך דרומה לסנטה מוניקה", ll: P.smpier, i: "🛣️", x: "כ-4 שעות ב-US-101" },
     { n: "צ'ק-אין בדירה", ll: P.stay, i: "🏠", x: "13455 Maxella Ave" },
     { n: "ערב, אם מגיעים מוקדם: Venice Beach וה-Skatepark", ll: P.venice, i: "🛹", opt: true },
     { n: "Santa Monica Pier וגלגל הענק", ll: P.smpier, i: "🎡", x: "אם מגיעים מאוחר, רק את זה" }
   ],
   planB: "<b>אם Highway 1 סגור בביג סור:</b> נוסעים מצפון ל-Bixby ול-McWay וחוזרים, ומשם ממשיכים ב-US-101 מסלינס. אם הקטע הדרומי פתוח, אפשר להגיע ל-Piedras Blancas דרך סן לואיס אוביספו. לבדוק ב-QuickMap בבוקר.",
   prep: { b: "מחר: יוצאים מהדירה ב-06:30, מחזירים את הרכב ב-LAX ב-07:00, וטסים ב-08:30. לארוז הלילה.", a: "מחר: יום מלא בלוס אנג'לס עם הרכב." },
   items: [
     { time: "16:00", k: "stay", kind: "לינה", title: "Modern Venice Beach Stay", doc: "venice", sub: "דירה עם 3 חדרי שינה, 13455 Maxella Ave",
       addr: "13455 Maxella Avenue, Los Angeles, CA 90292", phone: "+1 213-758-5028",
       facts: [["Booking", S("bk_la")], ["צ'ק-אין", "16:00–23:30"], ["חניה", "$20 ללילה בהזמנה מראש"], ["פיקדון", "$250"]],
       note: "הוראות הכניסה מגיעות רק דרך האפליקציה של Booking. בתוספת $25 להגעה אחרי 23:00. ביציאה משאירים את המפתחות ואת השלט על השולחן." }
   ],
   events: [{ n: "LA Zoo Lights", w: "Los Angeles Zoo, Griffith Park", t: "כל ערב מ-20.11", x: "מסלול אורות חג בגן החיות של לוס אנג'לס: מנהרות אור, הקרנות של בעלי חיים ומוזיקה. פתוח רק בערב וצריך כרטיסים. כ-45 דקות נסיעה מ-Venice." }] },

 { d: "2026-11-26", dow: "חמישי", fam: "b", scene: "home", wx: ["la"], title: "חוזרים הביתה", sleep: "בבית 🏠",
   stops: [
     { t: "06:30", n: "יוצאים מהדירה", ll: P.stay, i: "🚗", x: "לתדלק בדרך" },
     { t: "07:00", n: "החזרת הרכב, Hertz LAX", ll: P.hertzlax, i: "🔑", x: "5251 W 98th St, ומשם שאטל" },
     { t: "07:30", n: "טרמינל 1", ll: P.laxt1, i: "🛄" },
     { t: "08:30", n: "המראה ל-FLL", ll: P.laxt1, i: "✈️", x: "נחיתה ב-16:33" }
   ],
   items: [
     { time: "07:00", k: "car", kind: "החזרת רכב", title: "Hertz LAX", doc: "hertz", sub: "5251 W 98th St", addr: "5251 W 98th St, Los Angeles, CA 90045", facts: [["Hertz", S("hertz")]],
       note: "חג ההודיה: השדה עמוס." },
     { time: "08:30", k: "flight", kind: "טיסה", fl: "B6 1700", doc: "jetblue", title: "JetBlue 1700 · לוס אנג'לס ← פורט לודרדייל", sub: "המראה מטרמינל 1 ב-LAX, נחיתה ב-FLL ב-16:33.",
       facts: [["אישור", S("jb")]], seats: "seats_back", seatList: "24D · 24E · 25D · 25E · 25F", note: "צ'ק-אין באפליקציה של JetBlue נפתח 24 שעות לפני הטיסה.", countdown: "2026-11-26T08:30:00-08:00" }
   ] },

 { d: "2026-11-26", dow: "חמישי", fam: "a", scene: "la", wx: ["la"], title: "יום בלוס אנג'לס", sleep: "Modern Venice Beach Stay",
   stops: [
     { n: "Witch's House (Spadena House)", ll: P.witch, i: "🧙", x: "516 N Walden Dr. מבחוץ בלבד, בית פרטי." },
     { n: "Beverly Hills · Rodeo Drive", ll: P.rodeo, i: "🛍️" },
     { n: "נסיעה בין בתי המפורסמים: Holmby Hills", ll: P.holmby, i: "🏡" },
     { n: "Bel Air", ll: P.belair, i: "🏰" },
     { n: "Sunset Boulevard", ll: P.sunset, i: "🌴" },
     { n: "Hollywood Walk of Fame", ll: P.walk, i: "⭐" },
     { n: "TCL Chinese Theatre ו-Dolby Theatre", ll: P.tcl, i: "🎬", x: "השלט של הוליווד נראה מהמרפסת של Ovation Hollywood" },
     { n: "The Grove ו-Original Farmers Market", ll: P.grove, i: "🎄" },
     { n: "ארוחת ערב ב-The Grove", ll: P.farmers, i: "🍴" }
   ],
   prep: "מחר: יוצאים בבוקר לווגאס, כ-4.5 שעות נסיעה. כדאי להוריד את מפות הדרך מראש.",
   events: [{ n: "חג ההודיה", w: "לוס אנג'לס", t: "היום", x: "חלק מהחנויות והמסעדות סגורות או פועלות בשעות מקוצרות" }] },

 { d: "2026-11-27", dow: "שישי", fam: "a", scene: "lv", wx: ["lv"], title: "דרך המדבר ללאס וגאס", sleep: "New York-New York", roads: "i15",
   stops: [
     { t: "08:30", n: "יוצאים מ-Venice", ll: P.stay, i: "🚗" },
     { n: "Calico Ghost Town", ll: P.calico, i: "🤠" },
     { n: "Peggy Sue's 50's Diner", ll: P.peggy, i: "🍔", x: "Yermo" },
     { n: "EddieWorld (רשות)", ll: P.eddie, i: "⛽", opt: true },
     { n: "החזרת הרכב בלאס וגאס", ll: P.lvcar, i: "🔑", x: "מיד עם ההגעה. המיקום המדויק לפי ההזמנה." },
     { n: "צ'ק-אין ב-New York-New York", ll: P.nyny, i: "🗽" },
     { n: "Park MGM ← Cosmopolitan", ll: P.cosmo, i: "🚶" },
     { n: "Bellagio: המזרקות וה-Conservatory", ll: P.bellagio, i: "⛲" },
     { n: "ארוחת ערב", ll: P.bellagio, i: "🍽️" },
     { n: "Big Apple Coaster, אם יש כוח", ll: P.nyny, i: "🎢", opt: true }
   ],
   prep: "מחר: Omega Mart. לקבוע שעת כניסה.",
   events: [] },

 { d: "2026-11-28", dow: "שבת", fam: "a", scene: "lv", wx: ["lv"], title: "הסטריפ, Omega Mart ופרימונט", sleep: "New York-New York",
   stops: [
     { n: "Uber ל-Venetian: Grand Canal ו-St. Mark's Square", ll: P.venetian, i: "🛶" },
     { n: "LINQ Promenade", ll: P.linq, i: "🎡" },
     { n: "Caesars Palace ו-Forum Shops", ll: P.caesars, i: "🏛️" },
     { n: "ארוחת צהריים", ll: P.caesars, i: "🍽️" },
     { t: "לקבוע", n: "Omega Mart ב-AREA15", ll: P.area15, i: "🛒", x: "בערך 2.5–3 שעות" },
     { n: "Fremont Street Experience", ll: P.fremont, i: "✨", x: "מופעי המסכים מתחילים עם החשיכה" },
     { t: "~21:00", n: "חזרה ל-NYNY", ll: P.nyny, i: "🗽" }
   ],
   prep: "מחר: צ'ק-אאוט, להשאיר את המזוודות במלון. לקבוע שעה ל-FlyOver.",
   events: [] },

 { d: "2026-11-29", dow: "ראשון", fam: "a", scene: "vhome", wx: ["lv"], title: "יום אחרון וטיסה הביתה", sleep: "בבית 🏠",
   stops: [
     { n: "ארוחת בוקר", ll: P.nyny, i: "🥞" },
     { n: "צ'ק-אאוט, משאירים את המזוודות", ll: P.nyny, i: "🧳" },
     { n: "Welcome to Fabulous Las Vegas Sign", ll: P.sign, i: "📸" },
     { t: "לקבוע", n: "FlyOver: Wonders of the American West", ll: P.flyover, i: "🦅" },
     { n: "ארוחת צהריים והשלמות בסטריפ", ll: P.nyny, i: "🍽️" },
     { n: "Mandalay Bay, Luxor ו-Excalibur (רשות)", ll: P.luxor, i: "🏰", opt: true },
     { n: "אוספים את המזוודות מ-NYNY", ll: P.nyny, i: "🧳" },
     { n: "Uber לשדה התעופה ← טיסת ערב", ll: P.las, i: "✈️" }
   ],
   events: [] }
];

/* Weather locations */
const LOCS = { sf: { n: "סן פרנסיסקו", ll: [37.80, -122.43] }, yos: { n: "יוסמיטי", ll: [37.72, -119.65] }, mry: { n: "מונטריי", ll: [36.60, -121.89] },
  bs: { n: "ביג סור", ll: [36.27, -121.81] }, la: { n: "לוס אנג'לס", ll: [33.98, -118.45] }, lv: { n: "לאס וגאס", ll: [36.11, -115.17] } };
const WXTIP = { "2026-11-22|yos": "בנובמבר ייתכן שלג. לבדוק אם יש חובת שרשראות.", "2026-11-21|sf": "על הסירה לאלקטרז קר ויש רוח. כדאי שכבות.", "2026-11-24|mry": "אם יורד גשם, את 17-Mile Drive עדיף לעשות בהפוגה." };
const WXSTATIC = {
  "2026-11-20|sf": { c: 0, hi: 14, lo: 8, p: 5 }, "2026-11-21|sf": { c: 80, hi: 14, lo: 9, p: 40 },
  "2026-11-22|yos": { c: 73, hi: 4, lo: -4, p: 70 }, "2026-11-23|yos": { c: 2, hi: 6, lo: -3, p: 30 }, "2026-11-23|mry": { c: 3, hi: 16, lo: 11, p: 20 },
  "2026-11-24|mry": { c: 63, hi: 17, lo: 13, p: 70 }, "2026-11-25|la": { c: 2, hi: 20, lo: 12, p: 20 }, "2026-11-26|la": { c: 2, hi: 22, lo: 13, p: 10 },
  /* climate estimates until the live forecast covers these days */
  "2026-11-25|bs": { c: 2, hi: 16, lo: 9, p: 20 }, "2026-11-27|lv": { c: 1, hi: 17, lo: 6, p: 5 }, "2026-11-28|lv": { c: 1, hi: 17, lo: 6, p: 5 }, "2026-11-29|lv": { c: 1, hi: 17, lo: 6, p: 5 }
};

const DOCS = [
  { g: "טיסות", rows: [["JetBlue הלוך וחזור", S("jb"), "FLL←SFO ב-20.11 · LAX←FLL ב-26.11", "jetblue"]] },
  { g: "לינה (Booking.com)", rows: [["Star Motel", S("bk_sf"), "20–22.11 · ‎+1 415-875-9707", "star"], ["Yosemite View Lodge", S("bk_yos"), "22–23.11 · ‎+1 209-379-2681", "yosemite"],
    ["Arbor Inn Monterey", S("bk_mry"), "23–25.11 · ‎+1 831-372-3381", "arbor"], ["Venice Beach Stay", S("bk_la"), "25–26.11 · ‎+1 213-758-5028", "venice"]] },
  { g: "רכב וביטוח", rows: [["Hertz (דרך Delta Cars)", S("hertz"), "‎+1 415-674-8330", "hertz"], ["Delta Cars, מספר מסלול", S("delta"), "‎+1 866-202-1813"],
    ["Allianz, ביטוח רכב", S("allianz_plan"), "‎+1 800-419-8016", "allianz"], ["Allianz, מספר פוליסה", S("allianz_policy"), "לתביעות"]] },
  { g: "אטרקציות", rows: [["אלקטרז, 21.11 10:10", S("alc"), "Pier 33 · ‎+1 415-981-7625", "alcatraz"]] }
];

const PACK = ["דרכונים / Real ID", "רישיון נהיגה של הנהג הרשום", "כרטיס אשראי לפיקדונות", "מטענים וסוללה ניידת", "אוזניות לאלקטרז",
  "מעילים, כובעים וכפפות ליוסמיטי", "נעלי הליכה שמתאימות לרטוב", "מטרייה או מעיל גשם", "תרופות קבועות", "חטיפים ומים לדרך", "משקפי שמש וקרם הגנה", "בוסטרים לילדים לרכב"];
