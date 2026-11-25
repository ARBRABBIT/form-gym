# Form App Requirements

Version 1.0 · 25 November 2026

## Product purpose

Form is a mobile-first training and wellness journal. Members review assigned workouts, record actual sessions, track nutrition and water, monitor wearable readings, and reflect on monthly progress. Trainers prepare workout assignments and inspect member workout and nutrition records.

The current app is an interactive prototype with several server integrations. Account access and role switching are demonstrations; journal records remain in React memory. A refresh ends that journal session. Durable accounts, authorization, and a production journal database are outstanding requirements.

This specification records the current implementation and the requirements for taking it to production. **Current** means implemented in the prototype, **Partial** means a workflow exists with material limitations, and **Required** means additional production work. Production requirements below are proposed release requirements, rather than completed functionality or approved infrastructure choices.

## Users and access

| User | Main needs | Current access |
| --- | --- | --- |
| Member | Plan and record training, nutrition, hydration, habits, measurements, and reflections | Account entry or sample journal; member screens |
| Trainer | Find linked members, assign workouts, compare plans and actuals, inspect nutrition | Visible role switch; three seeded members |
| Sample visitor | Explore populated workflows without creating an account | Explore the sample journal |

An administrator role, gym organization management, billing, and member invitations are not implemented.

## Current application structure

The app uses Next.js 16.4.6, React 19.3.1, TypeScript, Tailwind CSS, GSAP, and client-side hash navigation. Node.js 24 or newer is required by the package configuration. Next.js API routes support WHOOP, optional cloud scale OCR, and push reminders.

| Area | Route or entry | Purpose |
| --- | --- | --- |
| Account and setup | Account entry, `#onboarding` | Demo signup/login and six-step onboarding |
| Home | `#overview` | Selected-day journal summary and shortcuts |
| Workouts | `#workout` | Assigned plan, set completion, actual workout log |
| Workout library | `#library`, `#trainer-library` | Reusable workout templates |
| Nutrition | `#nutrition` | Daily wellness, meals, macros, water |
| Water | `#water` | Serving-based hydration logging |
| Planner | `#planner` | Monthly goals and daily notes |
| Habits | `#habits` | Daily checklist and monthly completion |
| Challenge | `#challenge` | 100-day target and progress |
| Weight | `#weight` | Dated weight entries |
| Results | `#results` | Profile, baseline, measurement comparisons |
| Review | `#review` | Monthly measurements and reflection |
| Health details | `#health-body`, `#health-blood`, `#health-lung` | Wearable readings and connection management |
| Morning check-in | `#morning` | Notification entry into weight check-in |
| Trainer | `#trainer` | Member search, assignment, actuals, nutrition |

## Functional requirements

### Account entry and onboarding

| ID | Requirement | Status |
| --- | --- | --- |
| ACC-01 | Provide signup and login forms with email, password visibility controls, and a name for signup. | Current demo UI; credentials are not authenticated |
| ACC-02 | Offer sample access separately from account entry. Label illustrative journal and health values. | Current |
| ACC-03 | Guide setup through monthly goals, challenge, approximate weight, build/break habits, optional WHOOP connection, and starting profile. Support Back and optional skips. | Current |
| ACC-04 | Carry setup values into the journal within the active session. | Current |
| ACC-05 | Authenticate real users, recover account access, and bind every journal and integration record to a user identity. | Required |

Setup supports four monthly goals, challenge acceptance and Day 1, weight/date/gain/loss/notes, repeatable habits, and profile name, weight, height, and lose/gain/maintain intention.

**Current preview behavior:** after signed-in onboarding, `withSamplePreview` fills gaps with illustrative records and sets `sampleData` to true. Existing entered records generally take precedence, but empty meal groups and other blank areas can receive sample content. A completed signup therefore does not currently produce a clean, exclusively personal journal. Production must isolate sample data from personal data.

### Home, dates, and navigation

