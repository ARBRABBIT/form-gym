<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UI Design Rules

Every time you create or modify UI, build it strictly based on `DESIGN.md` only — follow its defined colors, typography, icons, layout, spacing, shapes, elevation, and interaction guidelines without inventing new visual styles or off-system tokens.

## Verification Rules

After every change, double-check your work thoroughly — verify CSS specificity, layout math, positioning, and behavior against the user's exact request to ensure the result fully satisfies what the user asked for before finishing.