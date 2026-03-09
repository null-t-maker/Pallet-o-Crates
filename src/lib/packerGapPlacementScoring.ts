import type { CartonInput, PalletInput } from "./packerTypes";
import type { GapPlacementCandidate, LayerState, Rect } from "./packerCoreTypes";
import type { GapPlacementDeps } from "./packerGapTypes";
import { lateralContactLength, nearestGapDistance } from "./packerGapHelpers";

type SupportInfo = ReturnType<GapPlacementDeps["analyzeSupport"]>;

interface ScoreGapPlacementArgs {
  pallet: PalletInput;
  carton: CartonInput;
  state: LayerState;
  rect: Rect;
  orientation: GapPlacementCandidate["orientation"];
  blockedRects: Rect[];
  currentLayerHeight: number;
  preferredDifferentTypeId: string | null;
  usedTypeIds: Set<string>;
  support: SupportInfo;
  packingStyle: ReturnType<GapPlacementDeps["resolvePackingStyle"]>;
  sampleGuidance: ReturnType<GapPlacementDeps["resolveSampleGuidance"]>;
  adjacentSameFitCount: number;
  deps: GapPlacementDeps;
}

export function scoreGapPlacement({
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
  adjacentSameFitCount,
  deps,
}: ScoreGapPlacementArgs): number {
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
  const baseLayer = state.prevPlacements.length === 0;
  const waitLayers = state.typeWaitById.get(carton.id) ?? 0;

  let score = 0;
  score += 300;
  score += Math.min(8, waitLayers) * 90;
  score += support.ratio * 140;
  const bondLikeSupport = support.touching >= 2
    && support.maxOverlapRatio >= 0.26
    && support.maxOverlapRatio <= 0.84;
  if (state.prevPlacements.length > 0) {
    score += bondLikeSupport ? 180 : 0;
    if (!bondLikeSupport && support.touching <= 1) score -= 140;
  }
  if (packingStyle === "centerCompact") {
    const centerBoost = baseLayer
      ? (state.centerGapStreak > 0 ? 235 : 185)
      : (highLayer || tailBatch ? 280 : 225);
    const wallPenalty = baseLayer ? 130 : (highLayer ? 165 : 125);
    score += (1 - centerDist) * centerBoost;
    score -= (1 - wallDist) * wallPenalty;
  } else {
    score += state.centerGapStreak > 0 ? (1 - centerDist) * 210 : (1 - wallDist) * 100;
  }
  score += (contactLen / maxPerimeter) * 230;
  score += adjacentSameFitCount * (highLayer ? 220 : 160);
  score -= gapDist * 0.6;
  score += usedTypeIds.has(carton.id) ? -30 : 55;
  if (orientation.upright) {
    score += currentLayerHeight > 0 && orientation.h <= currentLayerHeight + 0.25 ? 65 : -35;
  } else {
    score += 20;
  }
  score -= orientation.h * (state.layerIndex > 2 ? 1.15 : 0.68);

  if (isolatedWall) {
    score -= 240;
  }
  if (!edgeTouch && adjacentSameFitCount === 0 && contactLen < contactNeed * 0.6) {
    score -= highLayer ? 190 : 120;
  }
  if (highLayer && isolatedWall) score -= 210;
  if (highLayer && isolatedWall && deepGap) score -= 280;
  if (highLayer || tailBatch) {
    score += (1 - centerDist) * 150;
    score -= (1 - wallDist) * 100;
  }

  if (preferredDifferentTypeId) {
    score += carton.id === preferredDifferentTypeId ? -180 : 95;
  }

  if (currentLayerHeight > 0) {
    if (orientation.h > currentLayerHeight + 0.25) {
      score -= (orientation.h - currentLayerHeight) * (state.layerIndex > 1 ? 4.6 : 2.6);
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
      `${state.layerIndex}|gapx|${carton.id}|${orientation.w.toFixed(1)}|${orientation.l.toFixed(1)}|${orientation.h.toFixed(1)}|${rect.x.toFixed(1)}|${rect.y.toFixed(1)}`,
    );
    score += jitter * (18 * sampleGuidance.cfgScale);
  }

  return score;
}
