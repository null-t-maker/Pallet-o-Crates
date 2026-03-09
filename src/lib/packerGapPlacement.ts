import type { CartonInput, PalletInput } from "./packerTypes";
import type { GapPlacementDeps } from "./packerGapTypes";
import type {
  GapPlacementCandidate,
  LayerState,
  Rect,
} from "./packerCoreTypes";
import {
  anchorPositions,
  lateralContactLength,
  nearestGapDistance,
} from "./packerGapHelpers";
import {
  findGapPlacementExhaustive,
  findGapPlacementExhaustiveOptions,
  findLowestHeightGapPlacement,
} from "./packerGapPlacementExhaustive";
import { countImmediateAdjacentSameFits } from "./packerGapPlacementPairing";
import { scoreGapPlacementCandidate } from "./packerGapPlacementScore";

function dedupeGapCandidates(
  candidates: GapPlacementCandidate[],
): GapPlacementCandidate[] {
  const unique = new Map<string, GapPlacementCandidate>();
  for (const candidate of candidates) {
    const key = [
      candidate.carton.id,
      candidate.rect.x,
      candidate.rect.y,
      candidate.rect.w,
      candidate.rect.l,
      candidate.orientation.h,
      candidate.orientation.upright ? "u" : "f",
    ].join("|");
    const existing = unique.get(key);
    if (!existing || candidate.score > existing.score) {
      unique.set(key, candidate);
    }
  }
  return Array.from(unique.values()).sort((a, b) => b.score - a.score);
}

function collectGapPlacementCandidates(
  pallet: PalletInput,
  rem: CartonInput[],
  state: LayerState,
  remainingWeight: number,
  blockedRects: Rect[],
  zBase: number,
  currentLayerHeight: number,
  allowUpright: boolean,
  preferredDifferentTypeId: string | null,
  usedTypeIds: Set<string>,
  heightCeil: number | null,
  deps: GapPlacementDeps,
): GapPlacementCandidate[] {
  const candidates: GapPlacementCandidate[] = [];
  const supportBounds = deps.boundsOfRects(state.prevPlacements);
  const packingStyle = deps.resolvePackingStyle(pallet);
  const sampleGuidance = deps.resolveSampleGuidance(pallet);
  const baseLayer = state.prevPlacements.length === 0;
  const anchorRects = [
    ...blockedRects,
    ...state.prevPlacements.map((placement) => ({
      x: placement.x,
      y: placement.y,
      w: placement.w,
      l: placement.l,
    })),
  ];

  for (const carton of rem) {
    if (carton.quantity <= 0) continue;
    if (carton.weight <= 0 || remainingWeight + deps.EPS < carton.weight) continue;

    const options = deps.orientationOptions(carton, deps.canUseUprightNow(carton, allowUpright));

    for (const orientation of options) {
      if (zBase + orientation.h > pallet.maxHeight + deps.EPS) continue;
      if (heightCeil !== null && orientation.h > heightCeil + 0.25) continue;

      const xs = anchorPositions(anchorRects, pallet.width, orientation.w, "x", deps);
      const ys = anchorPositions(anchorRects, pallet.length, orientation.l, "y", deps);

      for (const x of xs) {
        for (const y of ys) {
          const rect: Rect = { x, y, w: orientation.w, l: orientation.l };
          if (!deps.noCollision(rect, blockedRects)) continue;
          if (supportBounds && !deps.isWithinSupportEnvelope(rect, supportBounds)) continue;

          const support = deps.analyzeSupport(rect, state.prevPlacements);
          const supportOk = state.prevPlacements.length === 0
            || deps.hasFullSupport(support);
          if (!supportOk) continue;
          if (state.prevPlacements.length > 0 && !deps.structuralSupportSafe(carton.weight, deps.areaOf(rect), support)) {
            continue;
          }

          if (state.prevPlacements.length > 0) {
            const localPressure = support.touching <= 1
              ? (orientation.upright ? 1.85 : 2.1)
              : (orientation.upright ? 1.85 : 2.25);
            const pressure = deps.pressureSafe(carton.weight, support, localPressure);
            if (!pressure.ok) continue;
          }

          const centerX = pallet.width / 2;
          const centerY = pallet.length / 2;
          const rx = rect.x + rect.w / 2;
          const ry = rect.y + rect.l / 2;
          const centerDist = Math.hypot(rx - centerX, ry - centerY)
            / Math.max(Math.hypot(centerX, centerY), deps.EPS);
          const wallDist = deps.distanceToNearestWall(rect, pallet.width, pallet.length)
            / Math.max(Math.min(pallet.width, pallet.length) / 2, deps.EPS);
          const contactLen = lateralContactLength(rect, blockedRects, deps);
          const gapDist = nearestGapDistance(rect, blockedRects);
          const edgeTouch = deps.touchesWall(rect, pallet.width, pallet.length);
          const adjacentSameFitCount = countImmediateAdjacentSameFits({
            pallet,
            state,
            blockedRects,
            rect,
            orientation,
            weight: carton.weight,
            deps,
          });
          const score = scoreGapPlacementCandidate({
            carton,
            rect,
            orientation,
            support,
            state,
            packingStyle,
            sampleGuidance,
            currentLayerHeight,
            preferredDifferentTypeId,
            usedTypeIds,
            baseLayer,
            centerDist,
            wallDist,
            edgeTouch,
            contactLen,
            gapDist,
            adjacentSameFitCount,
            guidanceTrialNoise: deps.guidanceTrialNoise,
          });

          candidates.push({
            carton,
            rect,
            orientation,
            score,
          });
        }
      }
    }
  }

  return dedupeGapCandidates(candidates);
}

export function findGapPlacement(
  pallet: PalletInput,
  rem: CartonInput[],
  state: LayerState,
  remainingWeight: number,
  blockedRects: Rect[],
  zBase: number,
  currentLayerHeight: number,
  allowUpright: boolean,
  preferredDifferentTypeId: string | null,
  usedTypeIds: Set<string>,
  heightCeil: number | null = null,
  deps: GapPlacementDeps,
): GapPlacementCandidate | null {
  return collectGapPlacementCandidates(
    pallet,
    rem,
    state,
    remainingWeight,
    blockedRects,
    zBase,
    currentLayerHeight,
    allowUpright,
    preferredDifferentTypeId,
    usedTypeIds,
    heightCeil,
    deps,
  )[0] ?? null;
}

export function findGapPlacementOptions(
  pallet: PalletInput,
  rem: CartonInput[],
  state: LayerState,
  remainingWeight: number,
  blockedRects: Rect[],
  zBase: number,
  currentLayerHeight: number,
  allowUpright: boolean,
  preferredDifferentTypeId: string | null,
  usedTypeIds: Set<string>,
  heightCeil: number | null = null,
  maxOptions = 6,
  deps: GapPlacementDeps,
): GapPlacementCandidate[] {
  return collectGapPlacementCandidates(
    pallet,
    rem,
    state,
    remainingWeight,
    blockedRects,
    zBase,
    currentLayerHeight,
    allowUpright,
    preferredDifferentTypeId,
    usedTypeIds,
    heightCeil,
    deps,
  ).slice(0, maxOptions);
}

export {
  findGapPlacementExhaustive,
  findGapPlacementExhaustiveOptions,
  findLowestHeightGapPlacement,
};
