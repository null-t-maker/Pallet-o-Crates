# Refactor Regression Checklist

Use this checklist after each refactor batch before moving to the next batch.

## Core Gates
- Run `npm run check:i18n`.
- Run `npm run build`.
- Confirm app starts in `npm run tauri dev` without runtime errors.

## Topbar / Navigation
- With `UI zoom = 75%`, open `Workflow`, `Save layout sample`, `Language`, `Settings`: each dropdown opens directly under its trigger.
- Repeat with `UI zoom = 100%`.
- Repeat with `UI zoom = 160%`.
- When topbar actions overflow and horizontal scrollbar appears, scroll right and open each dropdown: panel is visible and not clipped.
- Verify `Pallet panel` toggle still behaves correctly while topbar is horizontally scrolled.

## Language Picker
- Open language panel from topbar and from sidebar devtool list.
- Search filter works and keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`) still works.
- Active language remains pinned first in the dynamic list.
- Devtool list keeps stable alphabetical order.

## Packing / Generation
- Generate with `Template lock = Off`, `Guidance = Off`, `Aligned edges`.
- Generate with `Template lock = On`, `Guidance = On`, `Aligned edges`.
- Generate with `Template lock = On`, `Guidance = On`, `Center compact`.
- Validate no carton overlap in generated output and diagnostics do not report collisions.

## Manual 3D Editing
- Move carton into partial collision: carton snaps back only by collision depth, not full reset.
- Move carton where full path collides: move is rejected.
- Carton cannot be sunk below pallet top plane.
- Axis gizmo remains usable after camera orbit and zoom changes.

## Sample Database / Save
- Choose sample database folder and reload; status summary updates.
- Save sample with default strategy and with `both`.
- Reload app and verify persisted settings (`language`, `uiScale`, `uiZoom`, sample folder paths, guidance flags).

## Visual Style
- Topbar scrollbar uses green theme.
- Sidebar and carton-list inner scrollbars use green theme.
- Dropdown corner radius is intact for `Save layout sample` and `Language`.
