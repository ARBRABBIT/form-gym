# Form — gym journal

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Latest stable Next.js, Tailwind CSS, Lucide React and GSAP, requested by the user.

## Users and purpose

Gym members plan monthly goals, develop habits, and log training, nutrition and measurements. Trainers assign workouts and review member actuals against their plans, plus the linked member’s full journal: goals, habits, challenge, weight, measurements, profile, planner, monthly reviews and available health readings.

## Confirmed scope

Browser-persisted clickable prototype, confirmed by the user. Six-step onboarding, including optional WHOOP account connection, with demo login/signup, optional monthly goals, challenge acceptance and Day 1, approximate weight, build/break habits and starting profile and every journal screen from Gym_Dashboards_Design_Prompt.md. Trainer plans and member logs are separate linked records. Trainer access includes workouts and member nutrition & wellness logs in the member detail view. Login remains a browser prototype. WHOOP OAuth routes are available but require server credentials and an HTTPS callback; health-data synchronization is not yet implemented.

## Brand commitments

Helvetica, black and white with restrained grays; mobile-first, Apple-inspired controls. The supplied journal photographs are field references. Form is a provisional prototype name; sample records are illustrative.

## Open decisions

Weight gain/loss calculation basis; whether Vs. Last Month is a previous value or a difference; nutrition target ownership; whether Before/After is for photos. Keep manual gain/loss, unavailable comparisons/targets, and labeled Before/After note spaces pending confirmation.

## Accessibility

44px touch controls, persistent labels, keyboard access, visible focus, reduced-motion support and responsive text.

## Revision direction

The user rejected the initial card-heavy UI as generic. The redesign uses a flat, ruled training journal with larger data typography, structured exercise rows, a black navigation rail, and visible Member view / Trainer view tabs. Sample users use Indian names: Arjun Sharma, Meera Iyer, Rohan Patel and trainer Kabir Mehta.

## Primary design target

Mobile screens are the primary design target, explicitly confirmed by the user. Prioritize phone widths of 320–430px, readable headings, compact supporting illustrations and comfortable touch controls. Desktop retains compatibility, but does not drive composition decisions. Each onboarding task has its own relevant 3D object, with consistent lime/ivory/chrome materials and a bottom fade.

Journal and account data must not be stored in browser storage. Real accounts and journal records now persist on the server; sample access stays in React memory and resets on refresh. Old browser-storage keys are removed on startup. WHOOP credentials for signed-in owners are encrypted and saved server-side, and linked trainers access the member’s connection through authenticated routes.


## Shared accounts and trainer parity — November 2026

The user explicitly expanded scope to real accounts and cross-device synchronization. The former session-only restriction now applies to sample access only. Real member/trainer accounts persist in server SQLite under FORM_DATA_DIR. Members explicitly share/revoke access with trainer codes; linked trainers and members edit the same journal with conflict checks and revision history. Do not populate real accounts with sample records. The trainer workspace reuses member health charts, composition, measurement comparisons, nutrition, water and journal forms. Assignments and submitted actuals remain separate linked records. Live WHOOP credentials belong to the signed-in owner, and trainers can query only linked members. A persistent Node server/volume and HTTPS are required for production; deployment, email verification and password recovery remain separate work.

The trainer/member parity work is explicitly mobile-only per the user: optimize the phone workflow and one-handed access. Member details use a fixed bottom section menu with short labels, a persistent member name/date, compact context, and 46–48px actions. Avoid new desktop-specific product work.
