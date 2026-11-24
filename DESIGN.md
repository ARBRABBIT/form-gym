---
name: Form — gym journal
description: A flat, ruled training journal in Helvetica and grayscale.
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
    fontFamily: "Helvetica, Arial, sans-serif"
    fontSize: "44px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-1.5px"
  headline:
    fontFamily: "Helvetica, Arial, sans-serif"
    fontSize: "40px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-1.4px"
  title:
    fontFamily: "Helvetica, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 500
  body:
    fontFamily: "Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Helvetica, Arial, sans-serif"
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

Form treats the screen as a working training journal: readable records, aligned numbers and ruled sections. Helvetica, white paper and dark ink establish a restrained, practical identity. The user rejected a generic card-heavy interface; the implemented replacement gives dates, exercise rows and daily records the hierarchy.

The interface is mobile-first. Familiar controls, persistent role tabs and compact labels support repeated entry. Sample records use Indian names, including Arjun Sharma, Meera Iyer, Rohan Patel and coach Kabir Mehta.

**Key Characteristics:**

- Flat ruled sections and aligned ledgers.
- Helvetica throughout, with large date and training headings.
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

Display and body share Helvetica with Arial and sans-serif fallbacks. Weight, scale and spacing establish hierarchy without a second font.

- **Display:** the desktop journal weekday. Its date companion is lighter (400) and smaller (40px). At the mobile breakpoint the weekday becomes (36px) and its date companion (30px); the narrow-phone override uses (33px) and (28px).
- **Headline:** standard page headings. Mobile page headings use (34px), with tighter tracking (-1px).
- **Title:** common section headings. Journal section labels use (17px), weight (500), tracking (-0.3px).
- **Body:** the document default. Supporting descriptions may use line height (1.9) and maximum measure (70ch).
- **Label:** fields and common controls. Dense annotations use smaller type, commonly (10–11px).
- Numeric inputs and exercise rows use tabular numerals. Training titles use (35px), weight (500), line height (1.18), increasing to (40px) on wide screens.

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

- **Do** use Helvetica with Arial and sans-serif fallbacks.
- **Do** align numeric workout data and retain tabular numerals.
- **Do** preserve persistent field labels, keyboard focus and reduced-motion behavior.
- **Do** use ruled sections and restrained grayscale to organize records.
- **Do** retain visible Member view and Trainer view tabs across viewport sizes.

### Don't:

- **Don't** introduce accent colors, gradients or additional typefaces.
- **Don't** return to a generic grid of rounded dashboard cards.
- **Don't** apply sheet rounding or floating shadows to ordinary journal sections.
- **Don't** use placeholder-only labels or rely on color alone to identify the active role.
