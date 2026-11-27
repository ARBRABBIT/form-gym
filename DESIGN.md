---
name: Form — gym journal
description: A training journal using Urbanist for interface text, Matricha for the Form wordmark, with Roboto Condensed for numeric displays.
colors:
  ink: "#181818"
  muted: "#707070"
  line: "#e3e3e3"
  paper: "#ffffff"
  soft: "#f4f4f4"
  rail: "#1c1c1c"
  primary-hover: "#3d3d3d"
  secondary-text: "#252525"
  secondary-border: "#cecece"
  control-hover: "#f3f3f3"
  ghost-text: "#545454"
  label: "#555555"
  field-border: "#cdcdcd"
  field-focus: "#565656"
  focus: "#777777"
  caption: "#737373"
  section-rule: "#262626"
  tag-border: "#dbdbdb"
  row-hover: "#f7f7f7"
typography:
  display:
    fontFamily: "Urbanist, Arial, sans-serif"
    fontSize: "44px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-1.5px"
  headline:
    fontFamily: "Urbanist, Arial, sans-serif"
    fontSize: "40px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-1.4px"
  title:
    fontFamily: "Urbanist, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 500
  body:
    fontFamily: "Urbanist, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Urbanist, Arial, sans-serif"
    fontSize: "12px"
rounded:
  tag: "2px"
  control: "3px"
  base: "4px"
  sheet: "6px"
  mobile-sheet: "14px"
spacing:
  step-8: "8px"
  step-12: "12px"
  step-16: "16px"
  step-20: "20px"
  step-22: "22px"
  step-24: "24px"
  step-26: "26px"
  step-28: "28px"
  step-32: "32px"
  step-40: "40px"
  step-48: "48px"
components:
  button-primary:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.secondary-text}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.control-hover}"
  button-ghost:
    textColor: "{colors.ghost-text}"
    rounded: "{rounded.control}"
    padding: "0 7px"
    height: "44px"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 13px"
    height: "46px"
  view-tabs:
    textColor: "{colors.caption}"
    padding: "0 1px"
    height: "47px"
  nav-item:
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "43px"
  tag:
    textColor: "{colors.caption}"
    rounded: "{rounded.tag}"
    padding: "6px 10px"
  ruled-section:
    padding: "26px 0"
  exercise-row:
    padding: "19px 0"
    height: "65px"
---
# Design System: Form

## Overview

**Creative North Star: "The training journal"**

Form treats the screen as a working training journal: readable records, aligned numbers and ruled sections. Urbanist, white paper and dark ink establish a restrained, practical identity. The user rejected a generic card-heavy interface; the implemented replacement gives dates, exercise rows and daily records the hierarchy.

The interface is mobile-first. Familiar controls, persistent role tabs and compact labels support repeated entry. Sample records use Indian names, including Arjun Sharma, Meera Iyer, Rohan Patel and coach Kabir Mehta.

**Key Characteristics:**

- Flat ruled sections and aligned ledgers.
- Urbanist for interface text, Matricha for the Form wordmark; Roboto Condensed for numeric displays only.
- Grayscale state changes and sharp controls.
- Persistent Member view / Trainer view navigation.

## Colors

A monochrome paper-and-ink palette, with restrained gray distinctions for supporting text, rules and control states. Frontmatter records the normative values; it extracts reusable colors rather than every isolated gray in the stylesheet.

### Primary

- **Ink** provides the main text and active role underline.
- **Rail** supplies the desktop navigation background and primary actions. Primary hover lightens this dark surface.

### Neutral

- **Paper** is the page and input background, and reversed text on dark controls.
- **Muted** and **Caption** support secondary information. **Label** distinguishes field labels.
- **Line** divides entries; **Section rule** provides stronger section boundaries.
- **Soft**, **Control hover** and **Row hover** provide quiet tonal feedback.
- The field, tag and secondary-button border tokens remain separate because the implementation uses different grays for these roles.

**The Grayscale Rule.** Use the implemented monochrome palette for hierarchy and state; introduce no accent hue.

