# Agent Workflow Rules (Project-Level)

## Large Change Localization Policy

When implementing a **large change** (new feature, major refactor, UI flow redesign, packing-algorithm rewrite, or any change touching many files/components):

1. Work in **English-first mode**.
2. Do **not** update non-English localization content in the same implementation step.
3. If new i18n keys are required, provide English values and let other languages fallback to English temporarily.
4. Keep language update work as a **separate follow-up step**.
5. After implementation is ready, ask the user for approval before adding/updating non-English translations.

## Localization Change Modes (Required)

Use one of the following modes explicitly when changing UI text/i18n:

1. `feature-mode` (English-first)
- Add/change keys in English only.
- Non-English locales may temporarily miss optional keys.
- Must keep app behavior correct via fallback.

2. `localization-wave` (translation completion)
- Fill/adjust non-English locales.
- No feature logic changes in the same step.
- Run full i18n checks and finish with zero missing keys.

## What Counts As "Large Change"

Treat a task as large change when at least one of these is true:

- It modifies core packing logic.
- It changes behavior across multiple screens/components.
- It introduces many new UI texts or states.
- It affects data flow, constraints, or validation rules broadly.

If unsure, assume it is a large change and follow English-first mode.

## Mandatory i18n Quality Gates

Run these commands based on scope:

1. Any localization edit (`src/i18n*`, `src/i18n-locales/*`, `src/i18n-language-fallbacks/*`):
- `npm run check:i18n`

2. Any key add/remove/rename:
- `npm run i18n:missing`

3. Localization wave completion or release candidate:
- `npm run i18n:missing -- --strict`
- `npm run i18n:status`

Definition of done:
- `feature-mode`: `check:i18n` passes, no missing required keys.
- `localization-wave`: `check:i18n` passes and `i18n:missing -- --strict` passes.

## Translation Safety Rules (Mandatory)

- Never alter template placeholders inside localized functions: keep `${...}` exactly as-is.
- Do not translate technical tokens unless explicitly intended by UI copy:
  `JSON`, `CFG`, `UI`, `3D`, `mm`, axis markers like `X`, `Y`, `Z`.
- Keep numeric/format semantics intact (`0..${width}`, units, counters, ranges).
- Do not modify TypeScript signatures in locale files (function params/types).
- Prefer one-language-at-a-time for quality-critical translation batches.

## i18n Encoding Safety (Mandatory)

- Treat `src/i18n.ts` and `src/components/Sidebar.tsx` as UTF-8 only.
- Treat `src/i18n-locales/*` and `src/i18n-language-fallbacks/*` as UTF-8 only.
- Do not mass-rewrite these files with shell recoding tools.
- If shell editing is unavoidable, always read/write explicitly as UTF-8.
- Prefer `apply_patch` for localization edits.
- Run `npm run check:i18n` before finishing localization work.
