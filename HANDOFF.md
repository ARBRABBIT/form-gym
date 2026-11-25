# Form gym journal — prototype handoff

> Current scope (24 November 2026): Stool/Gut tracking is removed from the active app. Its original code, tests and integration notes are archived in bin.md. The home health overview now shows three WHOOP cards. Older stool references below describe the previous implementation.


## Run and review

`npm install` then `npm run dev`. Open http://localhost:3000.

Use the visible **Member view** and **Trainer view** tabs in the header. All data persists in this browser using localStorage; tabs on the same origin synchronize saved changes. This is a prototype with sample journal data and linked sample members. Role selection demonstrates workflows, not authentication or access control. No account, server or cross-device persistence is included, as confirmed for this prototype.

The visual system follows the supplied references and written brief: Helvetica, monochrome, grouped entries and mobile sheets. Each repeated journal template is one reusable screen.

## Walkthrough

1. Open the app → Sign up or Log in (demo access). Set up four optional monthly goals → accept the 100-day challenge and optionally check Day 1 → enter approximate weight, date, manual gain/loss and notes → add good habits to build or bad habits to break → enter name, weight, height and weight goal. Make it mine shows a completion summary; Go to app enters the dashboard. Back and refresh preserve the draft. Returning members skip completed onboarding. Explore the sample journal opens the illustrative dashboard.
2. Trainer view → Arjun Sharma → select date → Edit assignment or Assign workout → enter exercises and six prescribed sets → Save assignment.
3. Member view → select matching date → View & log workout → review Assigned plan.
4. Trainer view → same member and date → Edit assignment → change and save. Member view displays the latest saved plan.
5. Member view → Log my workout → record start, finish, total time, actual sets, cardio, notes and satisfaction → Save workout log.
6. Trainer view → same member and date → Member’s actual log. Review actual values and expand the original plan snapshot.
7. Edit and save the trainer plan again. Actual sets, notes and the original submitted plan snapshot are preserved. Return to Member view → My saved log to see the plan-version notice.
8. Reload to verify persistence. Changes also synchronize to another tab using the same origin.

## Field coverage

| Journal template             | Route / screen                         | Coverage                                                                                                                                                                                                                                                                          |
| ---------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onboarding 1 | `#onboarding`, step 1 | Four optional goals for the current journal month, Skip for now. |
| Onboarding 2 | `#onboarding`, step 2 | 100-day intention, challenge acceptance, Day 1 checkbox. |
| Onboarding 3 | `#onboarding`, step 3 | Date, approximate weight, manual gain/loss, notes. |
| Onboarding 4 | `#onboarding`, step 4 | Repeatable habits with build/break choices. |
| Onboarding 5 | `#onboarding`, step 5 | Name, approximate starting weight, height, Lose/Gain/Maintain weight and completion summary. |
| Monthly Planner              | `#planner`                             | Month/year picker, Sunday–Saturday calendar including leap years, note for each date in sheet, Goal 1–4.                                                                                                                                                                          |
| Habit Tracker                | `#habits`                              | Month, repeatable names, single-day checklist, monthly view with every valid day 01–31, total computed per habit for selected month.                                                                                                                                              |
| 100 Days Challenge           | `#challenge`                           | Target, independently toggled days 01–100, Note, completed count.                                                                                                                                                                                                                 |
| Weight Tracker               | `#weight`                              | Month/year, repeatable entries with Date, Weight, separate manual Gain+ and Loss+, Notes. Entries can be reopened and edited.                                                                                                                                                     |
| Starting Point and Results   | `#results`                             | Name, starting Weight, Height, distinct My Goal radios, labeled Before and After note spaces; all ten measurements with Now and Vs. Last Month; independently labeled Now Date and Vs. Last Month Date; guide for all eight body locations.                                       |
| Monthly Review               | `#review`                              | All ten measurement rows with both columns; the three journal reflection questions as separate multiline inputs; month/year.                                                                                                                                                      |
| Daily Workout                | `#workout`                             | Selected day/date and Sunday–Saturday indicator; Start, Finish, Total Time, Muscle Group, Warm Up, Cool Down; repeatable exercises, six sets each with separate Reps and Weight; repeatable cardio Type, Time, Distance, Calories; Notes; satisfaction 0–100 with marks every 10. |
| Daily Nutrition and Wellness | `#nutrition`                           | Date; Weight, Waist, Sleep, Steps, Body Fat; six toggleable water marks, 1 mark = 1 L; Breakfast, Lunch, Dinner, Supplements/Snacks, each with repeatable Product, Serving Size, Calories, Protein, Carbs, Fat; each meal Subtotal, daily Total and visible Vs. Goal.             |
| Trainer home                 | Trainer tab / `#trainer`               | Searchable linked members; planned workouts and submitted logs by member/date.                                                                                                                                                                                                    |
| Trainer assignment           | Trainer → member → Assign/Edit         | Date and member, muscle group, warm-up, exercises and six planned sets, cool-down, repeatable cardio, Notes instructions, save confirmation.                                                                                                                                      |
| Linked actual log            | Trainer → member → Member’s actual log | Actual values, satisfaction, submission status, assigned-plan snapshot and version. Later plan edits do not overwrite member actuals.                                                                                                                                             |
| Member nutrition & wellness  | Trainer → member → Nutrition & wellness| Member's daily macro totals (calories, protein, carbs, fat, vs. goal), daily check-in (weight, waist, sleep, steps, body fat %, water intake), and meal logs (Breakfast, Lunch, Dinner, Supplements/Snacks) with item-level nutrients and subtotals.                                |

