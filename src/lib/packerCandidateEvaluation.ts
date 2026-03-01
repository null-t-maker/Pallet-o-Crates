import type { CartonInput, PalletInput, PalletPackingStyle } from "./packerTypes";
import type {
  EvaluationProfile,
  LayerState,
  Rect,
  SelectionMode,
} from "./packerCoreTypes";
import { computeCandidateScore } from "./packerCandidateScore";
import { analyzeSupportAndTower } from "./packerCandidateEvaluationSupport";
import type { EvaluateCandidateDeps, EvaluationResult } from "./packerCandidateEvaluationTypes";

export type { EvaluateCandidateDeps, EvaluationResult } from "./packerCandidateEvaluationTypes";

export function evaluateCandidate(
  pallet: PalletInput,
  carton: CartonInput,
  rects: Rect[],
  fullCapacity: number,
  mode: SelectionMode,
  state: LayerState,
  profile: EvaluationProfile,
  remainingSameType: number,
  remainingTotalAfterPlacement: number,
  uniformStackMode: boolean,
  packingStyle: PalletPackingStyle,
  deps: EvaluateCandidateDeps,
): EvaluationResult {
  if (rects.length === 0) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash: "" };

  const isPartial = rects.length < fullCapacity;
  const layoutHash = deps.hashRects(rects);
  const layerBounds = deps.boundsOfRects(rects);
  if (!layerBounds) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
  const supportBounds = deps.boundsOfRects(state.prevPlacements);
  if (supportBounds && !deps.isWithinSupportEnvelope(layerBounds, supportBounds)) {
    return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
  }
  if (deps.hasWrapBlockingEdgeProtrusion(rects, pallet.width, pallet.length)) {
    return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
  }

  const density = carton.weight / Math.max(carton.width * carton.length, deps.EPS);
  const center = deps.centerStats(rects, pallet.width, pallet.length);
  const fillRatio = deps.layerFillRatio(rects);
  const componentCount = deps.connectedComponentCount(rects);
  const uniqueX = new Set(rects.map((r) => r.x.toFixed(2))).size;
  const uniqueY = new Set(rects.map((r) => r.y.toFixed(2))).size;
  const lineComplexity = uniqueX + uniqueY;
  const footprintVariants = new Set(rects.map((r) => `${r.w.toFixed(2)}x${r.l.toFixed(2)}`)).size;
  const boundsAreaRatio = deps.areaOf(layerBounds) / Math.max(pallet.width * pallet.length, deps.EPS);
  const insets = deps.insetsFromBounds(layerBounds, pallet.width, pallet.length);
  const hasControlledSetback = insets.min >= deps.PREFERRED_MIN_EDGE_SETBACK_MM
    && insets.max <= deps.MAX_RECOMMENDED_EDGE_SETBACK_MM;
  const nearTail = remainingSameType <= fullCapacity;
  const baseLayer = state.prevPlacements.length === 0;
  const finalBatchAtBase = state.prevPlacements.length === 0
    && remainingTotalAfterPlacement <= 0
    && isPartial;
  const finalBatchFragmentPenalty = finalBatchAtBase ? Math.max(0, componentCount - 1) * 950 : 0;
  const countShrink = state.prevPlacements.length > 0 && rects.length <= state.prevPlacements.length * 0.9;
  const taperAllowed = state.layerIndex >= 2
    && (isPartial || mode !== "edge" || state.centerGapStreak >= 1 || nearTail || countShrink);

  const strict = profile === "strict";
  const rescue = profile === "rescue";
  const pressureFactor = strict ? 1.45 : (rescue ? 2.25 : 1.75);

  const support = analyzeSupportAndTower(
    rects,
    state,
    carton,
    nearTail,
    rescue,
    uniformStackMode,
    pressureFactor,
    deps,
  );
  if (!support) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };

  const cornerCount = deps.cornerCoverage(rects, pallet.width, pallet.length);
  if (!isPartial) {
    const minCorners = packingStyle === "centerCompact"
      ? 0
      : (taperAllowed || rescue ? 0 : (strict ? 4 : 2));
    if (cornerCount < minCorners) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
  }

  const walls = deps.wallStats(rects, pallet.width, pallet.length);
  const gaps = deps.estimateGapStats(rects, pallet.width, pallet.length);
  const relaxBaseGapLimits = packingStyle === "centerCompact" && baseLayer;
  const wallCoverageWeight = packingStyle === "centerCompact" && baseLayer
    ? (taperAllowed || rescue ? 70 : 110)
    : (taperAllowed || rescue ? 170 : 320);
  const gapEmptyPenalty = packingStyle === "centerCompact" && baseLayer ? 80 : 220;
  const largestGapPenalty = packingStyle === "centerCompact" && baseLayer
    ? (taperAllowed || rescue ? 90 : 130)
    : (taperAllowed || rescue ? 280 : 760);
  if (!isPartial) {
    if (!taperAllowed && !rescue) {
      if (!relaxBaseGapLimits) {
        if (strict && gaps.largestGapRatio > 0.24) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
        if (!strict && gaps.largestGapRatio > 0.35) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
      } else {
        if (strict && gaps.largestGapRatio > 0.7) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
      }
    }

    if (!relaxBaseGapLimits && !rescue && strict && state.centerGapStreak >= 2 && center.hasCentralGap) {
      return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
    }
  }

  const shapeCompactness = deps.compactness(rects, pallet.width, pallet.length, mode);
  const score = computeCandidateScore({
    rectCount: rects.length,
    cornerCount,
    taperAllowed,
    rescue,
    wallCoverageWeight,
    wallsCoverage: walls.coverage,
    wallsBalance: walls.balance,
    wallsSegments: walls.segments,
    gapsEmptyRatio: gaps.emptyRatio,
    gapEmptyPenalty,
    gapsLargestGapRatio: gaps.largestGapRatio,
    largestGapPenalty,
    avgSupport: support.avgSupport,
    lowSupportCount: support.lowSupportCount,
    crossBondCount: support.crossBondCount,
    baseLayer,
    exactAlignedCount: support.exactAlignedCount,
    uniformStackMode,
    alignmentRatio: support.alignmentRatio,
    hasMeaningfulCrossBond: support.hasMeaningfulCrossBond,
    stronglyColumnLikeLayer: support.stronglyColumnLikeLayer,
    packingStyle,
    towerPenalty: support.towerPenalty,
    pressureMarginSum: support.pressureMarginSum,
    shapeCompactness,
    fillRatio,
    boundsAreaRatio,
    isPartial,
    componentCount,
    finalBatchFragmentPenalty,
    centerOccupancy: center.occupancy,
    centerAxisCoverage: center.axisCoverage,
    centerHasGap: center.hasCentralGap,
    centerGapStreak: state.centerGapStreak,
    mode,
    insetsMin: insets.min,
    insetsMax: insets.max,
    hasControlledSetback,
    maxRecommendedEdgeSetback: deps.MAX_RECOMMENDED_EDGE_SETBACK_MM,
    lineComplexity,
    footprintVariants,
    layerIndex: state.layerIndex,
    nearTail,
    remainingTotalAfterPlacement,
    prevCenterOccupancy: state.prevCenterOccupancy,
    prevWallCoverage: state.prevWallCoverage,
    sameTypeAsPrev: state.prevLayerTypeId === carton.id,
    sameLayoutAsPrev: layoutHash === state.prevHash,
    mirroredLayoutAsPrev: state.prevMirrorHashes.has(layoutHash),
    cartonHeight: carton.height,
    density,
  });

  return {
    valid: Number.isFinite(score),
    score,
    layoutHash,
  };
}
