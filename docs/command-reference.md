# Command Reference

This repo has both desktop-runtime commands and frontend-only commands. The distinction matters.

In this repo the documented form is:

- `npm run tauri dev`
- `npm run tauri build`

That matches the maintainer workflow and works correctly in the current npm setup.

## Primary App Commands

- `npm run tauri dev`
  - Main development entry point.
  - Starts the Tauri desktop app and is the recommended command for real runtime verification.

- `npm run tauri build`
  - Builds desktop release artifacts through Tauri.
  - Use this when validating packaging, not just web bundling.

## Frontend-Only Commands

- `npm run dev`
  - Starts the Vite frontend dev server only.
  - Useful for fast UI iteration, but it is not a full desktop-runtime check.

- `npm run build`
  - Runs `check:i18n`, TypeScript compile, and Vite production build.
  - Good baseline validation for most changes.

- `npm run preview`
  - Serves the already-built Vite output locally.

## Test / Validation Commands

- `npm run test:regression`
  - Runs the full regression suite under `src/lib/__tests__`.

- `npm run test:regression:watch`
  - Watch mode for the same regression suite.

- `npm run test:template-lock`
  - Runs the focused template-lock regression set.

- `npm run benchmark:packer`
  - Runs the packer benchmark script.
  - Useful when changing heuristic behavior or comparing algorithm changes.

## Localization Commands

- `npm run check:i18n`
  - Integrity check for i18n structure and registry consistency.

- `npm run i18n:missing`
  - Reports missing translation keys.

- `npm run i18n:missing:strict`
  - Strict missing-key gate for release candidates and localization waves.

- `npm run i18n:status`
  - Regenerates the public language status report in `docs/i18n-language-status.md`.

- `npm run i18n:review:set -- <lang> <status>`
  - Updates translation review badge state in `src/i18n-language-review-status.json`.
  - Example: `npm run i18n:review:set -- pl approved`
  - For multiple languages in PowerShell, quote comma-separated values: `npm run i18n:review:set -- "en,pl" default`

## Localization Wave Utilities

These are mainly maintainer or batch-translation tools:

- `npm run i18n:wave:export`
- `npm run i18n:wave:autofill -- <wave-file.json>`
- `npm run i18n:wave:apply -- <wave-file.json>`
- `npm run i18n:audit:labels`

Use them only when working on larger i18n batches, not for ordinary feature development.

## Practical Rule Of Thumb

- Testing the actual app: use `npm run tauri dev`
- Fast frontend iteration only: use `npm run dev`
- Basic validation before commit: run `npm run build` and `npm run test:regression`
- Localization work: run the relevant `i18n:*` commands listed above
