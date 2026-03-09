# Localization Workflow

This project uses a structured i18n layout. Keep localization changes small, UTF-8 safe, and easy to verify.

## Core Files

- language registry: `src/i18n-languages.ts`
- translation map: `src/i18n-translations.ts`
- translation types: `src/i18n-types.ts`
- locale files: `src/i18n-locales/*.ts`
- language metadata: `src/i18n-language-metadata/*`
- per-UI language-name fallbacks: `src/i18n-language-fallbacks/*`

## Required Checks

Run these after localization edits:

```bash
npm run check:i18n
npm run i18n:missing
```

For a release candidate or full localization pass:

```bash
npm run i18n:missing -- --strict
npm run i18n:status
```

## Editing Rules

- Keep files UTF-8 encoded.
- Preserve placeholders exactly: `${...}`
- Do not translate technical tokens unless intentionally part of UI copy:
  - `JSON`
  - `CFG`
  - `UI`
  - `3D`
  - `mm`
  - `X`, `Y`, `Z`
- Prefer one language at a time for quality-critical work.

## Adding a New Language

1. Add the code to `src/i18n-languages.ts`.
2. Add the locale file in `src/i18n-locales/`.
3. Register it in `src/i18n-translations.ts`.
4. Add metadata in `src/i18n-language-metadata/`.
5. Add UI-name fallback entries in `src/i18n-language-fallbacks/`.
6. Run the checks above.

## Recommended Change Modes

1. English-first feature work
- add or change English keys first
- let other languages temporarily fallback where appropriate

2. Localization wave
- fill or polish non-English locales
- avoid mixing feature logic changes into the same batch
