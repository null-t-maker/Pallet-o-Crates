import type { PalletPackingStyle } from "./packerTypes";

interface CoveragePenaltyConfigArgs {
  packingStyle: PalletPackingStyle;
  baseLayer: boolean;
  taperAllowed: boolean;
  rescue: boolean;
}

interface CoverageConstraintArgs {
  isPartial: boolean;
  taperAllowed: boolean;
  rescue: boolean;
  strict: boolean;
  centerGapStreak: number;
  centerHasCentralGap: boolean;
  largestGapRatio: number;
  relaxBaseGapLimits: boolean;
}

export interface CoveragePenaltyConfig {
  relaxBaseGapLimits: boolean;
  wallCoverageWeight: number;
  gapEmptyPenalty: number;
  largestGapPenalty: number;
}

export function minimumRequiredCorners(
  packingStyle: PalletPackingStyle,
  taperAllowed: boolean,
  rescue: boolean,
  strict: boolean,
): number {
  if (packingStyle === "centerCompact") return 0;
  if (taperAllowed || rescue) return 0;
  return strict ? 4 : 2;
}

export function buildCoveragePenaltyConfig({
  packingStyle,
  baseLayer,
  taperAllowed,
  rescue,
}: CoveragePenaltyConfigArgs): CoveragePenaltyConfig {
  const relaxBaseGapLimits = packingStyle === "centerCompact" && baseLayer;
  const wallCoverageWeight = packingStyle === "centerCompact" && baseLayer
    ? (taperAllowed || rescue ? 70 : 110)
    : (taperAllowed || rescue ? 170 : 320);
  const gapEmptyPenalty = packingStyle === "centerCompact" && baseLayer ? 80 : 220;
  const largestGapPenalty = packingStyle === "centerCompact" && baseLayer
    ? (taperAllowed || rescue ? 90 : 130)
    : (taperAllowed || rescue ? 280 : 760);
  return {
    relaxBaseGapLimits,
    wallCoverageWeight,
    gapEmptyPenalty,
    largestGapPenalty,
  };
}

export function violatesCoverageConstraints({
  isPartial,
  taperAllowed,
  rescue,
  strict,
  centerGapStreak,
  centerHasCentralGap,
  largestGapRatio,
  relaxBaseGapLimits,
}: CoverageConstraintArgs): boolean {
  if (isPartial) return false;

  if (!taperAllowed && !rescue) {
    if (!relaxBaseGapLimits) {
      if (strict && largestGapRatio > 0.24) return true;
      if (!strict && largestGapRatio > 0.35) return true;
    } else if (strict && largestGapRatio > 0.7) {
      return true;
    }
  }

  return !relaxBaseGapLimits
    && !rescue
    && strict
    && centerGapStreak >= 2
    && centerHasCentralGap;
}