**Ten measurements, in both required views:** Neck, Shoulders, Chest, Bicep, Waist, Hip, Thigh, Calf, Weight, Body Fat %.

## Choices needing confirmation

1. **Gain+ / Loss+:** compare with the previous entry, baseline or another reference? Manual entries preserve both labels until confirmed.
2. **Vs. Last Month:** resolved by the anatomy comparison request. The measurement form shows the previous calendar month’s saved value. The results comparison displays both that value and the signed difference (selected month minus previous month). Blank data stays blank; body fat differences use percentage points. The two result dates remain independent and editable.
3. **Nutrition targets:** who supplies them and what are the targets? Vs. Goal displays Target unavailable. Meal and daily totals are computed from entered values.
4. **Before and After areas:** are these intended for photos? Currently labeled note spaces; no photo upload is assumed.
5. **Trainer scope:** extended to include workouts, logs, and daily nutrition & wellness per member in the trainer's member detail view. Access to other journal data (habits, challenges, reviews) or photos remains scoped to members pending separate decisions.

No trainer recording was supplied. No extra product rules have been inferred from one. The Form name and seeded journal values are illustrative.

## Validation

`npm run build`, `npm run typecheck`, `npm test`.
The browser tests cover the trainer/member round trip and preservation after plan edits, reload persistence, nutrition calculations, onboarding Back/Continue, leap-year calendar, all 100 challenge days, and phone overflow checks for each screen.

## Per-set completion

Members can check or uncheck each of the six sets in the assigned-plan view and actual-log editor. Completion saves automatically and synchronizes to the trainer’s assigned-plan and actual-log views, including another tab on the same browser origin. Trainer completion indicators are read-only. This progress is stored separately from prescribed values and submitted actuals; checking a set does not submit a log or fill in reps and weights. Plan edits preserve completion and submitted logs.

## Workout master data

The **Workout library** navigation is available in member and trainer views. Create or edit a named workout template with prescribed exercises, all six sets, warm-up, cool-down, cardio and notes. Templates persist in this browser alongside the journal.

