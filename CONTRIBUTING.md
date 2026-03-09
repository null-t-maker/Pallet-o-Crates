# Contributing to Pallet-o-Crates

Thanks for helping improve the project.

This repo does not require heavy process. Small, clear changes are preferred.

## Good Contribution Types

- bug fixes
- packing-quality improvements
- test additions
- translation fixes
- documentation cleanup

## Before Opening a PR

Run the local checks that match your change:

```bash
npm run check:i18n
npm run build
npm run test:regression
```

If you changed packing behavior, also run:

```bash
npm run benchmark:packer
```

## PR Style

Keep PRs focused:

- one topic per PR if possible
- explain what changed
- explain why it changed
- mention any tradeoff or known limitation

## Translation Contributions

Translation fixes are welcome.

Current i18n structure:

- locale files: `src/i18n-locales/*.ts`
- language registry: `src/i18n-languages.ts`
- translation map: `src/i18n-translations.ts`
- language metadata: `src/i18n-language-metadata/*`
- UI fallback names: `src/i18n-language-fallbacks/*`

Please keep:

- UTF-8 encoding
- placeholders like `${...}` unchanged
- technical tokens unchanged unless intentionally part of UI copy (`JSON`, `CFG`, `UI`, `3D`, `mm`, `X/Y/Z`)

Useful checks:

```bash
npm run check:i18n
npm run i18n:missing
```

## Packing / Algorithm Contributions

If you change packing behavior, include at least one of:

- a new regression test
- a benchmark result
- a screenshot or sample showing before/after behavior

That matters more than long theory.

## Large Changes

For bigger features or refactors:

- prefer English-first UI changes
- keep translation waves separate from feature logic
- avoid mixing algorithm rewrites with large localization edits in one PR
