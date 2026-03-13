## Summary

Describe what changed and why.

## Validation

- [ ] `npm run check:i18n`
- [ ] `npm run build`
- [ ] `npm run test:regression`
- [ ] If runtime behavior changed: `npm run tauri dev`
- [ ] If i18n keys/locales changed: `npm run i18n:missing:strict`

## Checklist

- [ ] Change is focused (single topic / cohesive scope).
- [ ] No accidental deletion/rename in `src-tauri/icons`, `src/assets`, `public`.
- [ ] If touching `AGENTS.md` or `skills/`, add `allow-agent-instructions` label and explain why.
- [ ] If touching workflows/release/config, reason is described clearly.