In the trainer view, open a member, select the date, choose **Assign workout** or **Edit assignment**, then **Choose template**. Search by workout, muscle group or exercise and select a template to copy into the current draft. Review and save the assignment. Selecting a template replaces only the unsaved plan draft; submitted member logs remain intact.

Assignments receive independent exercise and cardio IDs and retain the template name used at assignment time. Later library changes apply only when a template is selected again; existing assignments, actual logs and set-completion records are preserved.

## Anatomy comparison in Starting point & results

- Exact supplied anatomy image is bundled at `public/images/anatomy-front.png`. No remote dependency or substitute image.
- Desktop: Before on the left, anatomy in the center, Last month on the right. Mobile: anatomy above two comparison columns.
- Starting measurements persist separately in optional `baselineMeasurements`. Explicit Starting weight supplies the initial Before weight; other missing values stay empty.
- All ten metrics display signed changes from actual saved values. Last month means the previous calendar month, including January/December rollover.
- GSAP/CSS perspective tilt, a reset control, and eight selectable body markers add depth to the supplied image. This is an interactive image, not a volumetric mesh or personalized body simulation. Reduced-motion preference disables pointer motion.
- Existing profile, Before/After notes, monthly measurements, result dates and location guide remain available.

## Network preview reliability

- IDs use native `crypto.randomUUID` on secure origins and a UUID v4 implementation backed by `crypto.getRandomValues` on plain HTTP LAN origins. This prevents first-run initialization and new-record actions from hanging on network previews.
- Next development origins include this machine’s current non-loopback IPv4 addresses, discovered at startup. Restart the server after changing Wi-Fi/network addresses.
- Playwright accepts `PLAYWRIGHT_BASE_URL` to test the actual network host/port; other local projects may occupy the default port. Use this app’s printed Network URL.
- Verified the LAN preview at `http://192.168.1.62:3002`, including fresh initialization, record creation/persistence and the HMR WebSocket.

## Navigation and completion motion

- GSAP settles new pages in 220 ms and clears inline transforms afterward. Rapid page changes cancel the previous transition; keyboard navigation and reduced motion skip the spatial entrance.
- Navigation capsules have brief press feedback; set checkboxes draw their tick and softly highlight completed rows. Habit/challenge checks use the same short stroke feedback. No changes to completion persistence or trainer synchronization.
- Navigation returns to the top with native smooth scrolling. Keyboard and reduced-motion paths return instantly. Dialogs keep native internal scrolling; wheel/touch input is not intercepted.

## Wheel month-and-year selector

- Replaced the month grid with independent Month and Year wheels, using the supplied scrolling-picker reference. A shared neutral band marks the centered selection; surrounding values fade toward the edges.
- Wheels use native touch momentum, mouse-wheel scrolling and snap points. Keyboard support includes Up/Down, PageUp/PageDown, Home/End, typing a month/year, Left/Right between columns and Enter to confirm.
- Month and year remain draft values until Done; Cancel, Escape, close and backdrop dismissal preserve the original value. This month applies the current month immediately.
- Years 1–9999 remain available, with only nearby rows mounted. Selected keyboard destinations mount before scroll jumps so snapping cannot redirect them to an old visible row.
- Existing portal, focus trap, scroll restoration and short-viewport containment remain in place. No day selection was added to month-only fields.

## Scrollable dashboard dates

- The dashboard date strip shows six dates at a time in a native horizontal scroller. Touch/trackpad scrolling and Earlier dates / Later dates buttons browse back to the selected month’s 1st.
- Browsing does not change the selected date. Tapping a date updates the journal; keyboard Left/Right, Home and End also select dates.
- The initial selected date stays near the center when space allows. Future dates remain disabled; the current-month strip ends two days after today (with at least six dates shown near the month’s start).
- Changing the month with Change date rebuilds the strip for that month. Resize preserves the selected date in view. Reduced motion uses instant arrow scrolling.

## Account entry and onboarding update

