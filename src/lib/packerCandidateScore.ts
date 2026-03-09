import type { CandidateScoreInputs } from "./packerCandidateScoreTypes";
import { applyPackingStyleScoreAdjustments } from "./packerCandidateScorePackingStyle";

export type { CandidateScoreInputs } from "./packerCandidateScoreTypes";

export function computeCandidateScore(input: CandidateScoreInputs): number {
  let score = 0;
  const futureLayersLikely = input.baseLayer && input.remainingTotalAfterPlacement > 0;
  score += input.rectCount * 1000;
  score += input.cornerCount * (input.taperAllowed || input.rescue ? 45 : 140);
  score += input.wallsCoverage * input.wallCoverageWeight;
  score += input.wallsBalance * 180;
  score -= input.wallsSegments * 16;
  score -= input.gapsEmptyRatio * input.gapEmptyPenalty;
  score -= input.gapsLargestGapRatio * input.largestGapPenalty;
  score += input.avgSupport * 220;
  score -= input.lowSupportCount * 80;
  score += input.crossBondCount * (input.baseLayer ? 90 : 320);
  score -= input.exactAlignedCount * (input.uniformStackMode ? 8 : (input.baseLayer ? 150 : 360));
  if (!input.baseLayer && !input.uniformStackMode) {
    score -= input.alignmentRatio * 1400;
    if (input.hasMeaningfulCrossBond) score += 220;
    // Prefer interlocked layers first, but still allow fallback to column-like layers
    // when no bonded alternative can satisfy limits.
    if (input.stronglyColumnLikeLayer) {
      score -= input.packingStyle === "centerCompact" ? 1500 : 2200;
    }
  }
  score -= input.towerPenalty * (input.uniformStackMode ? 0 : 130);
  score += input.pressureMarginSum * 60;
  score += input.shapeCompactness * 220;
  score += input.fillRatio * (input.packingStyle === "centerCompact" && input.baseLayer ? 450 : 180);
  score -= Math.max(0, 0.6 - input.fillRatio) * 380;
  score -= input.boundsAreaRatio * (input.packingStyle === "centerCompact" && input.baseLayer ? 520 : 110);
  if (input.isPartial) {
    score -= Math.max(0, input.componentCount - 1) * (input.baseLayer ? 220 : 90);
  }
  score -= input.finalBatchFragmentPenalty;
  score += input.centerOccupancy * (input.centerGapStreak > 0 ? 520 : 220);
  score += input.centerAxisCoverage * (input.centerGapStreak > 0 ? 340 : 120);

  if (
    futureLayersLikely
    && !input.isPartial
    && !input.uniformStackMode
  ) {
    // The base layer has no lower layer, so classic cross-bond metrics cannot reward it yet.
    // Add a light preference for mixed-footprint full layers when another layer is definitely
    // coming, which encourages interlocking to start from layer 1 instead of layer 2.
    // Keep the centerCompact bonus slightly lighter so it still preserves its tighter footprint bias.
    const footprintVariantBonus = input.packingStyle === "centerCompact" ? 180 : 220;
    const lineComplexityBonus = input.packingStyle === "centerCompact" ? 10 : 12;
    score += Math.max(0, input.footprintVariants - 1) * footprintVariantBonus;
    score += Math.max(0, input.lineComplexity - 8) * lineComplexityBonus;
  }

  score = applyPackingStyleScoreAdjustments(score, input);

  if (input.layerIndex >= 1 && input.hasControlledSetback) {
    score += 140;
  }
  if (input.layerIndex >= 1 && !input.nearTail && !input.rescue && input.insetsMax > input.maxRecommendedEdgeSetback) {
    score -= (input.insetsMax - input.maxRecommendedEdgeSetback) * 2.1;
  }

  if (input.centerHasGap) {
    score -= input.centerGapStreak > 0
      ? (320 + input.centerGapStreak * 130)
      : 120;
  } else if (input.centerGapStreak > 0) {
    score += 220;
  }

  if (input.centerOccupancy > input.prevCenterOccupancy + 0.08) score += 140;
  if (input.centerGapStreak > 0 && input.centerOccupancy < input.prevCenterOccupancy - 0.05) score -= 160;

  if (input.sameTypeAsPrev) {
    if (!input.uniformStackMode && input.sameLayoutAsPrev) score -= 360;
    if (input.mirroredLayoutAsPrev) score += input.uniformStackMode ? 160 : 240;
  }

  if (!input.isPartial && (input.taperAllowed || input.rescue) && input.mode !== "edge") {
    score += 130;
  }

  if (input.uniformStackMode && input.isPartial && !input.nearTail) {
    score -= 1000;
  }

  if (input.isPartial) {
    if (input.mode === "pin") {
      score += input.centerGapStreak > 0 ? 260 : 140;
    } else if (input.mode === "center") {
      score += input.nearTail ? 180 : (input.rescue ? 150 : 120);
    } else {
      score += input.prevWallCoverage < 0.58 ? 120 : (input.rescue ? 80 : 35);
    }
  }

  if (input.rescue) {
    score += input.rectCount * 220;
    if (input.mode === "pin" && input.rectCount <= 6) score += 180;
    if (input.mode === "edge" && input.prevWallCoverage < 0.45) score += 110;
  }

  if (input.layerIndex >= 3 && input.nearTail && input.remainingTotalAfterPlacement <= 18) {
    score -= input.gapsLargestGapRatio * 220;
    if (input.centerHasGap) score -= 80;
    score += input.centerOccupancy * 80;
  }

  if (input.uniformStackMode && !input.nearTail && input.mode !== "edge") {
    score -= 260;
  }

  // Shipping preference: keep resulting pallet as low as feasible.
  score -= input.cartonHeight * (input.layerIndex > 2 ? 2.6 : 1.1);

  // Slight preference for heavier areal density at the base.
  score += input.density * 4_000_000;

  return score;
}