| ID | Requirement | Status |
| --- | --- | --- |
| NAV-01 | Show a selected-day overview of health, training, habits, nutrition, water, and daily wellness, with monthly planner, goal, and challenge shortcuts. | Current |
| NAV-02 | Support a centered horizontal date strip, arrows, touch scrolling, desktop drag/wheel, keyboard selection, and a date picker. Block future selection in the dashboard date controls. | Current |
| NAV-03 | Preserve the shared selected date while moving between relevant daily screens. Keep monthly journal selection available separately. | Current |
| NAV-04 | Provide mobile Home, Workout, Food, and Journal navigation in a black capsule, with a white selected tab and a separate plus action opening Water. Expose the full screen list through the navigation menu/rail. | Current |
| NAV-05 | Support browser history, visible active states, and focus movement into health and water screens. | Current |

The current journal day is derived using `Asia/Kolkata`; reminder time zones are configurable separately. A production policy for user-local journal dates remains to be decided.

### Workout planning and logging

| ID | Requirement | Status |
| --- | --- | --- |
| WRK-01 | Let trainers select a member and date, then create or edit a workout assignment. | Current prototype |
| WRK-02 | Capture muscle group, warm-up, cool-down, notes, repeatable exercises with six reps/weight sets, and repeatable cardio with type, time, distance, and calories. | Current |
| WRK-03 | Let members inspect the assigned plan and record actual sets, cardio, start/finish/total time, notes, and satisfaction from 0 to 100. | Current |
| WRK-04 | Keep prescribed plans and submitted actual logs as separate records. Retain the plan version and snapshot associated with an actual log. Later plan edits must preserve submitted actuals. | Current |
| WRK-05 | Keep set-completion toggles separate from plan values and submitted actuals. Trainer views display completion read-only. | Current within shared session state |
| WRK-06 | Create, edit, search, and select named workout templates. Copy templates into assignment drafts with independent exercise/cardio identities. Later template edits must preserve existing assignments. | Current within session |
| WRK-07 | Synchronize authorized trainer/member updates across authenticated sessions and handle conflicting saves. | Required |

The member workout view currently uses a fixed seeded member identifier, `alex`. Production must resolve the signed-in member rather than use this fixture mapping.

### Nutrition and water

| ID | Requirement | Status |
| --- | --- | --- |
| NUT-01 | Record daily weight, waist, sleep hours, steps, body fat, and water. | Current |
| NUT-02 | Add, edit, and remove food items in Breakfast, Lunch, Dinner, and Supplements/Snacks. Capture product, serving, calories, protein, carbs, and fat. Calculate meal subtotals and daily totals from item values. | Current |
| NUT-03 | Show a comparison against nutrition targets without inventing missing targets. | Partial; displays Target unavailable |
| NUT-04 | Allow trainers to inspect linked members' daily wellness, water, meal items, and macro totals. | Current prototype |
| WAT-01 | Open Water from the main plus action, sidebar, home water card, and Nutrition link. | Current |
| WAT-02 | Show the selected day's water in ounces with a supporting liters total. Offer Glass 8 oz, Mug 12 oz, and Bottle 16 oz. | Current |
| WAT-03 | Selecting a vessel changes the increment; its side plus logs a serving. Main plus/minus adjusts by the selected serving. Clamp totals at zero. | Current |
| WAT-04 | Use one date-specific water total across Home, Nutrition, and Water. Preserve meal and wellness fields when changing water. | Current |
| WAT-05 | Present Water as a full-screen gradient experience with a top Back control and date picker. Show no bottom navbar on this screen. | Current |

Water is stored in liters. The current conversion uses 29.5735295625 mL per US fluid ounce and rounds stored totals to six decimal places. Home additionally offers quarter-liter adjustments; Nutrition provides six whole-liter marks. These controls edit the same total rather than separate hydration records.

### Planner, habits, challenge, and progress

| ID | Requirement | Status |
| --- | --- | --- |
| JRN-01 | Provide a month/year picker, a Sunday-to-Saturday calendar including leap years, daily note editing, and four month-specific goals. | Current |
| JRN-02 | Create, rename, and remove habits; toggle dated completion; show daily and monthly views with month-specific totals. Explain build versus break semantics where that classification exists. | Current |
| JRN-03 | Record a challenge target and note, independently toggle days 1–100, and calculate completed count and percentage. | Current; challenge days are numbered rather than calendar-bound |
| JRN-04 | Add and edit dated weight entries with kilograms, gain, loss, and notes; filter entries by month. | Current |
| JRN-05 | Capture profile and ten measurements: neck, shoulders, chest, bicep, waist, hip, thigh, calf, weight, and body fat percentage. | Current |
| JRN-06 | Preserve baseline values, show the previous calendar month's saved values, and calculate signed differences. Use percentage points for body-fat change; leave unavailable comparisons blank. | Current |
| JRN-07 | Keep independently editable Now and previous comparison dates, a body measurement guide, and Before/After note spaces. | Current; Before/After are text, not photo upload |
| JRN-08 | Record monthly responses to biggest wins, areas lacking and why, and improvements for next month. | Current |

