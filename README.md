# California Trip 2026

אפליקציית טיול: סן פרנסיסקו ← יוסמיטי ← מונטריי ← לוס אנג'לס, 20–26 בנובמבר 2026.

- `site/index.html` – האפליקציה. פרטי ההזמנות מוצפנים (AES-GCM, מפתח שנגזר מהסיסמה המשפחתית ב-PBKDF2). הסיסמה עצמה לא נשמרת בריפו.
- מזג אוויר חי נטען בדפדפן מ-[Open-Meteo](https://open-meteo.com/).
- `scripts/flights.mjs` – מושך גייט, טרמינל ועיכובים מ-AeroDataBox ושומר `flights.json`. רץ כל 20 דקות בימי הטיסות דרך GitHub Actions.

## הגדרה חד-פעמית
1. **Settings ← Pages ← Source: GitHub Actions**
2. **Settings ← Secrets and variables ← Actions ← New repository secret**: `AERODATABOX_KEY` (מפתח RapidAPI ל-AeroDataBox). בלי המפתח האתר עובד, רק בלי סטטוס טיסות.
