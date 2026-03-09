# GitHub Maintainer Lite (No 24/7 Supervision)

This setup keeps control high and daily effort low.

## Goal

- You review only ready PRs.
- Broken PRs cannot be merged.
- Core checks run automatically.

## Current Reality In This Repo

- Existing workflow checks:
  - `Asset Guard / guard`
  - `CI / i18n`
  - `CI / build`
  - `Release (Windows)` (tag-based release pipeline)

## Phase 1: Safe Minimum (Can be done now)

In GitHub:

1. `Settings` -> `Branches` -> `Add branch protection rule`.
2. Branch name pattern: `main`.
3. Enable:
   - `Require a pull request before merging`
   - `Require approvals` = `1`
   - `Require status checks to pass before merging`
4. In required checks, select:
   - `Asset Guard / guard`
5. Enable:
   - `Do not allow bypassing the above settings`

Result: PR must pass `Asset Guard` and get 1 approval.

## Phase 2: Full Maintainer-Lite (Recommended)

In branch protection required checks, add:

- `Asset Guard / guard`
- `CI / i18n`
- `CI / build`

Result: impossible to merge broken i18n or broken build.

## Merge Policy (Simple and Scalable)

- No direct push to `main`.
- No auto-merge (until project is stable enough).
- If checks are green and PR scope is clear: merge.
- If checks are red: no discussion, no merge.

## Translation PR Rule

For localization-only PRs, require:

1. language code(s),
2. key list or file list,
3. confirmation that placeholders remain intact (`${...}`, units, tokens like `X/Y/mm`),
4. green checks.

## Weekly 10-Minute Routine

1. Open PR list filtered by `is:open is:pr`.
2. Review only PRs with all checks green.
3. Merge small, focused PRs first.
4. Leave large mixed PRs for later split.

This is enough to keep quality without full-time moderation.
