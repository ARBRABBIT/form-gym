# Member overview

Mode: Operate

Help the member inspect the selected day and record training, habits and nutrition. The date heading, week strip, workout ledger and ruled daily sections form the current composition. Supporting monthly records occupy the aside on desktop and follow the daily sections on mobile. Persistent Member view / Trainer view tabs expose role navigation; mobile bottom navigation keeps daily actions reachable.

Visual authority: current implementation and root DESIGN.md. Preserve the flat ruled journal, grayscale Helvetica system and Indian sample names. This brief records the implemented surface; it is not a new composition proposal.

## Separate water card - 24 November 2026

At the user's request, water is now a standalone card between Nutrition and Daily check-in. It follows the supplied deep teal/cyan liquid reference, with six glass indicators, a sample 2.25 L reading, plus/minus 250 ml controls and slow, overlapping SVG waves. The user requested dummy data for now, so this component is an explicitly labeled local preview and never writes water into nutrition records. The existing Nutrition screen still contains the real daily water log. Motion is disabled by reduced-motion preference. New UI lives in src/components/water-card.tsx and src/app/water-card.css. The artwork is SVG/CSS geometry; no shipping raster was added. Incumbent theme and DESIGN.md stay unchanged.

Follow-up: the user requested extra blur and reflected glow on the water. The wave layers now have scoped blur, and a pale cyan elliptical reflection drifts over the right side of the liquid; text and controls are outside the filtered layer. The broader sample journal is populated, with sample health provenance visible on home/details. Personal account data remains isolated. Tests cover sample isolation, provider connection honesty and the summary UI.

Water seam correction: removed the separate rectangular water body and overlay. Both animated wave SVGs now extend to the card bottom; the front path contains its own continuous gradient. This prevents the straight join below the wave, including during lateral movement. Verified four widths and three paused animation phases, plus controls and typecheck.
