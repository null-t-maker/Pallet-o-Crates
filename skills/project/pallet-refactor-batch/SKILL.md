---
name: pallet-refactor-batch
description: Run low-regression refactor batches for this project. Use when the user asks to continue refactoring, split large files, improve maintainability, or reduce coupling while preserving behavior. Apply one safe batch at a time, run build and regression tests, and update refactor progress docs after each batch.
---

# Pallet Refactor Batch

## Goal

Keep refactoring incremental, deterministic, and low-risk:
- split large files into focused modules,
- preserve runtime behavior,
- validate after every batch,
- keep progress tracking current.

## Mandatory Workflow

1. Load project context before editing:
- `AGENTS.md`
- `docs/refactor-progress.md`
- `docs/refactor-regression-checklist.md`

2. Pick one batch scope only:
- one primary target file or one tightly related target group,
- avoid mixing unrelated areas in a single batch.

3. Apply a behavior-preserving split:
- extract types/contracts first,
- extract pure mapping/helpers second,
- keep backward-compatible exports (barrel or re-export) when needed.

4. Validate immediately:
- run `npm run build`,
- run `npm run test:regression`,
- do not continue to next batch until both are green.

5. Update progress docs:
- append completed split(s) to `docs/refactor-progress.md`,
- keep “Highest-Priority Remaining Chunks” aligned with current largest hotspots,
- keep status percentages explicit.

6. Report compactly:
- list changed files,
- report validation status,
- provide next 3-5 best targets.

## Target Selection Rules

Prioritize in this order:
1. Files with mixed responsibilities and frequent edits.
2. Files above ~150 lines in `src/components` and `src/hooks`.
3. `src/lib` hotspots coupling workflow/heuristics/runtime wrappers.

Prefer low-risk refactor patterns:
- type extraction,
- pure helper extraction,
- section/component extraction,
- hook orchestration extraction.

Avoid in this skill:
- feature changes,
- algorithm behavior changes,
- translation expansion batches.

## Safety Gates

- Do not skip validation commands.
- Do not run destructive git operations.
- Stop and ask user if unexpected unrelated changes appear.
- Keep edits ASCII unless file already requires Unicode.

## Command Set

Use these commands for each batch:

```powershell
npm run build
npm run test:regression
```

Use this scan when choosing next targets:

```powershell
Get-ChildItem src/components,src/hooks,src/lib -Recurse -File -Include *.ts,*.tsx |
  ForEach-Object { $lines=(Get-Content $_.FullName).Count; [PSCustomObject]@{Lines=$lines; Path=$_.FullName} } |
  Sort-Object Lines -Descending |
  Select-Object -First 20
```

## References

- For quick copy of recurring commands and checkpoints, use:
  - `references/batch-commands.md`
