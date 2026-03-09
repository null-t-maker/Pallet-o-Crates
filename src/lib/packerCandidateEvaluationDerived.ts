import type {
  EvaluationProfile,
  LayerState,
  Rect,
  SelectionMode,
} from "./packerCoreTypes";
import type { EvaluateCandidateDeps } from "./packerCandidateEvaluationTypes";
import type { CartonInput, PalletInput } from "./packerTypes";

interface DeriveCandidateEvaluationStatsArgs {
  pallet: PalletInput;
  carton: CartonInput;
  rects: Rect[];
  layerBounds: Rect;
  fullCapacity: number;
  mode: SelectionMode;
  state: LayerState;
  profile: EvaluationProfile;
  remainingSameType: number;
  remainingTotalAfterPlacement: number;
  deps: EvaluateCandidateDeps;
}

export interface CandidateEvaluationDerivedStats {
  isPartial: boolean;
  density: number;
  center: ReturnType<EvaluateCandidateDeps["centerStats"]>;
  walls: ReturnType<EvaluateCandidateDeps["wallStats"]>;
  gaps: ReturnType<EvaluateCandidateDeps["estimateGapStats"]>;
  shapeCompactness: number;
  fillRatio: number;
  componentCount: number;
  lineComplexity: number;
  footprintVariants: number;
  boundsAreaRatio: number;
  insets: ReturnType<EvaluateCandidateDeps["insetsFromBounds"]>;
  hasControlledSetback: boolean;
  nearTail: boolean;
  baseLayer: boolean;
  finalBatchFragmentPenalty: number;
  taperAllowed: boolean;
  strict: boolean;
  rescue: boolean;
  pressureFactor: number;
}

export function deriveCandidateEvaluationStats({
  pallet,
  carton,
  rects,
  layerBounds,
  fullCapacity,
  mode,
  state,
  profile,
  remainingSameType,
  remainingTotalAfterPlacement,
  deps,
}: DeriveCandidateEvaluationStatsArgs): CandidateEvaluationDerivedStats {
  const isPartial = rects.length < fullCapacity;
  const density = carton.weight / Math.max(carton.width * carton.length, deps.EPS);
  const center = deps.centerStats(rects, pallet.width, pallet.length);
  const walls = deps.wallStats(rects, pallet.width, pallet.length);
  const gaps = deps.estimateGapStats(rects, pallet.width, pallet.length);
  const shapeCompactness = deps.compactness(rects, pallet.width, pallet.length, mode);
  const fillRatio = deps.layerFillRatio(rects);
  const componentCount = deps.connectedComponentCount(rects);
  const uniqueX = new Set(rects.map((rect) => rect.x.toFixed(2))).size;
  const uniqueY = new Set(rects.map((rect) => rect.y.toFixed(2))).size;
  const lineComplexity = uniqueX + uniqueY;
  const footprintVariants = new Set(rects.map((rect) => `${rect.w.toFixed(2)}x${rect.l.toFixed(2)}`)).size;
  const boundsAreaRatio = deps.areaOf(layerBounds) / Math.max(pallet.width * pallet.length, deps.EPS);
  const insets = deps.insetsFromBounds(layerBounds, pallet.width, pallet.length);
  const hasControlledSetback = insets.min >= deps.PREFERRED_MIN_EDGE_SETBACK_MM
    && insets.max <= deps.MAX_RECOMMENDED_EDGE_SETBACK_MM;
  const nearTail = remainingSameType <= fullCapacity;
  const baseLayer = state.prevPlacements.length === 0;
  const finalBatchAtBase = baseLayer
    && remainingTotalAfterPlacement <= 0
    && isPartial;
  const finalBatchFragmentPenalty = finalBatchAtBase ? Math.max(0, componentCount - 1) * 950 : 0;
  const countShrink = state.prevPlacements.length > 0 && rects.length <= state.prevPlacements.length * 0.9;
  const taperAllowed = state.layerIndex >= 2
    && (isPartial || mode !== "edge" || state.centerGapStreak >= 1 || nearTail || countShrink);

  const strict = profile === "strict";
  const rescue = profile === "rescue";
  const pressureFactor = strict ? 1.45 : (rescue ? 2.25 : 1.75);

  return {
    isPartial,
    density,
    center,
    walls,
    gaps,
    shapeCompactness,
    fillRatio,
    componentCount,
    lineComplexity,
    footprintVariants,
    boundsAreaRatio,
    insets,
    hasControlledSetback,
    nearTail,
    baseLayer,
    finalBatchFragmentPenalty,
    taperAllowed,
    strict,
    rescue,
    pressureFactor,
  };
}
