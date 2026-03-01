# Batch Commands

## Validation

```powershell
npm run build
npm run test:regression
```

## Hotspot Scan

```powershell
Get-ChildItem src/components,src/hooks,src/lib -Recurse -File -Include *.ts,*.tsx |
  ForEach-Object { $lines=(Get-Content $_.FullName).Count; [PSCustomObject]@{Lines=$lines; Path=$_.FullName} } |
  Sort-Object Lines -Descending |
  Select-Object -First 20
```

## Progress Update Targets

- `docs/refactor-progress.md`
- `docs/refactor-regression-checklist.md`
- `AGENTS.md`
