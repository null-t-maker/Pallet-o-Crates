# Localization Workflow

This project ships a broad language set, but translation quality is intentionally tracked separately from language availability.

- UI languages currently present: `138`
- human-verified badge currently assigned: `pl`, `en`
- default badge for most other locales: `machine`

If you are a native speaker, translation review is one of the most useful contribution paths for this repo.

## Core Files

- language registry: `src/i18n-languages.ts`
- translation map: `src/i18n-translations.ts`
- translation types: `src/i18n-types.ts`
- locale files: `src/i18n-locales/*.ts`
- language metadata: `src/i18n-language-metadata/*`
- per-UI language-name fallbacks: `src/i18n-language-fallbacks/*`
- translation review badge registry: `src/i18n-language-review-status.json`
- generated public status report: `docs/i18n-language-status.md`

## Review Badge Meaning

- `approved`: translated and reviewed by a trusted human reviewer
- `machine`: usable draft, but still awaiting confident human review
- `none`: hide the badge when no public review signal should be shown

The language picker UI shows these badges directly so users can distinguish a native-reviewed locale from a draft.

## Required Checks

Run these after localization edits:

```bash
npm run check:i18n
npm run i18n:missing
npm run i18n:status
```

For a release candidate or full localization pass:

```bash
npm run i18n:missing:strict
npm run i18n:status
```

## Review Badge Updates

To change the review badge for one or more languages:

```bash
npm run i18n:review:set -- pl approved
npm run i18n:review:set -- de machine
npm run i18n:review:set -- fr none
npm run i18n:review:set -- "en,pl" default
```

After changing statuses, regenerate the public report:

```bash
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
- If a locale already has a real non-English draft, do not roll it back to English just because perfect polish is not available yet.
- Prefer the best available in-language draft over an English fallback unless the locale is corrupted or the maintainer explicitly asks for a rollback.

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