Login and signup are explicitly labeled demo access. Email identifies the single journal saved in this browser; passwords are neither checked nor persisted. A backend authentication provider is still required for real accounts. Sign up starts an empty journal, separate from illustrative sample data. A saved local journal cannot be overwritten by another signup. Log out ends the tab session; logging back in with the saved email resumes the journal.

Six setup steps save a resumable draft. Monthly goals can be skipped; weight, height, habits and challenge participation can be left blank. Accepting the challenge enables the Day 1 check. Finishing writes profile, goals, challenge, weight and habit records into their regular journal screens. Reduced-motion preferences suppress the setup transitions and completion animation. Current `reference-theme.css` tokens, rounded controls and lime selection states govern these new screens; older monochrome design notes predate that theme.

## WHOOP onboarding

An optional wearable step follows habits and precedes the starting profile. Select WHOOP to connect through its OAuth consent screen, or continue with manual tracking. The API is currently free; a WHOOP membership/device is still required. Live connection needs the server configuration in `.env.example` and an HTTPS callback; see [WHOOP.md](WHOOP.md). Health sync is not part of this screen-only change.

## Home health overview and daily check-ins

The home screen now groups health signals into a large Overall body card plus Blood health, Gut and Lung cards. WHOOP values are fetched by selected date through the server; user-entered weight and gut logs are source-labeled. Missing provider data stays blank.

Use Morning check-in for a scale photo or manual reading, review kg/lb and confirm before Send. Local OCR works without credentials; optional cloud fallback needs GOOGLE_VISION_API_KEY. Log a gut check-in with Bristol type, comfort and notes. Stool photo analysis is not connected without PoopCheck business access.

Morning reminders are opt-in, with India time zone, discreet/playful copy, snooze and skip. The dev/start scripts run the delivery worker. HTTP LAN preview supports manual/OCR flows; actual phone push needs an HTTPS PWA and permission. See HEALTH.md for deployment and privacy limits. Validation: 32 browser tests, four health unit checks and production build.

## Mobile-first artwork revision

The user confirmed that mobile design is the priority. Onboarding illustrations are now compact (68–84px at phone widths) and content-specific: target, challenge calendar, live weight scale, habit checklist, wearable and measuring tape. Welcome/signup, login and completion use a journal, lock and trophy. All preserve the same lime/ivory/chrome materials and bottom fade. The weight dial alone follows weight input. Built-in generation prompts and source/runtime paths are recorded in .impeccable/assets/onboarding-illustration-set.md. The login image uses the cleaned `onboarding-login-v2.webp` revision.

A save-on-reload race found during regression checking was addressed by flushing the latest journal on page hide/background, retaining the normal debounced typing saves.

Latest storage requirement supersedes the earlier browser-save behavior and save-on-reload fix: journal/account drafts now stay in React memory only. Removed local/session storage writes, reload restoration, browser account restriction, storage sync, and saved-to-browser messages. Legacy prototype keys are cleared at startup. WHOOP connects in a separate tab so setup remains in memory. Login/signup remain explicitly labeled demo access; no durable authenticated backend has been implemented. Older journal/health persistence tests describe the superseded behavior; onboarding coverage now checks in-memory flow and reset after reload.

Weight onboarding now uses src/components/weight-dial.tsx: draggable SVG arc, editable decimal number, plus/minus and keyboard controls. Date is top right in the progress row. Removed gain/loss/notes from onboarding only; regular journal trackers are outside this refinement. Illustration rotation removed and bottom fade strengthened. Verified phone widths 320/375/425, synchronized illustrative scale, native numeric bounds, touch drag, keyboard and in-memory back-navigation. Updated screenshots .impeccable/review/weight-dial-{320,375,425}.png.

