# Packing Constraints And Conflicts (Pallet-o-Crates)

This document separates hard constraints from soft preferences and highlights known conflicts.

## 1) Hard Constraints (must never be violated)

1. Pallet bounds:
- Each carton footprint must stay within pallet width/length.

2. No collision:
- No overlap between cartons on the same z level.
- No 3D interpenetration between cartons across layers.

3. Max pallet limits:
- Total packed weight <= `pallet.maxWeight`.
- Any carton top (`z + h`) <= `pallet.maxHeight`.

4. Support safety:
- A carton above base layer must satisfy minimum support ratio rules.
- Centroid support or stronger overlap rule must hold.
- Pressure check must pass (`pressureSafe`).

5. Structural safety:
- Heavy-on-light local block in `structuralSupportSafe`.
- A heavier carton cannot transfer too much load to one/two lighter supporters.

6. Cumulative load safety:
- Total carried load ratio limits (`cumulativeStackLoadSafe`).
- Extra cap for load coming specifically from heavier cartons above.

7. Wrap safety:
- Layer shape must pass `isWrapFriendlyLayerShape`.
- Edge protrusion guard must pass (`hasWrapBlockingEdgeProtrusion`).

## 2) Soft Preferences (optimize, but can be sacrificed)

1. Packing style:
- `edgeAligned`: prefer wall/corner coverage.
- `centerCompact`: prefer center occupancy and controlled edge setbacks.

2. Layer compactness and reduced fragmentation:
- Lower gap ratio.
- Fewer disconnected components.

3. Height minimization:
- Prefer lower total height and fewer layers where feasible.

4. Type sequencing:
- Prioritize base-critical types earlier when needed.
- Rotate types to avoid pathological tower streaks.

5. Upright policy:
- `never`, `tailOnly`, `prefer` (orientation preference, not hard feasibility by itself).

## 3) Known Conflict Zones

1. `centerCompact` vs wrap safety:
- Strong center bias can reduce wall support and increase fragile "islands".
- Wrap constraints can force center mode toward edge-like layouts.

2. Height minimization vs structural safety:
- Lower stack by forcing dense top fill can overload weak supporters below.

3. Max fill vs no-collision after transforms:
- Re-centering/transforming candidate footprints can invalidate earlier free-space assumptions.

4. Cross-type mixing vs support reliability:
- Better area utilization from mixing types may create unsafe load paths.

5. Tail optimization vs global compactness:
- Aggressive tail placement can create local holes or staircase artifacts.

## 4) Constraint Priority Order (recommended)

Use this order when constraints conflict:

1. Safety + validity:
- No collision, bounds, maxWeight/maxHeight, support/pressure/structural/cumulative load.

2. Operational integrity:
- Wrap-friendly layer shape, no wrap-blocking protrusions.

3. Feasibility:
- Minimize unpacked units.

4. Efficiency:
- Minimize layers / total height.

5. Style preference:
- `centerCompact` or `edgeAligned` characteristics.

If style preference would increase unpacked units or layers versus another valid layout, prefer feasibility/efficiency.
