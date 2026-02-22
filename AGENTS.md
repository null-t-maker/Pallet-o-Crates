# Agent Workflow Rules (Project-Level)

## Large Change Localization Policy

When implementing a **large change** (new feature, major refactor, UI flow redesign, packing-algorithm rewrite, or any change touching many files/components):

1. Work in **English-first mode**.
2. Do **not** update non-English localization content in the same implementation step.
3. If new i18n keys are required, provide English values and let other languages fallback to English temporarily.
4. Keep language update work as a **separate follow-up step**.
5. After implementation is ready, ask the user for approval before adding/updating non-English translations.

## What Counts As "Large Change"

Treat a task as large change when at least one of these is true:

- It modifies core packing logic.
- It changes behavior across multiple screens/components.
- It introduces many new UI texts or states.
- It affects data flow, constraints, or validation rules broadly.

If unsure, assume it is a large change and follow English-first mode.

## i18n Encoding Safety (Mandatory)

- Treat `src/i18n.ts` and `src/components/Sidebar.tsx` as UTF-8 only.
- Do not mass-rewrite these files with shell recoding tools.
- If shell editing is unavoidable, always read/write explicitly as UTF-8.
- Prefer `apply_patch` for localization edits.
- Run `npm run check:i18n` before finishing localization work.
