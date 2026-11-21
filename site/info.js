/* Expanded info per stop, keyed by the stop name in data.js.
   a = what it is, e = what to expect / what's around, t = golden tips (gathered from travel guides and reviews online, Nov 2026). */
const INFO = {
  "נחיתה ב-SFO": {
    a: "שדה התעופה הבינלאומי של סן פרנסיסקו, כ-25 דקות נסיעה דרומית לעיר.",
    e: "JetBlue נוחתת בטרמינל 1. נקודת האיסוף של Uber ו-Lyft נמצאת בקומת היציאות (Departures), ולא בקומת ההגעות.",
    t: ["לחמישה נוסעים עם טרולים צריך להזמין Uber XL. רכב רגיל לא יספיק.", "אם אתם רעבים, עדיף לאכול בשדה. הצ'ק-אין במלון מתחיל רק ב-15:00."]
  },
  "צ'ק-אין ב-Star Motel": {
    a: "מוטל פשוט ונקי על Lombard Street, ברובע Marina. זה אזור מגורים בטוח ונעים.",
    e: "ב-Chestnut Street, כ-5 דקות הליכה, יש בתי קפה, מאפיות ומסעדות. Crissy Field והגשר קרובים, אפשר ללכת אליהם ברגל או לנסוע ב-Uber קצר.",
    t: ["בצ'ק-אין גובים פיקדון של $300 בכרטיס אשראי. צריך כרטיס עם מסגרת פנויה."]
  },
  "Crissy Field": {
    a: "פארק חוף ענק לאורך המפרץ, שנבנה על שדה תעופה צבאי ישן. הוא הנקודה הכי נוחה לראות את הגשר מגובה פני הים.",
    e: "טיילת שטוחה, חוף עם חול, אזורי ביצה ומדשאות. בקצה המערבי נמצא ה-Warming Hut, קיוסק של שמורת הפארקים עם שתייה חמה, חטיפים ושולחנות פיקניק מול הגשר.",
    t: ["💡 ה-Warming Hut הוא עצירה מושלמת לשוקו חם עם נוף לגשר. ההכנסות שלו תומכות בפארקים.", "מהחניון ועד הגשר ההליכה לוקחת 10–15 דקות, אבל חלק ממנה עולה במדרגות ארוכות ותלולות. עם ילדים עדיף להגיע לתצפית ב-Uber.", "בקצה המערבי יש רוח חזקה. שכבה חוסמת רוח הכרחית."]
  },
  "Golden Gate Bridge": {
    a: "הגשר המפורסם בעולם, באורך 2.7 ק\"מ. הצבע הכתום-אדום שלו נקרא International Orange, ונבחר כדי שהגשר ייראה בערפל.",
    e: "ב-Welcome Center בצד הדרומי יש תצפית, חנות, ושלט עם חתך של כבל הגשר. אפשר לעלות ולהתחיל ללכת על המדרכה של הגשר עצמו.",
    t: ["💡 הערפל מגיע בדרך כלל אחר הצהריים. אם השמיים בהירים, לא לדחות את הגשר לסוף היום.", "תצפית נוספת בלי צפיפות נמצאת ב-Fort Point, מתחת לגשר, 10 דקות הליכה מה-Warming Hut."]
  },
  "Powell-Hyde Cable Car": {
    a: "החשמלית ההיסטורית של סן פרנסיסקו, שנמשכת בכבל מתחת לכביש. הקו Powell-Hyde נחשב הכי יפה מכל הקווים.",
    e: "הקו טס בעליות ובירידות, ובכיוון צפון נפתח נוף למפרץ, לאלקטרז, לגשר ול-Lombard Street.",
    t: ["💡 התור הכי ארוך הוא בתחנות הקצה, Powell & Market ו-Hyde & Beach. ממליצים ללכת 2–3 רחובות במעלה Powell ולעלות בתחנה הבאה, שם התור קצר הרבה יותר.", "לשלם מראש באפליקציית MuniMobile. כך לא צריך מזומן ועולים מהר יותר.", "לשבת או לעמוד בצד ימין בכיוון הנסיעה צפונה, בשביל הנוף למפרץ."]
  },
  "יורדים ב-Hyde & Lombard ← Lombard Street": {
    a: "\"הרחוב העקום בעולם\": קטע של 8 פניות חדות בירידה תלולה, מוקף ערוגות פרחים ובתים יפים.",
    e: "מלמעלה, בפינת Hyde, יש נוף למפרץ, ל-Coit Tower ול-Bay Bridge. יורדים ברגל במדרגות שבצדי הרחוב.",
    t: ["💡 את התמונה הקלאסית מצלמים מלמטה, מ-Leavenworth Street, ולא מלמעלה.", "בתחתית הרחוב, ב-Leavenworth, אפשר להזמין Uber חזרה למלון. זה כ-10 דקות."]
  },
  "להגיע ל-Pier 33": {
    a: "Alcatraz Landing, רציף היציאה הרשמי היחיד לאלקטרז.",
    e: "יש בדיקה ביטחונית קצרה, ומשם מתקדמים לאזור העלייה. לפני היציאה יש קיוסק קטן לקפה וחטיפים.",
    t: ["💡 ממליצים להגיע 45 דקות לפני ההפלגה. מי שמאחר לא מקבל החזר.", "אין חניה ברציף. Uber מהמלון."]
  },
  "Alcatraz": {
    a: "בית הכלא הפדרלי המפורסם על אי במפרץ, שפעל בין 1934 ל-1963. כאן ישבו אל קפונה ו\"איש הציפורים\".",
    e: "ההפלגה לוקחת כ-15 דקות. באי עולים ברגל (העלייה תלולה) לבניין התאים, ושם עושים את סיור השמע (Audio Tour) עם אוזניות, בקולם של סוהרים ואסירים לשעבר. יש גם מוזיאון קטן עם תצוגות שאפשר לגעת בהן, שמתאים לילדים.",
    t: ["💡 סיור השמע הוא החלק הכי טוב בביקור, אסור לפספס אותו. הוא פועל דרך אפליקציה, לכן צריך טלפון טעון ואוזניות לכל ילד.", "על הסירה ובאי קר ויש רוח, גם כשבעיר נעים.", "את הדרך חזרה לרציף אפשר לעשות ברכבת קטנה (SEAT) למי שמתקשה בעלייה."]
  },
  "Pier 39 וארוחת צהריים": {
    a: "מזח תיירותי עם חנויות, מסעדות, קרוסלה ואקווריום. המפורסמים בו הם אריות הים שמשתזפים על הרציפים.",
    e: "אריות הים נמצאים ב-K-Dock, בצד המערבי של המזח. יש שם רמפות ושבילים נוחים גם לעגלות. בקומה השנייה נמצא Sea Lion Center עם הסברים לילדים.",
    t: ["💡 בין נובמבר למאי חלק מאריות הים נודדים, כך שייתכן שיהיו פחות. בשפל רואים אותם הכי קרוב.", "ממליצים להקדיש כשעה עד שעתיים. בבוקר המוקדם ולקראת שקיעה פחות צפוף."]
  },
  "Fisherman's Wharf": {
    a: "שכונת הנמל ההיסטורית של דייגי סן פרנסיסקו. היום היא אזור תיירותי עם דוכני פירות ים.",
    e: "דוכני סרטנים (Dungeness Crab) וקלאם צ'אודר בכיכר לחם מחמצת. בהמשך יש את המאפייה של Boudin, שבה רואים דרך חלון אופים לחם בצורות של צבים ותנינים.",
    t: ["💡 קלאם צ'אודר בכיכר לחם (Bread Bowl) ב-Boudin הוא החוויה הקלאסית של הוורף."]
  },
  "Musée Mécanique": {
    a: "מוזיאון-ארקייד של מכונות משחק עתיקות, מכאניות וחשמליות: פיגורות מכאניות, מגדות עתידות, פינבול ומשחקי יריות מהמאה הקודמת. כולן עובדות.",
    e: "אולם ענק ורועש ב-Pier 45, מלא במכונות ממאה השנים האחרונות. ילדים מתלהבים.",
    t: ["💡 הכניסה חינם, משלמים לכל מכונה. רובן עובדות במטבעות של 25–50 סנט, ויש מכונות להחלפת כסף. כדאי להביא $10–$20 במטבעות.", "אסור להכניס אוכל ושתייה."]
  },
  "Ghirardelli Square": {
    a: "מפעל השוקולד ההיסטורי של Ghirardelli, שנוסד ב-1852. היום זו כיכר עם חנויות ומסעדות.",
    e: "בחנות של Ghirardelli יש סנדיי ענקיים, Hot Fudge Sundae, ומכונות שוקולד מוצגות. מהכיכר יש נוף ל-Aquatic Park ולמפרץ.",
    t: ["💡 בעבר חילקו ריבוע שוקולד חינם בכניסה. היום זה לא תמיד קורה, אבל מבקשים יפה ובדרך כלל נותנים.", "מבקרים ממליצים: הסנדיי בחנות הגדולה, ואת השוקולד לקנות בחנות האחות שבצד השני של הכיכר."]
  },
  "איסוף הרכב, Fisherman's Wharf": {
    a: "סניף Hertz ב-500 Beach Street, ליד הוורף.",
    e: "לבדוק את הרכב ולצלם שריטות לפני היציאה. מכאן יוצאים מזרחה דרך ה-Bay Bridge.",
    t: ["💡 לשאול אם הרכב 4WD או AWD ואם מותר לשים עליו שרשראות. זה חשוב בגלל התחזית ביוסמיטי.", "לצאת לפני 10:00, כדי להגיע ליוסמיטי עם אור יום."]
  },
  "תדלוק במריפוסה": {
    a: "עיירת זהב קטנה מהמאה ה-19 על כביש 140, כשעה לפני הפארק.",
    e: "תחנות דלק, סופרמרקט ובתי קפה ברחוב הראשי ההיסטורי.",
    t: ["💡 בתוך הפארק כמעט אין דלק, והמחיר גבוה מאוד. למלא כאן מכל מלא.", "אם יש חובת שרשראות, אפשר לקנות או לשכור אותן במריפוסה."]
  },
  "Tunnel View": {
    a: "התצפית המפורסמת ביותר ביוסמיטי. היא מופיעה כמעט בכל גלויה של הפארק.",
    e: "מכאן רואים בבת אחת את El Capitan משמאל, את מפל Bridalveil מימין ואת Half Dome במרכז, ברקע. החניון נמצא מיד ביציאה מהמנהרה.",
    t: ["💡 בסוף הסתיו המפל חלש, ועננים יכולים להסתיר את Half Dome. אם מעונן, לחזור לכאן מחר בבוקר בדרך החוצה.", "התאורה הכי יפה בשעות אחר הצהריים."]
  },
  "Bridalveil Fall": {
    a: "\"מפל ההינומה\": מפל בגובה 188 מטר. הרוח מפזרת את המים כמו הינומה.",
    e: "שביל סלול קצר, כ-800 מטר הלוך וחזור, מוביל לבסיס המפל.",
    t: ["💡 בנובמבר הזרימה חלשה, אבל אחרי גשם המפל מתעורר. ליד המפל השביל רטוב וחלקלק."]
  },
  "צ'ק-אין ב-Yosemite View Lodge": {
    a: "מלון לודג' על גדת נהר Merced באל פורטל, בדיוק בכניסה המערבית לפארק, על כביש 140.",
    e: "יש מסעדה ופיצרייה במקום, וחדרים עם נוף לנהר ולהרים. העמק במרחק כ-25 דקות נסיעה.",
    t: ["💡 הלודג' נמצא נמוך יחסית ולכן בדרך כלל מתחת לקו השלג, גם כשבעמק יורד שלג.", "בערב כדאי לאכול במסעדה של הלודג'. אין הרבה אפשרויות אחרות באזור."]
  },
  "Lower Yosemite Fall": {
    a: "הקטע התחתון של מפלי יוסמיטי, המפל הגבוה בצפון אמריקה (739 מ'). השביל קל ומתאים לכל המשפחה.",
    e: "מסלול מעגלי סלול של כ-1.6 ק\"מ, עם גשר מול המפל ותצפית על שני חלקי המפל.",
    t: ["💡 טיפ של מבקרים: מהחניון ללכת ימינה ולא שמאלה כמו רוב האנשים. כך מגיעים לנקודה פחות צפופה עם נוף לשני המפלים.", "בחורף השביל יכול להיות קפוא בבוקר. נעליים עם אחיזה טובה."]
  },
  "El Capitan Meadow": {
    a: "האחו שלמרגלות El Capitan, צוק גרניט אנכי של כ-900 מטר. זהו הקיר המפורסם בעולם לטיפוס.",
    e: "מהאחו מסתכלים ישר למעלה על הקיר. בדרך כלל יש מטפסים על הקיר, שנראים כמו נקודות קטנות.",
    t: ["💡 להביא משקפת. לילדים מעניין לחפש את המטפסים על הקיר.", "תמונה יפה: מהגשר שאחרי האחו, עם El Capitan ברקע."]
  },
  "Valley View": {
    a: "תצפית קלאסית מגדת נהר Merced, ביציאה מהעמק.",
    e: "El Capitan, Cathedral Rocks ו-Bridalveil משתקפים בנהר. יש חניה קטנה בצד הכביש.",
    t: ["💡 בסתיו המים שקטים וההשתקפות יפה במיוחד. זו עצירה של 10 דקות שמבקרים מתארים כאחת היפות בפארק."]
  },
  "צ'ק-אין ב-Arbor Inn": {
    a: "מוטל נוח על Munras Avenue במונטריי, כ-5 דקות נסיעה מהמרכז ההיסטורי והוורף.",
    e: "חניה חינם. סופרמרקט ומסעדות נמצאים בסביבה, וה-Del Monte Center קרוב.",
    t: ["💡 משאירים את הרכב במלון, וממרכז מונטריי אפשר להמשיך בטרולי MST החינמי שעובר בין הוורף, Cannery Row והאקווריום."]
  },
  "ערב רגוע ב-Old Fisherman's Wharf": {
    a: "המזח הישן של מונטריי, עם מסעדות דגים וחנויות ממתקים.",
    e: "אריות ים ולוטרות ים שוחים מתחת למזח. במסעדות מגישים קלאם צ'אודר בכיכר לחם.",
    t: ["💡 הרבה מסעדות מחלקות טעימות קלאם צ'אודר בכניסה. אפשר לטעום בכמה מקומות לפני שבוחרים."]
  },
  "Monterey Bay Aquarium": {
    a: "אחד האקווריומים הטובים בעולם, שנבנה בתוך מפעל שימורי סרדינים ישן על קו המים.",
    e: "מיכל יער אצות (Kelp Forest) בגובה כ-8.5 מטר, לוטרות ים, אולם Open Sea עם כרישים, צבי ים ולהקות דגים, מדוזות, ופינות מגע לילדים.",
    t: ["💡 להגיע עם הפתיחה. גלריית הלוטרות ויער האצות הכי שקטים בשעה הראשונה.", "בכניסה לבדוק את לוח ההאכלות היומי של הלוטרות ושל יער האצות, ולתכנן סביבו.", "הכרטיסים לכל היום, אפשר לצאת ולחזור. כדאי לקנות מראש באתר."]
  },
  "Cannery Row": {
    a: "רחוב מפעלי השימורים מהספר של ג'ון סטיינבק. היום יש בו מסעדות, חנויות וגלריות.",
    e: "Coastal Recreation Trail עובר לאורך הים, ממנו רואים לוטרות. בהמשך נמצא San Carlos Beach.",
    t: ["💡 טיפ של מקומיים: חונים פעם אחת בחניון Cannery Row או ב-San Carlos Beach, והולכים ברגל בשביל החוף לאקווריום ולוורף."]
  },
  "17-Mile Drive: Spanish Bay": {
    a: "כביש נופי פרטי של כ-27 ק\"מ דרך Pebble Beach, בין מגרשי גולף מפורסמים לחוף סלעי. Spanish Bay היא העצירה הראשונה.",
    e: "חוף חולי עם דיונות ושביל לאורך החוף. כאן נמצא מלון The Inn at Spanish Bay.",
    t: ["💡 האגרה היא כ-$12 לרכב, ומחזירים אותה אם אוכלים ב-$35 ומעלה במסעדות של Pebble Beach.", "השערים פתוחים מזריחה עד שקיעה. ממליצים לתכנן כך שהנסיעה תסתיים לקראת השקיעה.", "בשקיעה מגיע ל-Inn at Spanish Bay נגן חמת חלילים (Bagpiper), ואפשר לשבת ליד מדורות הגז. בחורף הוא מתחיל בסביבות 17:45."]
  },
  "Bird Rock": {
    a: "סלע בים מול החוף, שמשמש מקלט לחיות בר.",
    e: "על הסלע ומסביבו רואים קורמורנים, שחפים, אריות ים, כלבי ים ולפעמים לוטרות.",
    t: ["💡 זו הנקודה הכי טובה בכל ה-17-Mile Drive לצפייה בחיות. להביא משקפת."]
  },
  "Lone Cypress": {
    a: "ברוש מונטריי בודד על סלע מעל הים, בן כ-250 שנה. הוא אחד העצים המצולמים בעולם, והסמל של Pebble Beach.",
    e: "יש תצפית מגודרת קצרה. אי אפשר לגשת לעץ עצמו.",
    t: ["💡 Cypress Point Lookout, קצת אחריו, הוא אחת הנקודות הכי טובות לשקיעה בכל הנסיעה."]
  },
  "Pebble Beach": {
    a: "מגרש הגולף המפורסם בעולם, לצד מלון The Lodge at Pebble Beach.",
    e: "מותר להיכנס ללובי ולמרפסת של המלון, משם יש נוף לגומה ה-18 ולים. יש גם חנויות ובית קפה.",
    t: ["💡 לשבת לשתות משהו במרפסת מול הגומה ה-18, וגם לקבל החזר על אגרת הכביש."]
  },
  "Carmel-by-the-Sea: Ocean Avenue": {
    a: "עיירת אגדות קטנה עם בתי \"סיפורי פיות\", גלריות וחנויות. עד היום אין בה מספרי בתים ברחובות.",
    e: "Ocean Avenue יורדת עד החוף. בצדדים יש סמטאות עם חצרות פנימיות, בתי קפה וחנויות מתוקים.",
    t: ["💡 לטייל בסמטאות הצדדיות ולחפש את בתי האגדות של Comstock, באזור Torres St ו-6th Ave."]
  },
  "Carmel Beach בשקיעה": {
    a: "חוף חול לבן ורך בקצה Ocean Avenue, עם ברושים.",
    e: "חוף רחב שמתאים לריצה של ילדים וכלבים. אחד המקומות היפים לשקיעה בקליפורניה.",
    t: ["💡 להגיע 20 דקות לפני השקיעה (שעת השקיעה מופיעה בכרטיס מזג האוויר). אחרי השקיעה מתקרר מהר, להביא שכבה."]
  },
  "Bixby Creek Bridge": {
    a: "גשר הקשת המפורסם של ביג סור משנת 1932. הוא אחד הגשרים המצולמים בארצות הברית.",
    e: "קשת בטון לבנה מעל קניון עמוק, שמסתיים בים.",
    t: ["💡 התמונה הקלאסית מצולמת מהמפרץ הקטן לחניה בצד הצפוני של הגשר, לפני שעוברים אותו (מגיעים מצפון).", "החניה מאוד מוגבלת. לא לעצור על הכביש עצמו."]
  },
  "נסיעה דרך Big Sur": {
    a: "כ-140 ק\"מ של כביש מתפתל בין צוקים לים. זה אחד הכבישים היפים בעולם.",
    e: "מפרצונים, גשרים, יערות סקוויה ונקודות תצפית לאורך כל הדרך. כמעט אין קליטה, ותחנות הדלק יקרות ומעטות.",
    t: ["💡 עדכון 20.11: בגלל הסופה Caltrans סגרה ב-18.11 קטע של כ-74 ק\"מ בין Nepenthe ל-Ragged Point. לפי דיווחים הכביש נפתח מחדש, עם עיכובים ליד Fernwood. לבדוק ב-QuickMap בבוקר.", "לנסוע מצפון לדרום, כמו שתכננתם. כך הנתיב צמוד לים והתצפיות בצד שלכם."]
  },
  "McWay Falls": {
    a: "מפל של 24 מטר שנופל ישר לחוף חול בתוך מפרץ טורקיז. זהו אחד המראות היפים בביג סור.",
    e: "שביל קצר ושטוח, כחצי ק\"מ, מוביל מהחניון של Julia Pfeiffer Burns State Park לתצפית.",
    t: ["💡 אי אפשר לרדת לחוף, הגישה סגורה. התצפית מהשביל היא החוויה.", "חניה בפארק בתשלום (כ-$10). לפעמים יש חניה חינם בשולי כביש 1, אבל המקומות מעטים."]
  },
  "Piedras Blancas Elephant Seals": {
    a: "מושבת פילי ים ענקית על החוף, צפונית ל-San Simeon. בשיא העונה נמצאים כאן אלפי פילי ים.",
    e: "חניון גדול על כביש 1, ומשם שבילי צפייה מגודרים מעל החוף. פילי הים שוכבים, נוחרים ונלחמים ממש מתחתיכם.",
    t: ["💡 בסוף נובמבר מתחילים להגיע הזכרים הגדולים, לקראת עונת ההמלטה. זה חינם ופתוח תמיד.", "אחת העצירות הכי אהובות על ילדים בכל הכביש."]
  },
  "צ'ק-אין בדירה": {
    a: "דירה עם 3 חדרי שינה ב-Marina del Rey, בין Venice לסנטה מוניקה.",
    e: "בניין מגורים שקט עם חניון. Venice Beach והתעלות במרחק כ-10 דקות נסיעה.",
    t: ["💡 הוראות הכניסה מגיעות רק דרך האפליקציה של Booking. לא להגיב להודעות מ-\"Stayspro\"."]
  },
  "ערב, אם מגיעים מוקדם: Venice Beach וה-Skatepark": {
    a: "הטיילת האקסצנטרית של לוס אנג'לס: אמנים, מופעי רחוב, Muscle Beach וסקייטפארק מפורסם על החול.",
    e: "סקייטפארק עם קערות בטון ממש על החוף, שבו רואים סקייטרים מקצועיים. בהמשך נמצאות תעלות Venice, שכונה שקטה עם גשרונים.",
    t: ["💡 הכי יפה לקראת שקיעה. אחרי החושך הטיילת פחות נעימה למשפחות, ואז עדיף לעבור לפיר של סנטה מוניקה."]
  },
  "Santa Monica Pier וגלגל הענק": {
    a: "המזח ההיסטורי של סנטה מוניקה, נקודת הסיום של כביש 66, עם לונה פארק קטן (Pacific Park).",
    e: "Pacific Wheel, גלגל ענק סולארי בגובה של יותר מ-40 מטר מעל הים, רכבת הרים קטנה, משחקים ודוכני אוכל. המזח פתוח 24 שעות.",
    t: ["💡 לעלות על הגלגל בשקיעה, כולם ממליצים. נוסע יחיד לא יכול לעלות לבד.", "כרטיס בודד לגלגל עולה כמה דולרים. אם הילדים רוצים כמה מתקנים, משתלם לקנות צמיד."]
  },
  "יוצאים מהדירה": { a: "יציאה מוקדמת לשדה התעופה.", e: "ביום חג ההודיה בבוקר התנועה בדרך כלל קלה, אבל השדה עצמו עמוס.", t: ["💡 לתדלק בתחנה ליד LAX לפני ההחזרה. Hertz גובים מחיר גבוה מאוד על מילוי."] },
  "החזרת הרכב, Hertz LAX": { a: "מרכז ההחזרות של Hertz ליד LAX.", e: "שאטל של Hertz לוקח מכאן לטרמינלים, כ-10–15 דקות.", t: ["💡 לצלם את הרכב ואת מד הדלק בהחזרה."] },
  "Witch's House (Spadena House)": {
    a: "\"בית המכשפה\": בית בסגנון אגדות עם גג עקום, חלונות מעוותים וגדר רעועה. הוא נבנה ב-1920 כתפאורה באולפן קולנוע, והועבר לבוורלי הילס ב-1924.",
    e: "בית פרטי ברחוב מגורים יוקרתי. מצלמים מהמדרכה.",
    t: ["💡 לא להיכנס לחצר ולא לחסום את הכניסה. זה בית מגורים."]
  },
  "Beverly Hills · Rodeo Drive": {
    a: "רחוב האופנה היוקרתי בעולם, בלב בוורלי הילס.",
    e: "חנויות של בתי האופנה הגדולים, וסמטת Two Rodeo עם המדרגות המפורסמות. בסמוך, ב-Beverly Gardens Park, נמצא שלט Beverly Hills.",
    t: ["💡 תמונה ליד שלט Beverly Hills בפארק, וחניה ציבורית בחניונים העירוניים. השעתיים הראשונות שם לפעמים חינם."]
  },
  "נסיעה בין בתי המפורסמים: Holmby Hills": { a: "השכונה היוקרתית ביותר בלוס אנג'לס, עם אחוזות ענק.", e: "רוב הבתים מוסתרים מאחורי גדרות ועצים. הנסיעה היא בעיקר בשביל האווירה.", t: ["💡 לנסוע ב-Sunset Blvd ובשדרות הצדדיות. לא לעצור מול שערים."] },
  "Bel Air": { a: "שכונת יוקרה על הגבעות, עם השער המפורסם ב-Sunset Blvd.", e: "כבישים מתפתלים בין אחוזות. שער הכניסה המזרחי הוא תמונה קלאסית.", t: ["💡 תמונה בשער Bel Air East Gate, ב-Sunset Blvd."] },
  "Sunset Boulevard": { a: "השדרה האייקונית, שחוצה את העיר מהים ועד דאונטאון.", e: "בקטע Sunset Strip יש מועדונים היסטוריים ושלטי חוצות ענקיים.", t: ["💡 לנסוע ב-Sunset Strip מערבה למזרח, בדרך להוליווד."] },
  "Hollywood Walk of Fame": {
    a: "המדרכה עם יותר מ-2,700 כוכבים של אנשי בידור, לאורך Hollywood Blvd.",
    e: "רחוב עמוס בתיירים, דמויות מחופשות וחנויות מזכרות.",
    t: ["💡 דמויות מחופשות מבקשות תשלום אחרי צילום. אם לא רוצים, פשוט לא לצלם איתן.", "לפני שמגיעים, לבחור כוכבים לחפש. לילדים זה משחק מצוין."]
  },
  "TCL Chinese Theatre ו-Dolby Theatre": {
    a: "קולנוע בסגנון מקדש סיני משנת 1927. ברחבה שלו טביעות ידיים ורגליים של כוכבי הוליווד. בשכנות נמצא ה-Dolby Theatre, בית טקס האוסקר.",
    e: "הרחבה עם הטביעות פתוחה לכולם, בלי תשלום. מאחור נמצא מתחם Ovation Hollywood, עם מדרגות ומרפסות.",
    t: ["💡 ממרפסות Ovation Hollywood, מאחורי ה-Dolby, יש תצפית טובה לשלט HOLLYWOOD בלי לנסוע לגבעות.", "לתצפית הטובה ביותר על השלט ממליצים על Lake Hollywood Park, אם נשאר זמן."]
  },
  "The Grove ו-Original Farmers Market": {
    a: "שני מתחמים צמודים: The Grove הוא קניון פתוח עם חשמלית קטנה ומזרקה מוזיקלית, ו-Original Farmers Market הוא שוק אוכל היסטורי משנת 1934.",
    e: "בתקופת החגים יש ב-The Grove עץ חג ענק וקישוטים. בשוק עשרות דוכנים: ממתקים, דונאטס, אוכל מכל העולם.",
    t: ["💡 לאכול בשוק ולא בקניון. יש שם מבחר לכל הילדים, והמחיר נוח יותר.", "חג ההודיה: לבדוק שעות. חלק מהמקומות סגורים או נסגרים מוקדם."]
  },
  "Calico Ghost Town": {
    a: "עיירת כסף מ-1881 שהפכה לפארק מחוזי. היא משוחזרת כעיר מערבון.",
    e: "רחוב ראשי עם בתי עץ, מכרה Maggie Mine שאפשר להיכנס אליו, רכבת קטנה (Calico Odessa) של כ-8 דקות, שטיפת זהב ו-Mystery Shack.",
    t: ["💡 מכרה Maggie Mine הוא הלהיט: מואר, מאוורר ומתאים לילדים.", "הכניסה בתשלום קטן, וכל אטרקציה בתשלום נפרד. פתוח 9:00–17:00.", "מקום מושלם למתוח רגליים באמצע הנסיעה."]
  },
  "Peggy Sue's 50's Diner": {
    a: "דיינר בסגנון שנות ה-50 על Route 66 הישן ב-Yermo, עם תפאורה של כוכבי קולנוע ומוזיקה מהתקופה.",
    e: "מאחורי הדיינר יש Diner-Saur Park: גן עם דינוזאורים מתכת גדולים ופסל של קינג קונג. פתוח מ-6:00 עד 22:00.",
    t: ["💡 מבקרים מזהירים, בחיוך, שיש פסל מבהיל בשירותי הנשים.", "שייקים ומילקשייקים הם הסיבה לעצור. וגם לצלם עם הדינוזאורים."]
  },
  "EddieWorld (רשות)": { a: "תחנת דלק וחנות ענק עם גביע גלידה של יותר מ-20 מטר. היא מפורסמת כ\"הכי מפוארת במדבר\".", e: "חנות ממתקים ענקית, ג'רקי, קפה ושירותים נקיים.", t: ["💡 עצירה מצוינת לשירותים ודלק לפני הקטע האחרון לווגאס."] },
  "צ'ק-אין ב-New York-New York": {
    a: "מלון-קזינו שבנוי כקו הרקיע של ניו יורק, עם פסל חירות, גשר ברוקלין ורכבת הרים שמקיפה את הבניינים.",
    e: "בפנים יש רחובות בסגנון ניו יורקי עם אוכל מהיר. המלון מחובר בגשר הולכי רגל ל-MGM Grand ול-Excalibur.",
    t: ["💡 מבקשים חדר עם נוף לסטריפ, לפעמים זה עובד בלי תוספת.", "בווגאס מוסיפים למחיר דמי אתר (Resort Fee) לכל לילה. לא להיבהל בצ'ק-אין."]
  },
  "Park MGM ← Cosmopolitan": { a: "הליכה לאורך הסטריפ.", e: "Park MGM אלגנטי ושקט יחסית. ב-Cosmopolitan יש לובי מרשים עם עמודי מסכים, ונברשת ענק בת 3 קומות.", t: ["💡 להיכנס לראות את הנברשת ב-Cosmopolitan. בדרך כלל אפשר גם להגיע דרכו לגשר הולכי הרגל לבלאג'יו."] },
  "Bellagio: המזרקות וה-Conservatory": {
    a: "מופע המזרקות המפורסם של ווגאס, ממש מול המלון, וגן החורף המקורה של Bellagio.",
    e: "המזרקות רוקדות לצלילי מוזיקה, והסילונים מגיעים לגובה של עד 140 מטר. ה-Conservatory הוא גן פרחים ענק בעיצוב עונתי, ובסוף נובמבר עובר לעיצוב חג. פתוח 24/7 ובחינם.",
    t: ["💡 אחר הצהריים המופעים כל חצי שעה, ובערב כל רבע שעה. המופעים אחרי 20:00 הכי מרשימים, עם כל הסטריפ מואר.", "המקום הכי טוב לצפייה: מעקה האגם מול המלון, או הגשר מעל הכביש לכיוון Paris."]
  },
  "Big Apple Coaster, אם יש כוח": { a: "רכבת הרים שעוברת בין המגדלים של New York-New York.", e: "כוללת סיבוב-צלילה ייחודי של 180 מעלות.", t: ["💡 יש מגבלת גובה לילדים. לבדוק ליד הקופה."] },
  "Uber ל-Venetian: Grand Canal ו-St. Mark's Square": {
    a: "המלון שבנוי כמו ונציה: תעלות עם גונדולות ושמיים מצוירים, בפנים ובחוץ.",
    e: "Grand Canal Shoppes: רחוב חנויות לאורך תעלה מקורה, עם זמרים ופסלים חיים בכיכר St. Mark's.",
    t: ["💡 שיט גונדולה לוקח כ-14 דקות. אפשר גונדולה משותפת לארבעה אנשים. כרטיסים לאותו יום קונים בדוכן Emporio d'Gondola.", "מבקרים מעדיפים את הגונדולה בפנים, כי היא מוצלת מהשמש. המחיר זהה."]
  },
  "LINQ Promenade": { a: "רחוב הולכי רגל פתוח בין המלונות, עם מסעדות וגלגל ענק (High Roller).", e: "High Roller הוא אחד הגלגלים הגבוהים בעולם, וסיבוב אחד לוקח כ-30 דקות.", t: ["💡 ה-High Roller הכי יפה בשקיעה. מתאים אם לא עליתם על הגלגל בסנטה מוניקה."] },
  "Caesars Palace ו-Forum Shops": { a: "מלון בסגנון רומא העתיקה, עם קניון מקורה ותקרה מצוירת כשמיים.", e: "פסלים, מזרקות ומזרקת טרווי. בתוך הקניון שמיים מצוירים שמשנים צבע במהלך היום.", t: ["💡 כאן נמצאת המסעדה של גורדון רמזי. להזמין מראש אם רוצים."] },
  "Omega Mart ב-AREA15": {
    a: "\"סופרמרקט\" מטורף של קולקטיב האמנות Meow Wolf. מאחורי המדפים והמקררים מסתתרים עולמות סוריאליסטיים ותעלומה שמפענחים.",
    e: "מבוך של חדרים, מנהרות ומחילות. אפשר לשחק עם כרטיס שפותח רמזים, או פשוט לחקור. AREA15 עצמו הוא מתחם עם עוד חוויות אמנותיות ובר.",
    t: ["💡 להקדיש לפחות שעתיים וחצי. מבקרים אומרים שזה פשוט עובר.", "לקנות כרטיסים מראש עם שעת כניסה. לא נכנסים בלי כרטיס."]
  },
  "Fremont Street Experience": {
    a: "\"הווגאס הישנה\" בדאונטאון: רחוב הולכי רגל מקורה במסך LED ענק, בגובה של כ-27 מטר.",
    e: "בערב מוקרנים על התקרה מופעי אור ומוזיקה, ויש במות עם להקות חיות. מעל הרחוב עובר אומגה (SlotZilla).",
    t: ["💡 מופעי התקרה מתחילים עם החשיכה ומוקרנים בערך פעם בשעה. לבדוק את הלוח ולעמוד באמצע הרחוב.", "צפוף ורועש. להחזיק את הילדים קרוב."]
  },
  "Welcome to Fabulous Las Vegas Sign": {
    a: "השלט המפורסם בכניסה לעיר משנת 1959, בקצה הדרומי של הסטריפ.",
    e: "השלט עומד על אי באמצע הכביש. היום יש לידו חניון קטן.",
    t: ["💡 להגיע בבוקר, לפני שמתחיל תור לצילום. יש חניון קטן מאחורי השלט, אז לא צריך לחצות את הכביש."]
  },
  "FlyOver: Wonders of the American West": {
    a: "סימולטור \"טיסה\" על מושבים תלויים מול מסך כיפה ענק, עם רוח, ריחות ותנועה.",
    e: "הסרט עובר מעל הגרנד קניון, מונומנט ואלי ונופי המערב. נמצא על הסטריפ, ליד ה-Showcase Mall.",
    t: ["💡 סיום מושלם לטיול: רואים מהאוויר נופים דומים למה שעברתם.", "יש מגבלת גובה לילדים. לבדוק."]
  },
  "Mandalay Bay, Luxor ו-Excalibur (רשות)": { a: "שלושה מלונות בקצה הדרומי של הסטריפ: פירמידה, טירה ומלון טרופי.", e: "ב-Mandalay Bay יש אקווריום כרישים (Shark Reef). ה-Luxor בנוי כפירמידה עם אטריום ענק.", t: ["💡 רכבת חינם (Tram) מחברת בין שלושתם. נוח עם ילדים עייפים."] },
  "Uber לשדה התעופה ← טיסת ערב": { a: "נמל התעופה Harry Reid, כ-10–15 דקות מהסטריפ.", e: "בשדה יש מכונות מזל.", t: ["💡 להגיע שעתיים לפני הטיסה. סוף שבוע של חג ההודיה הוא מהעמוסים בשנה בשדות התעופה."] }
};

