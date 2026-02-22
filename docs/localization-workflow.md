# Localization Stability Workflow

## Goal
Keep multilingual UI updates safe and repeatable without breaking existing languages.

## Single Source Of Truth
- Language registry: `src/i18n.ts` (`LANGUAGES`)
- Runtime language guard: `src/i18n.ts` (`isLanguage`, `DEFAULT_LANGUAGE`)
- Sidebar order uses registry directly: `LANGUAGE_ORDER = LANGUAGES`

## Required Checks
- Run: `npm run check:i18n`
- Run: `npm run build`

`check:i18n` validates:
- suspected mojibake markers in i18n files
- `LANGUAGES` and `translations` are aligned
- app restore logic uses `isLanguage` guard
- sidebar order uses `LANGUAGES`

## Editing Rules
- Keep i18n files in UTF-8.
- Prefer `apply_patch` for translation edits.
- Avoid bulk recoding/conversion operations.

## Add New Language
1. Add code to `LANGUAGES` in `src/i18n.ts`.
2. Add full block in `translations`.
3. Add native name in `LANGUAGE_NATIVE_NAME` (`Sidebar.tsx`).
4. Add names matrix in `LANGUAGE_NAME_BY_UI` (`Sidebar.tsx`).
5. Add English fallback label in `LANGUAGE_ENGLISH_NAME` (`Sidebar.tsx`).
6. Add locale in `LANGUAGE_COLLATOR_LOCALE` (`Sidebar.tsx`).
7. Run checks and build.
