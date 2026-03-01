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
  findLowestHeightGapPlacement,
} from "./packerGapPlacementExhaustive";
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
  let best: GapPlacementCandidate | null = null;
  const supportBounds = deps.boundsOfRects(state.prevPlacements);
  const packingStyle = deps.resolvePackingStyle(pallet);
  const sampleGuidance = deps.resolveSampleGuidance(pallet);
  const baseLayer = state.prevPlacements.length === 0;

  for (const carton of rem) {
    if (carton.quantity <= 0) continue;
    if (carton.weight <= 0 || remainingWeight + deps.EPS < carton.weight) continue;

    const waitLayers = state.typeWaitById.get(carton.id) ?? 0;
    const options = deps.orientationOptions(carton, deps.canUseUprightNow(carton, allowUpright));

    for (const orientation of options) {
      if (zBase + orientation.h > pallet.maxHeight + deps.EPS) continue;
      if (heightCeil !== null && orientation.h > heightCeil + 0.25) continue;

      const xs = anchorPositions(blockedRects, pallet.width, orientation.w, "x", deps);
      const ys = anchorPositions(blockedRects, pallet.length, orientation.l, "y", deps);

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
          const maxPerimeter = Math.max(rect.w + rect.l, deps.EPS);
          const edgeTouch = deps.touchesWall(rect, pallet.width, pallet.length);
          const contactNeed = Math.min(rect.w, rect.l) * 0.3;
          const isolatedWall = edgeTouch && contactLen < contactNeed;
          const deepGap = gapDist > Math.max(rect.w, rect.l) * 0.9;
          const highLayer = state.layerIndex >= 3;
          const tailBatch = carton.quantity <= 4;

          let score = 0;
          score += 320;
          score += Math.min(8, waitLayers) * 90;
          score += support.ratio * 150;
          const bondLikeSupport = support.touching >= 2
            && support.maxOverlapRatio >= 0.26
            && support.maxOverlapRatio <= 0.84;
          if (state.prevPlacements.length > 0) {
            score += bondLikeSupport ? 180 : 0;
            if (!bondLikeSupport && support.touching <= 1) score -= 140;
          }
          if (packingStyle === "centerCompact") {
            const centerBoost = baseLayer
              ? (state.centerGapStreak > 0 ? 220 : 175)
              : (highLayer || tailBatch ? 260 : 210);
            const wallPenalty = baseLayer ? 120 : (highLayer ? 150 : 115);
            score += (1 - centerDist) * centerBoost;
            score -= (1 - wallDist) * wallPenalty;
          } else {
            score += state.centerGapStreak > 0 ? (1 - centerDist) * 190 : (1 - wallDist) * 95;
          }
          score += (contactLen / maxPerimeter) * 210;
          score -= gapDist * 0.55;
          score += usedTypeIds.has(carton.id) ? -35 : 55;
          if (orientation.upright) {
            score += currentLayerHeight > 0 && orientation.h <= currentLayerHeight + 0.25 ? 60 : -40;
          } else {
            score += 20;
          }
          score -= orientation.h * (state.layerIndex > 2 ? 1.1 : 0.65);

          if (isolatedWall) {
            score -= 220;
          }
          if (highLayer && isolatedWall) score -= 180;
          if (highLayer && isolatedWall && deepGap) score -= 260;
          if (highLayer || tailBatch) {
            score += (1 - centerDist) * 140;
            score -= (1 - wallDist) * 90;
          }

          if (preferredDifferentTypeId) {
            score += carton.id === preferredDifferentTypeId ? -190 : 95;
          }

          if (currentLayerHeight > 0) {
            if (orientation.h > currentLayerHeight + 0.25) {
              score -= (orientation.h - currentLayerHeight) * (state.layerIndex > 1 ? 4.2 : 2.4);
            } else {
              score += 40;
            }
          }

          if (sampleGuidance) {
            const guidanceWeight = 260 * sampleGuidance.confidence * sampleGuidance.cfgScale;
            if (sampleGuidance.preferredMode === "center") {
              score += (1 - centerDist) * guidanceWeight;
              score -= (1 - wallDist) * (guidanceWeight * 0.55);
            } else {
              score += (1 - wallDist) * guidanceWeight;
              score -= (1 - centerDist) * (guidanceWeight * 0.45);
            }
            const jitter = deps.guidanceTrialNoise(
              sampleGuidance,
              `${state.layerIndex}|gap|${carton.id}|${orientation.w.toFixed(1)}|${orientation.l.toFixed(1)}|${orientation.h.toFixed(1)}|${rect.x.toFixed(1)}|${rect.y.toFixed(1)}`,
            );
            score += jitter * (18 * sampleGuidance.cfgScale);
          }

          if (!best || score > best.score) {
            best = {
              carton,
              rect,
              orientation,
              score,
            };
          }
        }
      }
    }
  }

  return best;
}

export { findGapPlacementExhaustive, findLowestHeightGapPlacement };