/* Wikipedia article(s) whose lead image shows each stop; first one that has an image wins. */
const WIKI = {
  "נחיתה ב-SFO": ["San Francisco International Airport"],
  "Crissy Field": ["Crissy Field"],
  "Golden Gate Bridge": ["Golden Gate Bridge"],
  "Powell-Hyde Cable Car": ["San Francisco cable car system"],
  "יורדים ב-Hyde & Lombard ← Lombard Street": ["Lombard Street (San Francisco)"],
  "להגיע ל-Pier 33": ["Alcatraz Island"],
  "Alcatraz": ["Alcatraz Island"],
  "Pier 39 וארוחת צהריים": ["Pier 39"],
  "Fisherman's Wharf": ["Fisherman's Wharf, San Francisco"],
  "Musée Mécanique": ["Musée Mécanique"],
  "Ghirardelli Square": ["Ghirardelli Square"],
  "תדלוק במריפוסה": ["Mariposa, California"],
  "Tunnel View": ["Tunnel View"],
  "Bridalveil Fall": ["Bridalveil Fall"],
  "צ'ק-אין ב-Yosemite View Lodge": ["El Portal, California"],
  "Lower Yosemite Fall": ["Yosemite Falls"],
  "El Capitan Meadow": ["El Capitan"],
  "Valley View": ["Yosemite Valley"],
  "ערב רגוע ב-Old Fisherman's Wharf": ["Old Fisherman's Wharf", "Monterey, California"],
  "Monterey Bay Aquarium": ["Monterey Bay Aquarium"],
  "Cannery Row": ["Cannery Row"],
  "17-Mile Drive: Spanish Bay": ["17-Mile Drive"],
  "Bird Rock": ["17-Mile Drive", "Pebble Beach, California"],
  "Lone Cypress": ["Lone Cypress"],
  "Pebble Beach": ["Pebble Beach Golf Links"],
  "Carmel-by-the-Sea: Ocean Avenue": ["Carmel-by-the-Sea, California"],
  "Carmel Beach בשקיעה": ["Carmel Beach", "Carmel-by-the-Sea, California"],
  "Bixby Creek Bridge": ["Bixby Creek Bridge"],
  "נסיעה דרך Big Sur": ["Big Sur"],
  "McWay Falls": ["McWay Falls"],
  "Piedras Blancas Elephant Seals": ["Piedras Blancas elephant seal rookery", "Northern elephant seal"],
  "ערב, אם מגיעים מוקדם: Venice Beach וה-Skatepark": ["Venice Beach"],
  "Santa Monica Pier וגלגל הענק": ["Santa Monica Pier"],
  "Witch's House (Spadena House)": ["Spadena House"],
  "Beverly Hills · Rodeo Drive": ["Rodeo Drive"],
  "נסיעה בין בתי המפורסמים: Holmby Hills": ["Holmby Hills, Los Angeles"],
  "Bel Air": ["Bel Air, Los Angeles"],
  "Sunset Boulevard": ["Sunset Boulevard"],
  "Hollywood Walk of Fame": ["Hollywood Walk of Fame"],
  "TCL Chinese Theatre ו-Dolby Theatre": ["Grauman's Chinese Theatre"],
  "The Grove ו-Original Farmers Market": ["The Grove at Farmers Market", "Farmers Market (Los Angeles)"],
  "Calico Ghost Town": ["Calico Ghost Town", "Calico, San Bernardino County, California"],
  "Peggy Sue's 50's Diner": ["Yermo, California"],
  "EddieWorld (רשות)": ["Yermo, California"],
  "צ'ק-אין ב-New York-New York": ["New York-New York Hotel and Casino"],
  "Park MGM ← Cosmopolitan": ["The Cosmopolitan of Las Vegas"],
  "Bellagio: המזרקות וה-Conservatory": ["Fountains of Bellagio", "Bellagio (resort)"],
  "Big Apple Coaster, אם יש כוח": ["The Big Apple Coaster", "New York-New York Hotel and Casino"],
  "Uber ל-Venetian: Grand Canal ו-St. Mark's Square": ["The Venetian Las Vegas"],
  "LINQ Promenade": ["The Linq Promenade", "High Roller (Ferris wheel)"],
  "Caesars Palace ו-Forum Shops": ["Forum Shops at Caesars", "Caesars Palace"],
  "Omega Mart ב-AREA15": ["Omega Mart", "Area15", "Meow Wolf"],
  "Fremont Street Experience": ["Fremont Street Experience"],
  "Welcome to Fabulous Las Vegas Sign": ["Welcome to Fabulous Las Vegas sign", "Las Vegas Strip"],
  "Mandalay Bay, Luxor ו-Excalibur (רשות)": ["Luxor Las Vegas"],
  "Uber לשדה התעופה ← טיסת ערב": ["Harry Reid International Airport"]
};