The manual weight-entry form accepts separate gain/loss values. Morning check-in instead derives gain/loss from the latest preceding dated reading. Production must define whether these remain intentionally different workflows.

### Health cards and WHOOP

| ID | Requirement | Status |
| --- | --- | --- |
| HLT-01 | Show two square cards for Recovery and Blood health above one full-width rectangular Lung card. Each opens its own detail screen. | Current |
| HLT-02 | Recovery displays score, status badge, up to 24 rounded trend bars, date/value inspection, axes, HRV, and baseline comparison when available. | Current; richer history is provided by sample fixtures |
| HLT-03 | Blood health displays SpO₂, a weekly curve with selection marker, seven selectable days, bounded week browsing, and a detail action. | Current; historical browsing depends on available readings |
| HLT-04 | Lung displays respiratory rate, its baseline in breaths per minute, and respiratory baseline change when available. Sleep duration and sleep score are excluded from this summary card. | Current |
| HLT-05 | Detail screens expose relevant recovery, sleep, strain, steps, temperature, activity, HRV, resting heart rate, oxygen, and respiratory readings without inventing absent values. | Current |
| HLT-06 | Connect WHOOP through a dedicated connection dialog and separate-tab OAuth flow; verify connected status through the server, refresh credentials, and support disconnect. | Partial; implementation requires credentials and an HTTPS callback for live use |
| HLT-07 | Fetch selected-day WHOOP metrics, handle loading/reconnect/error states, and show unavailable fields honestly. Keep sample mode clearly identified. | Current implementation; live account verification outstanding |
| HLT-08 | Supply real historical readings and baseline inputs for production trends, with their dates, units, source, and freshness. | Required for full live chart behavior |

Blood health currently represents wearable oxygen and related signals, not laboratory results. Lung represents sleep breathing signals, not a lung-function test. Blood pressure, glucose, cholesterol, diagnostic scoring, continuous heart-rate streaming, and Bluetooth device pairing are outside the implementation. Gut/stool tracking has been removed from the active app.

### Morning weight check-in and reminders

| ID | Requirement | Status |
| --- | --- | --- |
| CHK-01 | Accept manual weight or a JPG/PNG/WebP scale photo under 5 MB. Run on-device OCR by default; offer cloud OCR only through explicit user choice. | Current |
| CHK-02 | Require review and confirmation before saving; accept kg/lb, convert to kg, validate weight/date, and support notes and an optional bathroom-condition flag. | Current |
| CHK-03 | Keep photos in memory and save the confirmed numeric entry rather than the image. Provide manual correction after ambiguous or failed OCR. | Current |
| REM-01 | Offer opt-in daily reminders with selected time, IANA time zone, and friendly/playful tone. Handle unsupported or declined notification permission. | Current implementation |
| REM-02 | Support 30-minute snooze, skip today, disable, and a notification link into morning check-in. A current-day check-in suppresses that day's reminder; a backdated entry must not. | Current implementation |
| REM-03 | Run scheduled delivery with duplicate suppression and invalid-subscription removal. Persist reminder settings independently of the temporary journal. | Current SQLite/worker implementation; device delivery needs deployment verification |

## Data and integration requirements

| Data group | Current representation | Production requirement |
| --- | --- | --- |
| Account/profile/setup | React Store and form state | Authenticated account and owner-bound profile; never retain raw passwords |
| Journal | Date/month keyed goals, notes, habits, challenge, weights, measurements, reviews, nutrition | Durable authenticated storage with validation and recoverable saves |
| Training | Member/date keyed plans, logs, completion; template library | Stable member IDs, relationships, revisions, immutable submitted-plan snapshots |
| Health | In-memory fetched metrics or labeled sample fixture | Account-bound provider records, historical retrieval, baseline provenance, refresh coordination |
| WHOOP credentials | Encrypted secure HttpOnly cookies scoped to WHOOP API routes | User-bound credential lifecycle and server-side coordination for multiple sessions |
| Reminders | SQLite subscriptions, preferences, delivery state; cookie identifier | Durable deployment storage and authenticated ownership |
| Scale photos | Temporary browser state; optional explicit cloud request | Preserve consent and retention behavior; authenticated and rate-limited cloud endpoint |

