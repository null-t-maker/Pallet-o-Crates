# Packing Constraints And Conflicts

This document describes the current high-level rule model used by the pallet packer.

It is intentionally approximate. It explains the engine's priorities and safety model, not every scoring detail.

## Hard Constraints

These are the rules the engine should not violate.

1. Pallet bounds
- A carton footprint must stay inside pallet width and length.

2. No collision
- No overlap on the same level.
- No 3D interpenetration across levels.

3. Maximum pallet limits
- Total packed weight must stay within `pallet.maxWeight`.
- Any carton top (`z + h`) must stay within `pallet.maxHeight`.

4. Support safety
- A carton above the base layer must pass support validation.
- Full footprint support is not required, but support must remain controlled.
- The current model allows limited overhang when support ratio, support balance and pressure are still acceptable.

5. Pressure and structural safety
- Local support must pass pressure checks.
- Heavy-on-light transfer is limited.
- A larger or heavier carton cannot overload one or two weak supporters below.

6. Cumulative stack-load safety
- Total carried load ratio is limited through the stack.
- Extra caps apply to load coming from heavier cartons above.
- Long staircase-like single-support towers are rejected when cumulative drift becomes unsafe.

7. Wrap / shippability safety
- Layer shape must stay wrap-friendly.
- Edge protrusions that create bad wrap behavior are rejected.

## Soft Preferences

These are optimization goals, not absolute rules.

1. Packing style
- `edgeAligned`: prefer wall and corner coverage.
- `centerCompact`: prefer center occupancy and controlled edge setbacks.

2. Layer compactness
- Lower gap ratio.
- Fewer disconnected islands.
- Avoid wasting usable shelf space.

3. Height efficiency
- Prefer fewer layers and lower total height when feasibility is unchanged.

4. Better interlocking
- Prefer bonded / interlock-ready layouts over clean column stacks when multiple layers are clearly coming.

5. Type sequencing
- Try not to strand large late-stage cartons.
- Avoid pathological tower streaks and weak filler patterns.

6. Upright policy
- `never`, `tailOnly`, `prefer` affect orientation preference.
- They are not a guarantee that one orientation will always be chosen.

## Known Conflict Zones

1. `centerCompact` vs wrap safety
- Strong center bias can create fragile islands.
- Wrap constraints can push center mode toward more edge-like results.

2. Height minimization vs structural safety
- Dense top fill can reduce height but overload support below.

3. Cross-type mixing vs support reliability
- Better area use can create worse load paths.

4. Local fit vs future shelf quality
- A move that looks good immediately can damage later layers by fragmenting usable shelf space.

5. Controlled overhang vs staircase artifacts
- Small overhang can help bridge shelves.
- Repeated one-direction offsets can become physically bad, so cumulative staircase drift is blocked.

## Priority Order

When goals conflict, the intended order is:

1. Safety and validity
- bounds
- collision
- max weight / max height
- support / pressure / structural / cumulative-load checks

2. Operational integrity
- wrap-friendly layer shape
- no bad edge protrusions

3. Feasibility
- minimize unpacked units

4. Efficiency
- minimize pallet count
- minimize layers
- minimize total height

5. Style preference
- `edgeAligned` vs `centerCompact`

In practice this is a guiding rule order, not a single central switch statement.
