# Form — gym journal

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Latest stable Next.js, Tailwind CSS, Lucide React and GSAP, requested by the user.

## Users and purpose

Gym members plan monthly goals, develop habits, and log training, nutrition and measurements. Trainers assign workouts and review member actuals against their plans.

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

Journal and account form data must not be persisted in browser storage. The current prototype holds progress only in React memory and resets on refresh, page close, or logout. It removes the old form-journal-v1, form-session, and form-sample storage keys on startup. Durable accounts and cross-visit journal persistence require a real authenticated backend. WHOOP opens separately to preserve the current in-memory setup; its existing secure OAuth cookies are connection credentials, not journal storage.