Journal/account form data must not be moved into localStorage or sessionStorage as a persistence shortcut. Startup currently clears legacy `form-journal-v1`, `form-session`, and `form-sample` keys. Browser reload, page close, and logout do not provide durable journal recovery. Reminder storage and integration cookies have separate lifetimes.

Existing server interfaces:

- WHOOP: `/api/whoop/connect`, `/callback`, `/status`, and `/metrics` under `/api/whoop`.
- Optional cloud OCR: `POST /api/health/scale`, configured with `GOOGLE_VISION_API_KEY`.
- Reminder preferences/subscriptions: `/api/reminders`; snooze/skip/check-in: `/api/reminders/action`; scheduled dispatch: `/api/reminders/run`.
- A service worker handles push events and notification actions. The manifest supplies install metadata; the current worker does not implement offline journal caching.

WHOOP needs developer credentials, cookie encryption configuration, and an exact HTTPS callback origin. Push delivery needs notification permission, a suitable secure deployment, durable reminder storage, and an active worker or scheduler. The local launcher starts Next.js and the reminder worker together. An ephemeral hosting filesystem cannot serve as the durable production reminder database.

## Visual and usability requirements

- Prioritize phone widths of 320–430 px while retaining tablet and desktop layouts without horizontal overflow or clipped forms.
- Use self-hosted Urbanist for interface text and Matricha for dotted display numerals and branding. Maintain shared title, reading, and unit scales across the three health cards.
- Use the shared Hugeicons Stroke Rounded wrapper, consistent outline treatment, and minimal home, dumbbell, utensils, and profile symbols.
- Keep the neutral journal shell and black mobile navigation. Use the current intentional gradients for health cards, the indigo-to-icy-blue date strip, and the pink/orange-to-pale-green Water screen.
- Preserve the Recovery pink/lilac and smoky lower gradient, dark teal/blue Blood card, and warm orange/gold Lung rectangle. Lung has no dotted perimeter and uses balanced vertical padding.
- Reduce visual crowding through typography, spacing, and secondary emphasis while retaining the current health-card content and layout.
- Provide controls at least 44 px in touch target size, persistent input labels, accessible names for icon buttons, visible focus, keyboard support, and meaningful reading units.
- Keep sheets usable in short viewports with internal scrolling and visible headers; restore focus/background position after closing. Respect reduced-motion preferences.
- Verify text contrast over translucent surfaces, screen-reader chart descriptions, zoom, and error announcements before release. Existing accessibility patterns are not a completed accessibility audit.

## Production release requirements

| Priority | Requirement | Release acceptance |
| --- | --- | --- |
| P0 | Real identity and authorization | A member can access only their data; a trainer can access only permitted linked members. Changing the client role or URL grants no additional access. |
| P0 | Durable journal storage | Saved entries survive refresh, logout/login, and another authorized device. Failed saves stay visible and recoverable. |
| P0 | Separate sample and personal modes | A new personal account remains empty except for its own entries; sample fixtures cannot contaminate personal history or exports. |
| P0 | Honest save and privacy language | Replace current browser-save/visibility claims with wording matching actual durability and trainer permissions. |
| P0 | Secure production integrations | Bind WHOOP and reminders to accounts, protect sensitive endpoints, rate-limit expensive requests, and verify credential expiry/revocation and consent flows. |
| P0 | Data handling policy | Define retention, account deletion, integration disconnection, access permissions, backup, and restoration behavior for sensitive wellness records. |
| P0 | Current regression coverage | Reconcile tests and older documentation with session-only state, removed gut tracking, current Water behavior, and the icon system. Pass typecheck, production build, and the applicable corrected tests. |
| P1 | Live history and trustworthy baselines | Populate charts from dated provider data, identify unavailable history, and calculate comparisons only from an agreed baseline definition. |
| P1 | Cross-session collaboration | Keep trainer plans, actuals, and completion synchronized; prevent silent overwrites during concurrent edits. |
| P1 | Operational readiness | Verify live OAuth, actual-device push, scheduler reliability, backup recovery, actionable errors, and monitoring without logging credentials or photos. |
| P1 | Accessibility and performance validation | Audit critical flows on target phones, keyboard and assistive technology; agree and test performance budgets for initial load, OCR, and chart interactions. |