/* Search text for each stop in Google Maps / TripAdvisor (opens the place with its photos and reviews) */
const PLACEQ = {
  "נחיתה ב-SFO": "San Francisco International Airport", "צ'ק-אין ב-Star Motel": "Star Motel 1727 Lombard St San Francisco",
  "Crissy Field": "Crissy Field San Francisco", "Golden Gate Bridge": "Golden Gate Bridge Welcome Center",
  "Powell-Hyde Cable Car": "Powell-Hyde Cable Car San Francisco", "יורדים ב-Hyde & Lombard ← Lombard Street": "Lombard Street San Francisco",
  "להגיע ל-Pier 33": "Alcatraz Landing Pier 33", "Alcatraz": "Alcatraz Island", "Pier 39 וארוחת צהריים": "Pier 39 San Francisco",
  "Fisherman's Wharf": "Fisherman's Wharf San Francisco", "Musée Mécanique": "Musee Mecanique San Francisco", "Ghirardelli Square": "Ghirardelli Square",
  "איסוף הרכב, Fisherman's Wharf": "Hertz 500 Beach Street San Francisco", "תדלוק במריפוסה": "Mariposa California",
  "Tunnel View": "Tunnel View Yosemite", "Bridalveil Fall": "Bridalveil Fall Yosemite", "צ'ק-אין ב-Yosemite View Lodge": "Yosemite View Lodge El Portal",
  "Lower Yosemite Fall": "Lower Yosemite Fall Trail", "El Capitan Meadow": "El Capitan Meadow Yosemite", "Valley View": "Valley View Yosemite",
  "צ'ק-אין ב-Arbor Inn": "Arbor Inn Monterey", "ערב רגוע ב-Old Fisherman's Wharf": "Old Fisherman's Wharf Monterey",
  "Monterey Bay Aquarium": "Monterey Bay Aquarium", "Cannery Row": "Cannery Row Monterey", "17-Mile Drive: Spanish Bay": "Spanish Bay 17-Mile Drive",
  "Bird Rock": "Bird Rock 17-Mile Drive", "Lone Cypress": "The Lone Cypress Pebble Beach", "Pebble Beach": "The Lodge at Pebble Beach",
  "Carmel-by-the-Sea: Ocean Avenue": "Ocean Avenue Carmel-by-the-Sea", "Carmel Beach בשקיעה": "Carmel Beach Carmel-by-the-Sea",
  "Bixby Creek Bridge": "Bixby Creek Bridge", "נסיעה דרך Big Sur": "Big Sur California", "McWay Falls": "McWay Falls",
  "Piedras Blancas Elephant Seals": "Elephant Seal Vista Point Piedras Blancas", "צ'ק-אין בדירה": "13455 Maxella Ave Marina del Rey",
  "ערב, אם מגיעים מוקדם: Venice Beach וה-Skatepark": "Venice Beach Skatepark", "Santa Monica Pier וגלגל הענק": "Pacific Park Santa Monica Pier",
  "יוצאים מהדירה": "LAX Airport", "החזרת הרכב, Hertz LAX": "Hertz 5251 W 98th St Los Angeles",
  "Witch's House (Spadena House)": "Spadena House Beverly Hills", "Beverly Hills · Rodeo Drive": "Rodeo Drive Beverly Hills",
  "נסיעה בין בתי המפורסמים: Holmby Hills": "Holmby Hills Los Angeles", "Bel Air": "Bel Air East Gate Los Angeles", "Sunset Boulevard": "Sunset Strip West Hollywood",
  "Hollywood Walk of Fame": "Hollywood Walk of Fame", "TCL Chinese Theatre ו-Dolby Theatre": "TCL Chinese Theatre",
  "The Grove ו-Original Farmers Market": "The Grove Los Angeles", "Calico Ghost Town": "Calico Ghost Town", "Peggy Sue's 50's Diner": "Peggy Sue's 50's Diner Yermo",
  "EddieWorld (רשות)": "EddieWorld Yermo", "צ'ק-אין ב-New York-New York": "New York-New York Hotel Las Vegas", "Park MGM ← Cosmopolitan": "The Cosmopolitan of Las Vegas",
  "Bellagio: המזרקות וה-Conservatory": "Fountains of Bellagio", "Big Apple Coaster, אם יש כוח": "The Big Apple Coaster Las Vegas",
  "Uber ל-Venetian: Grand Canal ו-St. Mark's Square": "Grand Canal Shoppes Venetian Las Vegas", "LINQ Promenade": "The LINQ Promenade Las Vegas",
  "Caesars Palace ו-Forum Shops": "The Forum Shops at Caesars Palace", "Omega Mart ב-AREA15": "Omega Mart AREA15 Las Vegas",
  "Fremont Street Experience": "Fremont Street Experience", "Welcome to Fabulous Las Vegas Sign": "Welcome to Fabulous Las Vegas Sign",
  "FlyOver: Wonders of the American West": "FlyOver Las Vegas", "Mandalay Bay, Luxor ו-Excalibur (רשות)": "Luxor Las Vegas",
  "Uber לשדה התעופה ← טיסת ערב": "Harry Reid International Airport"
};
