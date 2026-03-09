import type { NormalizedSampleGuidance } from "./packerConfig";
import type { SupportInfo } from "./packerGapTypes";
import type { CartonInput, PalletPackingStyle } from "./packerTypes";
import type { LayerState, OrientationOption, Rect } from "./packerCoreTypes";

interface GapPlacementScoreArgs {
  carton: CartonInput;
  rect: Rect;
  orientation: OrientationOption;
  support: SupportInfo;
  state: LayerState;
  packingStyle: PalletPackingStyle;
  sampleGuidance: NormalizedSampleGuidance | null;
  currentLayerHeight: number;
  preferredDifferentTypeId: string | null;
  usedTypeIds: Set<string>;
  baseLayer: boolean;
  centerDist: number;
  wallDist: number;
  edgeTouch: boolean;
  contactLen: number;
  gapDist: number;
  adjacentSameFitCount: number;
  guidanceTrialNoise: (guidance: NormalizedSampleGuidance | null, token: string) => number;
}

export function scoreGapPlacementCandidate({
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
  guidanceTrialNoise,
}: GapPlacementScoreArgs): number {
  const maxPerimeter = Math.max(rect.w + rect.l, 1e-6);
  const contactNeed = Math.min(rect.w, rect.l) * 0.3;
  const isolatedWall = edgeTouch && contactLen < contactNeed;
  const deepGap = gapDist > Math.max(rect.w, rect.l) * 0.9;
  const highLayer = state.layerIndex >= 3;
  const tailBatch = carton.quantity <= 4;

  let score = 0;
  score += 320;
  score += Math.min(8, state.typeWaitById.get(carton.id) ?? 0) * 90;
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
  score += adjacentSameFitCount * (highLayer ? 210 : 150);
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
  if (!edgeTouch && adjacentSameFitCount === 0 && contactLen < contactNeed * 0.6) {
    score -= highLayer ? 180 : 110;
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
    const jitter = guidanceTrialNoise(
      sampleGuidance,
      `${state.layerIndex}|gap|${carton.id}|${orientation.w.toFixed(1)}|${orientation.l.toFixed(1)}|${orientation.h.toFixed(1)}|${rect.x.toFixed(1)}|${rect.y.toFixed(1)}`,
    );
    score += jitter * (18 * sampleGuidance.cfgScale);
  }

  return score;
}