P0 items are proposed blockers for a real multi-user release. Their exact implementation, hosting provider, delivery schedule, and ownership require planning.

## Key acceptance scenarios

1. **Setup:** complete or skip optional steps; entered goals, habits, weight, and profile reach the journal. Back preserves the active draft. Current session reset behavior is clearly disclosed.
2. **Workout integrity:** assign a plan, submit different actual values, then edit the assignment. Actuals, completion, and the original submitted-plan snapshot remain intact.
3. **Template independence:** assign a template, then edit the library version. The existing assignment retains its copied values.
4. **Nutrition:** add items across all meal groups, edit and remove them, and verify meal and daily macro totals against the remaining items.
5. **Water:** log Glass 8 oz, add Mug 12 oz, then subtract 12 oz. The net change is 8 oz on Home, Nutrition, and Water for that date. A second date remains independent and subtraction never yields a negative total.
6. **Health truthfulness:** sample readings are labeled; missing provider fields remain unavailable. Browsing dates or weeks shows the corresponding available records rather than repeating fabricated personal history.
7. **Calendar and progress:** verify leap-year February, month-specific goals and habit counts, all 100 independently toggleable challenge days, and previous-calendar-month measurement differences.
8. **Check-in:** a photo produces an editable draft, not an automatic saved reading. Confirming pounds stores kilograms; ambiguous OCR allows manual entry; backdating does not suppress today's reminder.
9. **Navigation and layout:** main plus opens Water; Water has no bottom navbar and Back returns home. All primary screens and popups remain usable at narrow phone and desktop widths with keyboard and reduced motion.
10. **Production isolation:** two real accounts cannot read or change each other's records; permitted trainer changes reach the correct member and survive a new session.

## Decisions still needed

| Decision | Current behavior | Needed outcome |
| --- | --- | --- |
| Account and gym model | One in-memory journal and seeded member list | Individual versus gym-owned accounts, trainer linking/invitations, permissions |
| Nutrition goals | Target unavailable | Target owner, units, update rules, and comparison calculations |
| Weight gain/loss | Manual form values versus derived morning-check-in values | Consistent comparison and same-day duplicate policy |
| Health baselines | Sample baselines; real values only when available | Baseline period, minimum data, provenance, and history import scope |
| Journal time zone | Asia/Kolkata; reminders separately configurable | Travel behavior and ownership of local-day boundaries |
| Before/After | Text notes | Whether progress photos belong in a future scope, with explicit privacy rules |
| Hydration | Shared total edited through ounces, quarter-liters, and whole-liter marks | Whether custom servings, preferred units, or intake-event history are needed |
| Commercial assets | Self-hosted fonts and bundled imagery | Confirm Matricha commercial rights and redistribution rights for bundled product imagery before public release |

## Analysis basis and verification limits

The current-state assessment follows the application source: `src/components/journal-app.tsx`, `onboarding.tsx`, `overview.tsx`, `workouts.tsx`, `workout-library.tsx`, `journal-screens.tsx`, `health-overview.tsx`, `health-checkins.tsx`, the health card components, `water-screen.tsx`, `src/lib/model.ts`, health/WHOOP/reminder libraries, API routes, styles, and `public/sw.js`.

Existing Playwright suites cover journal, onboarding, health, WHOOP UI, health summaries, navigation, icons, and Water. Several older test names/assertions still assume reload persistence or legacy browser-data migration. Their presence is not evidence that those behaviors remain supported. Older sections of README, PRODUCT, HANDOFF, HEALTH, WHOOP, and DESIGN also contain superseded persistence, visual, or sample-mode descriptions; current code and the latest explicit product changes govern this assessment.

This analysis did not rerun the full test suite or validate live WHOOP authorization, cloud OCR credentials, or physical-device push delivery. Those remain separate release checks.
