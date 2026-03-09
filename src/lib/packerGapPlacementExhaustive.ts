import type { CartonInput, PalletInput } from "./packerTypes";
import type {
  GapPlacementCandidate,
  LayerState,
  Rect,
} from "./packerCoreTypes";
import type { GapPlacementDeps } from "./packerGapTypes";
import {
  anchorPositions,
  exhaustiveAxisPositions,
  heightLevelsForGapPlacement,
} from "./packerGapHelpers";
import { countImmediateAdjacentSameFits } from "./packerGapPlacementPairing";
import { scoreGapPlacement } from "./packerGapPlacementScoring";

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

function collectGapPlacementExhaustiveCandidates(
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
      const xs = Array.from(new Set([
        ...exhaustiveAxisPositions(pallet.width, orientation.w, deps),
        ...anchorPositions(anchorRects, pallet.width, orientation.w, "x", deps),
      ])).sort((a, b) => a - b);
      const ys = Array.from(new Set([
        ...exhaustiveAxisPositions(pallet.length, orientation.l, deps),
        ...anchorPositions(anchorRects, pallet.length, orientation.l, "y", deps),
      ])).sort((a, b) => a - b);

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

          const score = scoreGapPlacement({
            pallet,
            carton,
            state,
            rect,
            orientation,
            blockedRects,
            currentLayerHeight,
            preferredDifferentTypeId,
            usedTypeIds,
            support,
            packingStyle,
            sampleGuidance,
            adjacentSameFitCount: countImmediateAdjacentSameFits({
              pallet,
              state,
              blockedRects,
              rect,
              orientation,
              weight: carton.weight,
              deps,
            }),
            deps,
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

export function findGapPlacementExhaustive(
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
  return collectGapPlacementExhaustiveCandidates(
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

export function findGapPlacementExhaustiveOptions(
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
  return collectGapPlacementExhaustiveCandidates(
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

export function findLowestHeightGapPlacement(
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
  minHeightExclusive = Number.NEGATIVE_INFINITY,
  deps: GapPlacementDeps,
): GapPlacementCandidate | null {
  const levels = heightLevelsForGapPlacement(
    pallet,
    rem,
    zBase,
    allowUpright,
    minHeightExclusive,
    deps,
  );

  for (const height of levels) {
    const candidate = findGapPlacementExhaustive(
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
      height,
      deps,
    );
    if (candidate && candidate.orientation.h > minHeightExclusive + 0.25) {
      return candidate;
    }
  }

  return null;
}
