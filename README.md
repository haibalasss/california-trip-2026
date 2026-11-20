# California Trip 2026

אפליקציית טיול: סן פרנסיסקו ← יוסמיטי ← מונטריי ← לוס אנג'לס, 20–26 בנובמבר 2026.

- `site/index.html` – האפליקציה. פרטי ההזמנות מוצפנים (AES-GCM, מפתח שנגזר מהסיסמה המשפחתית ב-PBKDF2). הסיסמה עצמה לא נשמרת בריפו.
- מזג אוויר חי נטען בדפדפן מ-[Open-Meteo](https://open-meteo.com/).
- `scripts/flights.mjs` – מושך גייט, טרמינל ועיכובים מ-AeroDataBox ושומר `flights.json`. רץ כל 20 דקות בימי הטיסות דרך GitHub Actions.

## הגדרה חד-פעמית
1. **Settings ← Pages ← Source: GitHub Actions**
2. **Settings ← Secrets and variables ← Actions ← New repository secret**: `AERODATABOX_KEY` (מפתח RapidAPI ל-AeroDataBox). בלי המפתח האתר עובד, רק בלי סטטוס טיסות.

## המלצות אוכל חיות (food-live.json)
בלשונית "אוכל" יש כפתור שמעתיק הודעה עם המיקום ורשימת המקומות הקרובים. מדביקים אותה בשיחה עם Claude, והוא מחפש דירוגים וביקורות ברשת ומעדכן את `site/food-live.json`:

```json
{ "updated": "ISO time", "where": { "ll": [lat, lng], "label": "..." }, "note": "optional",
  "items": [ { "n": "name", "c": "address/area", "t": "type (he)", "r": "4.5", "s": "rating source",
               "w": "what it is (he)", "k": "kids tip (he)", "ks": "y|t|u (seating with kids: yes / better takeaway / unknown)", "kst": "seating detail (he)", "q": "photo search (en)", "ll": [lat, lng], "u": "website" } ] }
```
