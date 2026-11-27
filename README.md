# Form — gym journal

Requires Node 24+. A responsive member and trainer prototype built from `Gym_Dashboards_Design_Prompt.md` and the supplied journal photographs.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Sign up or log in through the labeled demo flow to set up a personal journal. Choose **Explore the sample journal** to review illustrative Indian member profiles and a sample assigned workout. Use the **Member view** and **Trainer view** tabs in the dashboard header.

The app includes onboarding, planner, habits, the 100-day challenge, weight tracking, measurements, monthly review, workout logging, nutrition and wellness, plus trainer assignments and submitted-log review. Plans and member logs are separate records; later plan changes preserve submitted actuals and the original plan snapshot.

Journal and owner-preview changes live in the current page session and reset on refresh. The member/trainer workspace shares its local state within the page; the owner workspace uses separate demo records. This prototype does not provide backend synchronization or authentication.

```sh
npm run build
npm run typecheck
npx playwright install chromium
npm test
```

For the field checklist, trainer/member walkthrough and unresolved product decisions, see [HANDOFF.md](HANDOFF.md). The visual system is documented in [DESIGN.md](DESIGN.md).

Health cards, morning photo check-ins, gut tracking and scheduled push reminders are described in [HEALTH.md](HEALTH.md). The dev/start commands also run the reminder worker. Local photo OCR works without an API key; WHOOP and optional cloud OCR need credentials. Phone notifications need HTTPS and user permission.


## Gym owner workspace

The local owner preview is at `/admin`. It uses the same self-hosted fonts and glass
surfaces as the member app, with separate sample data and no member-account access.

Run it on a second port while the member dev server stays on port 3000:

```sh
npm run build
npm run start:admin
```

Open http://localhost:3001/admin. The server binds to `0.0.0.0`, so the same route
is available at your machine’s LAN address on port 3001.

The owner preview includes membership plans, a searchable member directory,
check-ins, trainer assignments, class capacity and sample bookings, invoice payment
recording, reports, CSV exports, notifications and editable studio settings. Changes
live only in the current page session. Refresh restores the sample dataset. It has
no live payment processing, owner authentication or connected production database.
Trend charts are illustrative sample history; operational totals derive from the
sample records and update as you use the workspace.


The owner Nutrition section shows sample daily-summary sharing, meal-logging
consistency, calories and assigned protein targets, and coach-review prompts.
Only explicitly shared profiles contribute to aggregates or individual summaries;
newly added members default to not shared. Detailed foods and photos are not
exposed. Averages exclude missing/partial-day logs rather than treating them as
zero intake. Reviews are acknowledged per member and week in page-session state;
no notification is sent. Date ranges, member search, coach filters and review
filters are available. This preview is not connected to member food-log APIs.


## Completed studio UI workflows

The member app stays on port 3000; the owner workspace stays on port 3001.
These are local UI demos, with no live payments, external messages or shared backend.

| Area | Review path |
| --- | --- |
| Member membership | My membership → renew/change plan, freeze/resume, cancel, sample payment receipt and print |
| Member classes | Classes & bookings → choose date/coach, book, waitlist, cancel, view upcoming bookings |
| Attendance | Studio pass & visits → locally generated QR pass, preview check-in/out, date-filtered visit history |
| Nutrition plans | Trainer view → Nutrition planning → select member → assign targets and meal guidance; Member view → My nutrition plan |
| Sharing | My nutrition plan → summary/detailed-meal sharing; My profile → measurement-summary sharing |
| Feedback | Trainer view → Coaching inbox, or a member’s session → dated feedback; Member view → Coach feedback → reply |
| Owner members | Members → edit profile/reassign coach, renew/change membership, freeze, cancel, archive/restore; CSV template, validation and import preview |
| Owner plans/coaches | Memberships → edit price/benefits; Trainers → edit profile, shift and working days; conflicting existing classes prevent invalid availability changes |
| Owner classes | Schedule → create/edit/cancel/restore classes, check room/coach overlap, named rosters, class attendance and waitlist promotion |
| Owner finance | Payments → invoice details, payment method, fixed-amount discount, refund history total, printable receipt; Payments/Reports → expense ledger and operating balance |
| Owner attendance | Attendance → reception member ID/demo pass, check-in/out, searchable visit history and date range |
| Owner progress | Progress → member workouts, visits, consent-labelled sample nutrition/measurement summaries |
| Notifications | Both workspaces → read/unread filters, mark all read, follow relevant action; updates remain inside the preview |

New forms validate missing/duplicate entries, invalid date ranges, conflicts and
capacity. Destructive actions have confirmation dialogs. Long-form drafts have
navigation/dismissal protection and browser-unload warnings. Nested dialogs retain
focus and release page locks correctly. Routes have loading and retry error views.
Missing measurements, targets, classes, results and invoice ranges have explicit
empty states. QR codes encode a clearly marked demo pass; no scanner integration
is claimed. Owner dates and demo fixtures derive from the current local day.

Validation: production build, TypeScript, existing model/data checks, and the
focused browser suites covering the redesigned screens and new studio workflows.
The older persistence-dependent tests still describe a retired browser-storage flow.