Home health cards are now four compact linked summaries in a 2×2 phone grid, all above bottom navigation at 320×851, 375×812 and 425×851. Each has one value: WHOOP recovery %, SpO2 %, manual daily gut check-in completion %, and respiratory rate /min (WHOOP has no lung health percentage). Missing WHOOP readings stay blank. Hash destinations #health-body, #health-blood, #health-gut, #health-lung render separate detail pages with the full readings and existing check-in actions. Dates remain shared with home. Back button/browser Back return to home, Today stays selected, and detail headings receive focus. Fixed hash navigation to treat an empty hash as overview. Sample entry now opens at scroll position zero. New tests/health-summary.spec.ts covers viewport fit, links/history, honest empty states, manual check-in completion and detail actions.

Home health summary backgrounds now match the supplied radial reference: centered pastel washes fading to white at 85%, using lime for body, rose for blood, yellow for gut and sky for lung. Compact grid sizing and detail links remain in place. Visually checked phone render; all three health-summary checks pass.

## Full sample journal and water preview - 24 November 2026

Explore the sample journal now contains populated current-month weights, meal logs for every day through today, workout history, two workout templates, trainer assignments, baseline/previous-month measurements, monthly reviews, habits and planner entries. The sampleData flag enables explicitly labeled illustrative WHOOP readings; it never reports connected, fetches fake provider records or changes OAuth authorization status. Fresh personal journals explicitly clear the sample flag and all sample records. Checks in checks/sample.test.mjs verify isolation and honest connection state.

Water is a standalone dark teal/cyan card between Nutrition and Daily check-in, with 2.25 L sample data, six glass markers and 250 ml adjustments. At the user's request, blurred wave edges and a soft moving reflection add a gentle liquid effect. Text stays sharp; reduced motion stops waves and the reflection. The water component remains an isolated preview and does not write to the real Nutrition water log. Sample state remains memory-only and resets on reload. Use Explore the sample journal after refreshing to review the populated app.

## Signed-in preview correction - 24 November 2026

The user clarified that dummy data must also appear in their signed-in journal, not only Explore the sample journal. Completed signed-in journals now fill missing sections through withSamplePreview, preserve account/name and existing entries, and enable labeled sample health readings. The temporary preview applies in memory only after onboarding; the onboarding draft remains unchanged. Existing records take priority, including meal entries, same-date weights and workout plans/logs. The sampleData flag prevents deleted preview records from being continually reinserted during the session. A normal signed-in signup/skip-setup flow was verified with Bhargav Adepu's name, populated health cards, assigned workout and meals, without Explore sample. This supersedes earlier notes limiting sample readings to the sample entry path.

## Date-strip scrolling refinement - 24 November 2026

Fixed the ResizeObserver subscription callback interrupting GSAP selection scrolling. Native touch now uses proximity snapping; arrow movement remains eased, mouse wheels browse horizontally while hovering the strip, and desktop mouse dragging browses without selecting a date. New gestures interrupt ongoing tweens. Edge state changes only when boundaries change, reducing rerenders during scrolling. Both edges use narrow, masked backdrop blur and fade, hidden at the corresponding boundary. Keyboard date changes and reduced-motion paths move immediately. Verified arrow, wheel, drag, native touch swipe, keyboard Home/End, reduced-motion and 320/375/425/1440 widths; typecheck passes.


## Trainer access to full member journal — 24 November 2026

Trainer member detail now includes a Member journal tab covering goals, habits and marked dates, challenge, profile, expandable weight entries, baseline/current/previous measurements and result notes, planner, reviews and wearable readings. It uses the same state as member view; trainer review introduces no duplicate record store or new persistence. Workout assignment/log and nutrition tabs remain intact. The existing alex mapping identifies the active member; other member rows show no linked journal rather than inheriting the active user’s global data or wearable session. Personal WHOOP reads use the same endpoint; sample metrics remain explicitly illustrative. Date controls filter by day/month, with records contributing to available dates. Member save-area copy now says trainers can review the journal. Cross-account tracking still requires authenticated backend/member-scoped storage. See trainer-member-journal.tsx and tests/trainer-journal.spec.ts.
