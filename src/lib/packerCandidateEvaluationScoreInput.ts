import type { LayerState, Rect, SelectionMode } from "./packerCoreTypes";
import type { CandidateScoreInputs } from "./packerCandidateScore";
import type { CandidateEvaluationDerivedStats } from "./packerCandidateEvaluationDerived";
import type { CoveragePenaltyConfig } from "./packerCandidateEvaluationCoverage";
import type { SupportAnalysisResult } from "./packerCandidateEvaluationSupport";
import type { EvaluateCandidateDeps } from "./packerCandidateEvaluationTypes";
import type { CartonInput, PalletPackingStyle } from "./packerTypes";

interface BuildCandidateScoreInputArgs {
  rects: Rect[];
  mode: SelectionMode;
  carton: CartonInput;
  state: LayerState;
  layoutHash: string;
  packingStyle: PalletPackingStyle;
  uniformStackMode: boolean;
  remainingTotalAfterPlacement: number;
  cornerCount: number;
  support: SupportAnalysisResult;
  coverageConfig: CoveragePenaltyConfig;
  derived: CandidateEvaluationDerivedStats;
  deps: EvaluateCandidateDeps;
}

export function buildCandidateScoreInput({
  rects,
  mode,
  carton,
  state,
  layoutHash,
  packingStyle,
  uniformStackMode,
  remainingTotalAfterPlacement,
  cornerCount,
  support,
  coverageConfig,
  derived,
  deps,
}: BuildCandidateScoreInputArgs): CandidateScoreInputs {
  return {
    rectCount: rects.length,
    cornerCount,
    taperAllowed: derived.taperAllowed,
    rescue: derived.rescue,
    wallCoverageWeight: coverageConfig.wallCoverageWeight,
    wallsCoverage: derived.walls.coverage,
    wallsBalance: derived.walls.balance,
    wallsSegments: derived.walls.segments,
    gapsEmptyRatio: derived.gaps.emptyRatio,
    gapEmptyPenalty: coverageConfig.gapEmptyPenalty,
    gapsLargestGapRatio: derived.gaps.largestGapRatio,
    largestGapPenalty: coverageConfig.largestGapPenalty,
    avgSupport: support.avgSupport,
    lowSupportCount: support.lowSupportCount,
    crossBondCount: support.crossBondCount,
    baseLayer: derived.baseLayer,
    exactAlignedCount: support.exactAlignedCount,
    uniformStackMode,
    alignmentRatio: support.alignmentRatio,
    hasMeaningfulCrossBond: support.hasMeaningfulCrossBond,
    stronglyColumnLikeLayer: support.stronglyColumnLikeLayer,
    packingStyle,
    towerPenalty: support.towerPenalty,
    pressureMarginSum: support.pressureMarginSum,
    shapeCompactness: derived.shapeCompactness,
    fillRatio: derived.fillRatio,
    boundsAreaRatio: derived.boundsAreaRatio,
    isPartial: derived.isPartial,
    componentCount: derived.componentCount,
    finalBatchFragmentPenalty: derived.finalBatchFragmentPenalty,
    centerOccupancy: derived.center.occupancy,
    centerAxisCoverage: derived.center.axisCoverage,
    centerHasGap: derived.center.hasCentralGap,
    centerGapStreak: state.centerGapStreak,
    mode,
    insetsMin: derived.insets.min,
    insetsMax: derived.insets.max,
    hasControlledSetback: derived.hasControlledSetback,
    maxRecommendedEdgeSetback: deps.MAX_RECOMMENDED_EDGE_SETBACK_MM,
    lineComplexity: derived.lineComplexity,
    footprintVariants: derived.footprintVariants,
    layerIndex: state.layerIndex,
    nearTail: derived.nearTail,
    remainingTotalAfterPlacement,
    prevCenterOccupancy: state.prevCenterOccupancy,
    prevWallCoverage: state.prevWallCoverage,
    sameTypeAsPrev: state.prevLayerTypeId === carton.id,
    sameLayoutAsPrev: layoutHash === state.prevHash,
    mirroredLayoutAsPrev: state.prevMirrorHashes.has(layoutHash),
    cartonHeight: carton.height,
    density: derived.density,
  };
}
