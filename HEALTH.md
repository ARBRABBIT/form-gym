# Health overview, check-ins and reminders

> Current scope (24 November 2026): Stool/Gut tracking is removed from the active app. Its original code, tests and integration notes are archived in bin.md. The home health overview now shows three WHOOP cards. Older stool references below describe the previous implementation.


## What works locally

The home screen contains four cards. Overall body is the wide primary card. Blood health groups circulation/oxygen signals; Lung groups sleep breathing signals. Neither represents a lab test or a diagnostic score. Gut explicitly shows manual journal entries, not WHOOP measurements.

Morning check-in supports camera/gallery input, local OCR, optional cloud OCR, kg/lb review, date, optional bathroom condition and notes. Confirmed readings are stored in kg in the existing browser journal. Gain/loss compares the preceding dated entry. Photos stay in memory and are not saved to the journal. Nothing is sent to cloud OCR unless the user selects the cloud option. A clear synthetic scale-display photo is tested through the real browser OCR worker; real-world reflections and segmented displays can need correction or manual entry.

Gut check-in saves Bristol type 1–7, date, time, comfort and optional notes. The home card follows the selected date. No invented gut score is calculated. PoopCheck photo analysis remains unavailable: the provider publishes business access information, but an integration contract, API key and India commercial-access confirmation have not been supplied. The implementation does not guess a vendor endpoint or send stool images to a general model.

## WHOOP data

`GET /api/whoop/metrics?date=YYYY-MM-DD&timezone=Asia/Kolkata` requests v2 cycles, recovery, sleep and workouts through the encrypted browser WHOOP session. It follows pagination, filters records by the selected local day, links recovery to sleep/cycle IDs, and ignores unscored fields. Strain follows the cycle starting on that date; sleep follows its ending date. Missing data remains unavailable, not a synthetic score. Energy is converted from kJ to kcal.

Available cards show recovery, sleep duration/performance, daily strain, steps, workout count, energy, skin temperature, HRV, resting heart rate, SpO₂ and respiratory rate. Blood pressure, blood glucose, cholesterol and lung-function scores are not inferred.

Developer credentials and an HTTPS callback are still required for live WHOOP data; see WHOOP.md. Browser tests use explicit test-only response fixtures. Production screens do not ship fabricated WHOOP values.

## Running reminders

Use Node 24 or newer. `npm run dev -- --port 3001` and `npm start -- --port 3001` launch both Next.js and the reminder worker. The worker checks due notifications every 30 seconds. For a separate worker use `npm run reminders`; for an external scheduler call `POST /api/reminders/run` once per minute with `Authorization: Bearer <REMINDER_CRON_SECRET>`.

Push settings/subscriptions and generated VAPID keys live in `.form-data/reminders.sqlite` (or FORM_DATA_DIR), with restricted file permissions. Keep this directory durable and private. Multiple delivery processes use an atomic SQLite lease. Daily reminders are tagged to replace duplicates, support 30-minute snooze/skip, honor the chosen IANA time zone, and stop after a current-day check-in. A reminder is attempted within one hour of the chosen time; device connectivity and Focus modes can delay display. Invalid subscriptions are removed on provider 404/410. No push message is sent until the user opts in.

Use a real HTTPS deployment for phone notifications. iPhone users must add Form to their Home Screen and grant notification permission from the app. The HTTP LAN link supports layout/manual/OCR preview but cannot enable service-worker push. Set VAPID_SUBJECT to a real application/contact URI. For serverless hosting, a persistent database and a scheduled trigger replace the local filesystem worker; do not rely on ephemeral disk.

The existing account flow is still a personal browser prototype. Before multi-user production, add real authenticated accounts, user-bound health tokens, authenticated/rate-limited OCR and reminder subscriptions, coordinated token refresh and a production database.

## OCR assets

`npm install` runs `npm run prepare:ocr`, which copies installed Tesseract worker/core/language assets into generated `public/ocr` (gitignored). No third-party model CDN is needed at runtime. The browser downloads only its matching core and the English model. Cloud fallback requires GOOGLE_VISION_API_KEY on the server, a Google Cloud project with billing/Vision enabled, and the user's explicit photo-sharing choice.

## Validation

`npm run test:health` exercises OCR parsing, time-zone boundaries, push endpoint validation and suppression after a check-in. Playwright covers four-card rendering, mobile layout, real local OCR, mocked cloud OCR, confirmation, pounds-to-kg conversion, persistence, gut entries, reminder mood/time selection, denied permissions and the notification deep link. WHOOP and push device delivery cannot be live-verified without account authorization/device permission.

References checked 23 November 2026:
- WHOOP API: https://developer.whoop.com/api/
- PoopCheck business API: https://poopcheck.app/business/api/
- Tesseract.js API: https://github.com/naptha/tesseract.js/blob/master/docs/api.md
- Web Push: https://github.com/web-push-libs/web-push
- iPhone web push: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/

Shipping PNG icons were rendered from public/app-icon.svg using Sharp. OCR test-display images are generated by the tests and are not product health data.

## Illustrative mode update - 24 November 2026

At the user's request, Explore the sample journal now shows labeled sample WHOOP-style readings across home and health details, plus populated journal history. sampleData marks this mode. These readings do not claim a connected provider and do not change the OAuth connection state. Personal journals retain the live API/blank-until-available behavior. The Water card is an explicitly labeled, interactive sample preview with isolated local state. Older statements that no sample readings ship describe the earlier scope.
