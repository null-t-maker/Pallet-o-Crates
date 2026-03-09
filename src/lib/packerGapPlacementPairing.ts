import type { LayerState, Rect } from "./packerCoreTypes";
import type { GapPlacementCandidate } from "./packerCoreTypes";
import type { PalletInput } from "./packerTypes";
import type { GapPlacementDeps } from "./packerGapTypes";

interface CountImmediateAdjacentSameFitsArgs {
  pallet: PalletInput;
  state: LayerState;
  blockedRects: Rect[];
  rect: Rect;
  orientation: GapPlacementCandidate["orientation"];
  weight: number;
  deps: GapPlacementDeps;
}

export function countImmediateAdjacentSameFits({
  pallet,
  state,
  blockedRects,
  rect,
  orientation,
  weight,
  deps,
}: CountImmediateAdjacentSameFitsArgs): number {
  const occupied = [...blockedRects, rect];
  const supportBounds = deps.boundsOfRects(state.prevPlacements);
  const candidates: Rect[] = [
    { x: rect.x - orientation.w, y: rect.y, w: orientation.w, l: orientation.l },
    { x: rect.x + rect.w, y: rect.y, w: orientation.w, l: orientation.l },
    { x: rect.x, y: rect.y - orientation.l, w: orientation.w, l: orientation.l },
    { x: rect.x, y: rect.y + rect.l, w: orientation.w, l: orientation.l },
  ];

  let count = 0;
  for (const candidate of candidates) {
    if (candidate.x < -deps.EPS || candidate.y < -deps.EPS) continue;
    if (candidate.x + candidate.w > pallet.width + deps.EPS) continue;
    if (candidate.y + candidate.l > pallet.length + deps.EPS) continue;
    if (!deps.noCollision(candidate, occupied)) continue;
    if (supportBounds && !deps.isWithinSupportEnvelope(candidate, supportBounds)) continue;

    if (state.prevPlacements.length > 0) {
      const support = deps.analyzeSupport(candidate, state.prevPlacements);
      if (!deps.hasFullSupport(support)) continue;
      if (!deps.structuralSupportSafe(weight, deps.areaOf(candidate), support)) continue;
      const localPressure = support.touching <= 1
        ? (orientation.upright ? 1.85 : 2.1)
        : (orientation.upright ? 1.85 : 2.25);
      if (!deps.pressureSafe(weight, support, localPressure).ok) continue;
    }

    count += 1;
  }

  return count;
}
