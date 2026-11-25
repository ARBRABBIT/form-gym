# Account entry and first journal setup

Mode: Operate. Targets: src/components/onboarding.tsx, src/app/onboarding.css.

A precisely specified extension of the current application. The live reference-theme.css is visual authority for this surface; DESIGN.md describes an older monochrome revision. No global visual system changes were made.

## Direction contract

THESIS: Turn the user's first visit into a real journal, with one manageable decision per step and no requirement to invent four goals before starting.

OWN-WORLD: Existing rounded system typography, soft gray canvas, white working surface, black primary controls and lime progress/selection states.

STORY: Enter demo account details, optionally set goals, accept a challenge, record approximate weight, name habits and capture a starting point. All entries become real browser-saved journal records.

FIRST VIEWPORT: Desktop account entry pairs a lime welcome panel with a focused form; setup pairs a quiet progress list with a single white form. Phone layouts stack account content and use one setup surface with a slim progress indicator. Actions follow fields in normal document flow.

FORM: User-specified sequential flow, shaped directly as an incumbent UI extension. seed: none (unavailable). Signature interaction: Day 1 changes to a lime first-win state; completion has a small smile bloom.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Finish review

Inspected desktop signup, goals and profile, and phone signup, challenge, weight, habits and profile captures. Layouts preserve the current theme, labeled controls and readable field sizing. Motion respects reduced-motion settings. No shipping raster assets added. Detector advisories refer to the stale DESIGN.md type/radius scale; the current live theme is deliberately retained. Authentication remains a clearly labeled prototype with no password verification or storage.

Follow-up polish: Header skip now advances through every setup step and completes the final step with optional profile values. Screen changes use a direction-aware slide and fade; reduced motion disables it. The progress fill carries a moving dumbbell marker. Weight entry reuses the app's accessible calendar with month/year navigation, Today, Escape dismissal and focus restoration. Reviewed the settled phone calendar and progress-marker captures; all 20 browser tests and production build pass.

Launch correction: Replaced the app-root circular clip with a separate fixed viewport layer that starts at the exact CTA bounds, expands to 100vw by 100dvh, then fades over the staggered home entrance. Bounds captured at home mount confirm coverage of 425×851 and 1440×1000 viewports. Reduced-motion entry remains immediate. Reviewed the mid-expansion desktop capture; production build passes.

WHOOP extension: Added an optional wearable selection at step five of six, before the starting profile. Uses current lime selection, rounded controls and the same transition/skip behavior. Reviewed phone and desktop WHOOP captures. The API is currently free, while WHOOP membership/device and developer credentials are required. Connect, consent-return, unavailable and disconnect UI are distinct; no simulated health metrics or connection successes ship. OAuth routes keep credentials server-side and tokens in encrypted HttpOnly cookies. All 24 browser tests, typecheck and build pass; live WHOOP consent remains untested until credentials and an HTTPS callback are configured. See WHOOP.md and .env.example.

## Realistic scale illustration

A user-requested 3D scale now sits beside the account welcome, each of the six step headings and the completion heading. Built-in image generation used the supplied orange scale as a material/subject reference, adapted to the live lime/chrome palette. A CSS bottom gradient blends the transparent object into each surface. The mechanical dial is functional SVG geometry composited over the asset; a fixed pointer and rotating labeled wheel locate the typed weight, while the numeric readout eases to it. It does not write or infer weight. Unentered/invalid input displays a dash. Reduced motion sets the dial immediately.

Heading and image share a stable responsive grid; heading type reduces on narrow phones, keeping the screen anchor steady. Reviewed 320px, 375px, 425px and desktop captures. All seven onboarding browser tests and typecheck pass. Prompt/provenance is in .impeccable/assets/onboarding-scale.md; the runtime alpha WebP is public/images/onboarding-scale.webp. This is a local illustration extension, not a new global font/color system.


## Mobile-first illustration revision

The user clarified that each task needs its own relevant object and that the art was too large. Phone layouts at 320–430px now drive this surface. Illustrations are 68–84px on phones (previously 94–124px), with 96px desktop compatibility sizing. Reduced header height gives the form more space. All share the lime/ivory/chrome materials, upper-left studio lighting and a soft bottom fade. Goals uses a target; challenge a calendar; weight the interactive mechanical scale; habits a checklist; connection a fitness band; starting profile a measuring tape. Completion has a trophy; signup a journal and login a lock. Only the weight step shows a live scale dial.

Weight entry refinement: use a 270-degree draggable tick dial with a central decimal input, plus/minus controls, keyboard support, and 0.1kg adjustments. Keep the current lime palette and the approximate-weight reassurance. Weight is optional; no value is created until the user interacts. Put the date in the top-right progress row and retain the custom calendar. Remove gain, loss, and notes from this onboarding step. The small scale illustration is upright with a stronger white bottom fade (42% through 92%). Verify 320/375/425px phone layouts and touch dragging. Journal state remains memory-only.

Home handoff: use four compact linked health cards, not the earlier full metric tables on the home screen. Full readings belong to #health-body/#health-blood/#health-gut/#health-lung. Card figures must retain their actual meaning: recovery%, oxygen%, manual check-in completion%, respiratory rate/min. Do not invent composite gut/lung health percentages.

## WHOOP connection presentation - 24 November 2026

Mode: Operate. Scoped extension of the existing white/rounded/black/lime theme. Connect WHOOP opens a full-screen white native dialog, using an official WHOOP 5.0 CloudKnit product image. Centered heading, realistic device and pale animated signal rings lead to metric labels, a short consent explanation and Continue to WHOOP. Separate-tab OAuth remains intact; verified status alone controls the connected screen. Back/Escape restore focus and preserve setup. Reduced motion uses static rings. Source provenance is stored beside the locally bundled WebP. Existing DESIGN.md and its tokens are unchanged.


Monthly goal selection: Six optional suggested goals use full-row native checkboxes with the existing lime selected state. Suggestions and inline custom goals share the four-goal limit and selection count. One empty custom field is available while capacity remains; filled custom goals can be removed. Back navigation preserves both kinds of goals. Reviewed phone and desktop captures; 11 onboarding tests and typecheck pass. Existing live theme remains the visual authority over older DESIGN.md detector advisories.

Challenge continuity: Step two displays the current monthly goals, including custom entries, as optional radio choices. Choosing one fills the editable 100-day intention. Going back updates the displayed choices without overwriting an independently edited intention. Selected options use lime with no dark border; keyboard focus remains visible. Reviewed the phone capture; all 12 onboarding tests and typecheck pass.

Habit suggestions: Step four offers three habits to build and three habits to break as optional checkbox rows. Selection adds a real habit with its build/break direction; deselection removes it. Custom habits retain the existing name and direction controls. Reuses lime selection without dark borders. Reviewed the phone layout and verified suggested/custom habits survive back navigation and appear in the journal after completion. All 13 onboarding scenarios pass, and typecheck passes.