## Typography

Headings and body use Urbanist; the Form wordmark and footer branding use Matricha Regular with Arial and sans-serif fallbacks. Roboto Condensed is reserved for calendar numerals, metric readings and numeric counters. All three fonts are self-hosted through next/font/local; Urbanist supports weights 100–900; Roboto Condensed uses Regular (400) for numeric displays only.

Numeric displays use tabular figures, -.02em tracking, and a 1.12 vertical scale
for the taller watch-like proportions. Individual CSS scale composes with the
existing calendar selection, reflected numerals and value-change animations.

- **Display:** the desktop journal weekday. Its date companion is lighter (400) and smaller (40px). At the mobile breakpoint the weekday becomes (36px) and its date companion (30px); the narrow-phone override uses (33px) and (28px).
- **Headline:** standard page headings. Mobile page headings use (34px), with tighter tracking (-1px).
- **Title:** common section headings. Journal section labels use (17px), weight (500), tracking (-0.3px).
- **Body:** the document default. Supporting descriptions may use line height (1.9) and maximum measure (70ch).
- **Label:** fields and common controls. Dense annotations use smaller type, commonly (10–11px).
- Numeric inputs and exercise rows use tabular numerals. Training titles use (35px), weight (500), line height (1.18), increasing to (40px) on wide screens.

## Interface icons

The interface uses **Hugeicons Stroke Rounded**, selected against the supplied icon reference on 25 November 2026. Rounded endpoints, soft corners, open silhouettes, and a single outline weight establish the app's icon language. Selection is a visual judgment based on the reference; the image does not establish the original icon vendor.

