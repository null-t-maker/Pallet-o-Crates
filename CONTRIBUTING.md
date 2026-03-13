# Contributing to Pallet-o-Crates

Pallet-o-Crates is still an experimental `0.x` project. Small, clear contributions are preferred over large mixed PRs.

## High-Value Contribution Types

- bug fixes
- packing-quality improvements
- regression tests
- documentation cleanup
- native-speaker translation review

## Before Opening a PR

Run the checks that match your change:

```bash
npm run check:i18n
npm run build
npm run test:regression
```

If your change affects runtime behavior, also verify it in:

```bash
npm run tauri dev
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

If you change packing behavior, include at least one of:

- a new regression test
- a benchmark result
- a screenshot or sample showing before/after behavior

For this project, concrete evidence matters more than long theory.

## Translation Contributions

Translation fixes are welcome and genuinely useful here.

Current public i18n status:

- `138` UI languages are present in the repo
- only `pl` and `en` are currently marked as human-verified
- most other locales are still machine-draft or AI-assisted and need native-speaker review

Core files:

- locale files: `src/i18n-locales/*.ts`
- language registry: `src/i18n-languages.ts`
- translation map: `src/i18n-translations.ts`
- language metadata: `src/i18n-language-metadata/*`
- UI fallback names: `src/i18n-language-fallbacks/*`
- translation review badge registry: `src/i18n-language-review-status.json`

Review badge meaning:

- `approved`: translated and reviewed by a trusted human reviewer
- `machine`: usable draft, but still awaiting confident human review
- `none`: hide the badge when no public signal is desired

Please keep:

- UTF-8 encoding
- placeholders like `${...}` unchanged
- technical tokens unchanged unless intentionally part of UI copy: `JSON`, `CFG`, `UI`, `3D`, `mm`, `X/Y/Z`

Useful checks:

```bash
npm run check:i18n
npm run i18n:missing
npm run i18n:missing:strict
npm run i18n:status
```

Useful docs:

- [docs/command-reference.md](docs/command-reference.md)
- [docs/localization-workflow.md](docs/localization-workflow.md)
- [docs/i18n-language-status.md](docs/i18n-language-status.md)

If you are a native speaker, review PRs are one of the highest-value ways to help this project.

## Command Reference

If you are new to the repo, start with [docs/command-reference.md](docs/command-reference.md). It explains which commands are desktop-first, which are frontend-only, and which are intended for validation or i18n maintenance.

## Packing / Algorithm Contributions

The packer aims for practical layouts, not mathematically guaranteed global optimum. Please evaluate changes accordingly.

- preserve hard validity rules first
- improve heuristic quality second
- include a regression test whenever behavior changes
- do not market a heuristic tweak as a guaranteed optimizer improvement

## Large Changes

For bigger features or refactors:

- prefer English-first UI changes
- keep translation waves separate from feature logic
- avoid mixing algorithm rewrites with large localization edits in one PR
