# Contributing to Pallet-o-Crates

Thanks for helping improve the project.

## How to contribute

1. Fork the repo and create a feature branch.
2. Make focused changes (one topic per PR if possible).
3. Run local checks.
4. Open a Pull Request with a clear description.

## Local checks

Run these before opening a PR:

```bash
npm run check:i18n
npm run build
```

## Translation contributions

Translation fixes are welcome and encouraged.

- Main locale files live in `src/i18n-locales/*.ts`.
- Language names and runtime fallbacks are in `src/components/Sidebar.tsx`.
- Keep files UTF-8 encoded.
- Avoid mass recoding or bulk encoding rewrites.
- Keep wording practical for warehouse/logistics users.

When suggesting translation changes, include:

- Language code (example: `es`, `uz`, `hy`)
- Key name (example: `calculatePacking`)
- Current text
- Suggested text
- Short context (where it appears in UI)

If you are unsure, open an issue first using the translation issue template.

## Large implementation changes

For major features/refactors, maintainers use an English-first flow:

- Add/update English first
- Keep other locales on English fallback temporarily
- Localize other languages after approval/review

This keeps large changes safer and easier to validate.