| Library researched | Relevant capabilities | Decision for Form |
| --- | --- | --- |
| [Hugeicons](https://hugeicons.com/docs/integrations/react/quick-start) | Free Stroke Rounded set; React renderer; adjustable size and stroke. [Free-set MIT license](https://hugeicons.com/docs/faqs/license-questions). | Chosen for the closest rounded geometry and coverage of health, training, nutrition, camera, and navigation symbols. |
| [Phosphor](https://github.com/phosphor-icons/react) | Six weights including light, regular, bold, fill, and duotone; React support and tree shaking. | Strong choice when a product needs several weights; this app uses one outline family. |
| [Lucide](https://lucide.dev/guide/react/) | Optimized inline SVG components, configurable strokes, TypeScript, and tree shaking. | Existing library; replaced alongside custom navigation glyphs to give the entire app the selected rounded family. |
| [Tabler](https://docs.tabler.io/icons/libraries/react) | React components with configurable size, color, and stroke; per-icon tree shaking. | Broad utility coverage; Hugeicons is the closer visual match for this reference. |
| [Iconoir](https://iconoir.com/docs/packages/iconoir-react) | 24px grid, 1.5 default stroke, React provider, and MIT license. | A useful lighter alternative; Hugeicons better matches the reference's soft, substantial outlines. |

Use named imports from `src/components/icons.tsx` for every interface symbol. This module statically imports individual Hugeicons assets, sets a default 1.8 stroke on the 24px grid, forwards SVG props and refs, and hides decorative icons from assistive technology. Labeled symbols receive an image role. Keep accessible names on icon-only buttons.

Use 16–20px icons for compact controls and 24–30px icons in primary navigation. Inherit foreground color from the control; use its existing selected surface and label for active state. Keep the Home, utensils, dumbbell, and profile navigation meanings. Do not introduce another icon family or hand-drawn interface glyphs. Charts, interactive measurement dials, and fillable water graphics remain data visualizations with their own SVG geometry.

Installed packages: `@hugeicons/react` 1.1.10 and `@hugeicons/core-free-icons` 4.4.0. Use the MIT-licensed free pack; its license ships in the dependency. No Pro assets are required.

## Layout

The desktop shell has a fixed navigation rail (224px), an (88px) topbar and a centered main area with maximum width (1510px). Main padding is (40px 48px 0). Wide screens at (1500px) increase horizontal padding to (60px).

The journal uses a flexible main column and (300px) aside separated by a rule, with a (42px) gap. At (1180px) the rail narrows to (205px); at (1000px) it narrows to (190px) and the journal becomes one column with a two-column supporting area below.

At (760px) and below the rail becomes a dismissible drawer, the main offset disappears, and bottom navigation appears. Main padding becomes (29px 22px 0); at (375px) horizontal padding becomes (18px). Supporting sections stack vertically. Role tabs remain visible in the topbar. Bottom navigation reserves safe-area padding and the footer leaves space beneath the content.

Exercise rows retain named exercise, sets, reps and kg columns. Their numeric columns narrow from (48px) to (30px, 30px, 32px) on mobile; long exercise names wrap. Form grids become one column, with two-column sheet fields until the narrow-phone breakpoint.

## Elevation & Depth

Journal content is flat: rules, whitespace and typography define structure. Floating feedback and dialogs are the exceptions. The desktop sheet uses the existing dialog shadow; toast feedback uses its lighter floating shadow. Scrims separate modal layers from the journal. Preserve the exact values in the sidecar rather than adding surface shadows.

Motion communicates a change of state: buttons transition color and borders, exercise disclosure rotates, completed marks briefly scale in, and sheets enter with a short vertical movement. Reduced-motion preferences suppress these effects.

## Shapes

Controls have sharp, lightly softened corners, primarily the control radius in frontmatter. Tags use the smaller tag radius. Sections remain flat with horizontal rules rather than enclosed rounded containers. Circular avatars, small status dots and the circular arrow action are existing functional exceptions.

Desktop dialogs use the sheet radius. Mobile sheets attach to the bottom with rounded top corners, square bottom corners and a short drag-handle shape. This sheet treatment is reserved for modal content.

## Components

### Buttons

Primary, secondary and ghost variants share inline alignment, medium weight, a minimum touch height and compact type. Primary actions reverse white onto the rail tone; secondary actions use white with a gray border; ghost actions use text and a quiet hover fill. Disabled buttons reduce opacity to (0.4) and use the disabled cursor. Generic keyboard focus uses a gray outline (2px) with offset (4px).

### Chips

Status tags are small, outlined, nearly square labels, with no decorative fill. A tag is informational; interactive date selections use their own selected treatment.

### Cards / Containers

The shared section container is a ruled region: strong top rule, vertical padding and no background enclosure or shadow. Preserve this construction when adding journal sections.

### Inputs / Fields

Persistent labels sit above white bordered fields with a small gap. Focus darkens the border and adds an inset-positioned outline (1px). Textareas allow vertical resizing. At the mobile breakpoint fields use (16px) text and minimum height (48px). Native date controls remain available through labeled date actions.

### Navigation

Desktop navigation uses the dark rail, muted labels and white active rows. Hover uses a lighter dark fill. Member view and Trainer view are persistent underlined tabs; the selected tab uses ink and a bottom rule (2px). Mobile navigation uses fixed icon-and-label destinations on paper; the full journal drawer supplies additional destinations.

### Workout ledger

Exercise entries are clickable ruled rows with an ordinal, exercise name and right-aligned sets, reps and kg. Numeric data remains aligned across rows; hover adds a subtle paper tint. Keep the headings and column relationships when adapting to narrow screens.

### Sheets

Sheets support labeled forms, a close action, focus trapping, Escape dismissal and focus restoration. Desktop sheets center within a scrim, use maximum width (530px) and cap height at (90dvh). Mobile sheets anchor to the bottom and include safe-area padding.

## Do's and Don'ts

### Do:

- **Do** use Urbanist for interface text and Matricha for wordmark branding; reserve Roboto Condensed for numbers.
- **Do** align numeric workout data and retain tabular numerals.
- **Do** preserve persistent field labels, keyboard focus and reduced-motion behavior.
- **Do** use ruled sections and restrained grayscale to organize records.
- **Do** retain visible Member view and Trainer view tabs across viewport sizes.

### Don't:

- **Don't** introduce accent colors, gradients or additional typefaces.
- **Don't** return to a generic grid of rounded dashboard cards.
- **Don't** apply sheet rounding or floating shadows to ordinary journal sections.
- **Don't** use placeholder-only labels or rely on color alone to identify the active role.

## Interaction feedback — November 2026

Motion reinforces an action or a real state change. The glass surfaces stay visually
stable; feedback is local to controls and values. The implementation uses existing
CSS and the browser Web Animations API, with no additional animation package.

Research informing this pass:

- [Apple: Motion](https://developer.apple.com/design/human-interface-guidelines/motion):
  brief, purposeful, interruptible feedback; adapt to input and accessibility settings.
- [Nielsen Norman Group: Microinteractions](https://www.nngroup.com/articles/microinteractions/):
  identify a trigger and a small contextual response close to that trigger.
- [Nielsen Norman Group: Animation duration](https://www.nngroup.com/articles/animation-duration/):
  tailor duration and easing to frequency and purpose. The timings below are Form's
  implementation choices, not experimentally validated thresholds.
- [W3C: Animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions):
  respect reduced-motion preferences and retain information without motion.
- [MDN: Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)
  and [Animation.cancel](https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel):
  use cancelable native animations without queuing successive interactions.

| Trigger | Feedback | Timing | Without motion |
| --- | --- | --- | --- |
| Press a button | Small compression, preserving its glass material | 120 ms | Existing focus/pressed color and action result |
| Select a navigation tab | Icon settles; label fades into selected white capsule | 160–220 ms | Instant selected capsule and `aria-current` |
| Change water amount | Actual total updates immediately with a short value acknowledgment | 220 ms | Immediate value and polite announcement |
| Select a water vessel | Selected vessel lifts 2 px inside its card | 220 ms | Selected styling and `aria-pressed` |
| Complete a workout set | Local mint glow plus existing check mark | 280 ms | Checked state, row tint and muscle map update |
| Focus a form field | Label and field styling transition | 160–200 ms | Immediate visible focus indicator |
| Save or log an entry | Brief confirmation entrance and mint check | 220–280 ms | Text confirmation in a polite status region |
| Repeat the same save/log action | A fresh confirmation, one toast at a time | Same as above | Re-announced confirmation text |
| Hover a directional action using a mouse | Arrow nudges toward its destination by 1 px | 160 ms | Standard hover/focus styling |

Implementation constraints:

- Values are never interpolated through fictitious readings. Data updates are not
  delayed to wait for animation, and controls remain usable during feedback.
- Value feedback skips initial render. Workout glow only runs when a person checks
  a set; loading existing completed sets does not replay it.
- A rapid subsequent update cancels the prior animation on that value. Undo cancels
  completion feedback. Cleanup removes listeners and animations on unmount.
- Changing the system preference to reduced motion also cancels active native
  feedback. CSS feedback disables motion under the same preference.
- Existing sheet and route transitions are retained. No additional scroll effects,
  autoplay loops, sounds, vibration, confetti, or pointer tracking are introduced.
- Keyboard focus is not moved by confirmations. Disabled controls receive no press
  animation; numbers retain their live status semantics.

Validation: `tests/interactions.spec.ts` exercises rapid updates, repeated identical
confirmations, keyboard completion and undo, reduced motion, live preference changes,
and responsive layout. Existing water, profile, navigation and workout suites cover
shared data and action behavior.

## Water logging sources

The water screen has keyboard-accessible Manual entry and Smart bottle tabs
inside a single glass pill, with a warm white selected state. A compact custom
entry form places the amount, unit and Add water action together; narrow phones
move the action to its own row. White translucent surfaces follow the water
screen's existing gradient.
Manual mode keeps the existing serving shortcuts and adds custom ml/US fl oz
entry. Both update the same dated `Nutrition.water` total used by the home card
and nutrition screens, retaining precision until display formatting. Custom
entries above 5,000 ml are rejected without changing the journal.

The bottle setup sheet saves a brand/model and display name in the optional
session-only `Store.smartWaterBottle` field. Its status remains pending: saving
details does not pair hardware or claim a successful sync. Sample journals can
preview a dated 750 ml example with three sample drinks. The preview never writes
to water totals and is explicitly labelled. Removing bottle settings preserves
water entries. Live ingestion requires a supported bottle-specific integration;
no vendor API or Bluetooth pairing is implemented by these UI controls.

The setup picker includes HidrateSpark PRO 2, LARQ PureVis 2 and another-bottle
entry. HidrateSpark direct integration is presented as pending vendor access;
public API availability was not verified. LARQ's route uses its app's Apple Health
water sharing and requires a native iPhone connector to read that data into Form.
The browser does not request HealthKit access or claim a connection. Provider
selection is saved with the bottle details and determines the setup guidance.
References: [HidrateSpark integration help](https://hidratespark.zendesk.com/hc/en-us/articles/219256347--Apple-Health-Watch),
[LARQ Apple Health](https://support.livelarq.com/hc/en-us/articles/37061029850011-Apple-Health-compatibility),
[Apple HealthKit setup](https://developer.apple.com/documentation/healthkit/setting-up-healthkit).

## Body composition overview

The home page includes a separate glass composition card below the three wearable
health cards. A light peach/rose gradient, a luminous rim,
fine grain and warm dark type give the card its own palette within the health-card finish. It shows body fat percentage, weight and skeletal
muscle, with a three-row dot-matrix fat/fat-free meter. The last scan date sits
in the upper-right corner. Tapping anywhere on the card opens details through
a full-card button that also supports Enter/Space and restores focus on dismissal;
the arrow, source pill and redundant
fat/fat-free mass row are omitted from the card. Source and full readings remain
in the detail sheet.
A subtle glass recess holds the meter; rose/plum dots indicate the fat fraction
against quieter unfilled dots. The continuous percentage fill is masked into the
same fixed grid so it remains accurate for fractional readings. There is no
circular marker. The treatment draws from RonDesignLab’s SuperPower health
visualizations, adapted to the card’s peach/rose palette. A detail sheet exposes
available readings and lets members record report values manually for the current
session. Roboto Condensed is reserved for numeric values; labels use Urbanist.

`Store.bodyCompositionScans` is optional. The latest scan on or before the selected
day is shown; equal-date entries favor the newest record. Sample values exist only
in the sample journal and on two dated scans. Missing muscle/water/BMR readings
stay unavailable. Manual entries are labelled separately, and muscle values above
fat-free mass are rejected. Fat and fat-free mass are calculated from weight and
body fat percentage. InBody hardware/API integration is not connected by this UI.

## Named anatomical workout model

The workout viewer now uses the Z-Anatomy Blender atlas, derived from BodyParts3D,
from pinned revision `7be0bfc49409b45fda74bf86fc13086fad0f4df2`. Source archive
SHA-256: `e029688545627bd0214b269e1063143abb580aad72b2c2445d6d8a9a0d9da736`.

The prior merged user-supplied model and manually traced positional masks have
been replaced. The export preserves 114 named workout muscle parts across the
existing 18 muscle groups, including separate pectoral and deltoid heads and all
four quadriceps muscles on both sides. Green targets muscle tissue; authored
tendon surfaces keep their neutral material. Untrained muscle uses a natural red
anatomical palette, with ivory bone/tendon support. Highlight roles still describe
exercise associations rather than measured muscle activation.

To keep the browser asset small, supporting anatomy and nonselectable muscle parts
are combined. Mapped muscle-part nodes retain their anatomical names and group
metadata. The athletic adaptation uses a shared, symmetrical spatial deformation
to broaden the shoulders and add chest, arm, thigh and calf volume. Muscle,
tendon and support geometry follow the same field to retain their attachments;
head and foot shapes are preserved. The reference A-pose opens the arms another
25 degrees around the shoulders and the legs another 10 degrees around the hips.
Free limbs rotate rigidly, with blending limited to their attachment regions;
below the waist, the arm region begins outside the thighs so lateral muscle and
fascia surfaces cannot be pulled outward by the shoulder rotation.
the finished model is re-centered and normalized to two units tall.
The Front and Reset controls use a centered, level orthographic view with the
camera and target at the same height, removing pitch and perspective skew.
Equal neutral
portrait lights balance both halves of the face. This stylized build is for fitness
visualization. It does not represent measured muscle growth or clinical anatomy.
The prepared model is about 3.5 MB, with roughly 769k unique-mesh
triangles and 218 rendered primitive instances. Rendering remains on demand;
the model loads only on the workout screen.

Rebuild with Blender installed:

```sh
BLENDER_BIN=/path/to/blender npm run prepare:anatomy
```

`scripts/export-z-anatomy.py` runs with Blender auto-execution disabled, bakes each
selected source object's modifiers before combining support geometry, and omits
viewport subdivision. `scripts/prepare-muscle-model.mjs` verifies the source ZIP,
normalizes scale and simplifies with bounded error and locked borders.
`scripts/athletic-anatomy.mjs` applies the coherent body shaping in normalized
world coordinates, preserves named nodes and tissue materials, and recalculates
surface normals before Meshopt compression. Shared source meshes are cloned
before deforming their instances, preventing mirrored parts from being changed
twice. `FORM_ANATOMY_CACHE` optionally selects the conversion cache;
`--reuse-export` explicitly reuses its intermediate export. Blender and the atlas
are build-time tools, not runtime or deployment dependencies.

Model assets retain CC BY-SA 4.0 licensing. Source credits, upstream notices and
modification details ship in `public/anatomy/`. The exported subset excludes
inner-ear, kidney and other organ-system assets. The viewer links the attribution
from its model credits disclosure.

`checks/anatomy-model.test.mjs` validates provenance, anatomical node mappings,
separate muscle/tendon materials, bounds and source exclusions. Workout browser
tests exercise highlighting, direct 3D selection, framing, logging and fallback.

The viewer adds a shared 512px procedural color/bump surface to mapped muscles,
with per-part fiber coordinates. Pectoral striations fan toward the upper-arm
attachment; elongated muscle parts follow their principal geometry direction.
Tendon surfaces keep their ivory material and receive much finer relief.
The neutral fiber map preserves primary/assisting green when the workout changes.
Textures are generated once per viewer, use mipmaps and bounded anisotropy, and
are disposed with the model. Pixel ratio is capped at 2 and rendering stays on
demand. Pinch/scroll zoom is bounded, and Reset restores the full-body view.
These are surface-detail improvements to the existing atlas, not additional
anatomical sculpt geometry or a scan of the reference image.

Facial skull, cartilage and fascia surfaces use a warm anatomical tint blended
only above the neck, softening the formerly white scalp and cheek patches.
Vertex colors keep the body's original tendon and bone finish unchanged; eyes,
iris, teeth and workout muscle materials retain their separate roles. The head
keeps its source geometry and the existing balanced portrait lighting.


## Shared trainer workspace

Trainer member details reuse the member’s health cards, body composition, nutrition forms, water tracker, muscle map, measurement comparison and journal screens. A named member heading and selected date establish context above a wrapping navigation row: Body & health, Workouts, Nutrition & wellness, Water, Progress, Member journal and Connections. Progress and Journal have compact secondary navigation. Preserve the ruled sections, existing fonts and health-card finishes. The body overview groups weight, food totals and training status with direct food/workout edit actions. Device setup is explicitly pending where integrations are unavailable. Real accounts show save/sync state and review controls for conflicting edits; sample access is labelled session-only.

On phones, the selected member’s sections sit in a fixed two-row bottom menu with Health, Workouts, Food, Water, Progress, Journal and Devices. The full accessible names are preserved. The member name/date stays in the menu, the application’s general bottom bar is hidden in member details, and content reserves clearance plus the safe-area inset. Section changes return to the top. Mobile is the sole design target for this workflow.

The trainer overview shows three stacked mobile summary cards for weight, food and training. Each has a matching transparent 3D scale, food bowl or dumbbell rendered at 96px, restrained lavender/peach/teal card tints, and clear value/source text. The date control is a 48px icon-only calendar button aligned to the right; its accessible label and selected-date description remain available. Signup defaults to a member account; an optional trainer signup link replaces the account-type dropdown.


## Current trainer member navigation

The approved mobile navigation supersedes the earlier seven-item menu. Use five primary tabs: Overview, Workouts, Food, Progress and More, with the same icon family. More opens Water, Journal and Devices as individual pages. The header shows the current section, member name and selected date; Overview keeps the member name as its title. Header Back returns to the parent page, and each tab/parent retains its scroll position. The member profile avatar opens a separate profile page. Workout assignments, actual logs and meal editors have their own deeper pages; saving returns to the source section. Member food editing remains a sheet in the member’s own workspace.

A compact trainer date strip replaces the plain calendar-only row. It shows a nearby seven-day strip, entry markers, previous/next-day controls, Today, and an accessible calendar button. Dates update all member sections and stay unchanged when navigating. Editing pages show a fixed entry date. Styling follows the existing lavender/teal glass controls, with 44px date targets and a single-row bottom menu.

Trainer date controls: show the day strip only on Overview. Its toolbar contains the month/year and calendar icon; remove visible previous/next arrows, Today shortcut and footer legend. Other sections show a right-aligned icon-only calendar, disabled while editing an entry. Entry dots stay on the day buttons.

Trainer More is now a floating, body-portaled icon menu above the glass navigation, rather than a separate page. It preserves the current page/date/scroll until a destination is chosen. Water, Journal and Devices use icon-only tiles with accessible labels, an outside-tap scrim and a separate circular close action. Menu focus is trapped; Escape closes and restores the More trigger. A short rise/scale/fade, closing fade and local tap feedback provide micro animations, with reduced-motion and live preference changes respected. Trainer bottom navigation is icon-only, retaining aria-labels and white selected capsules.

The Overview date strip now contains every day of the selected month, from day 1 through month end. Touch uses native momentum and proximity snapping; mouse dragging and wheel input are supported. Date selection updates records immediately, then centers with a cancelable 480ms ease-out and a 240ms local scale/opacity acknowledgment. New gestures interrupt programmatic scrolling, dragging never selects a day accidentally, and live reduced-motion preferences stop the effects. Home/End select the first/last day of the month.

Member detail date controls now live in the header immediately before the profile avatar. Overview’s month strip contains only scrollable day buttons, with no month/year title or calendar control inside it. The selected date stays under the page title; the header calendar stays disabled while editing.


Monthly goal ordinals retain their existing 68px type and 58px dial layout,
but render at 1.35 scale anchored to the bottom center. This enlarges only
the numbers; card dimensions, text spacing and surface styling stay unchanged.


Habit tracker: keep month selection above a compact view-switcher row. Place
the selected weekday and month/day at the right of that row (the selected month
in monthly view). Each habit is a separate existing glass panel with 16px gaps,
retaining the current palette, typography, rounded controls and month totals.
A vertical Hugeicons three-dot disclosure sits at each card’s top-right, with
a transparent background, no border or shadow, and a 44px touch target. Its white
glass popover contains Delete text. Monthly totals use 48px Roboto Condensed
with the existing small Urbanist caption. Reserve 28px above the habit input
and total row so both sit below the top-right menu without overlap. Delete opens the existing confirmation sheet
with the habit name, Cancel and Delete habit. Cancellation preserves all data.


Local account mode keeps the existing account form and glass styling. Its
supporting text explicitly says accounts and journals are saved in this browser
only and removed when browser data is cleared. Sharing copy describes same-browser
accounts; save status and footer must not claim cross-device synchronization.
