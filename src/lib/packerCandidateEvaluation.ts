import type { CartonInput, PalletInput, PalletPackingStyle } from "./packerTypes";
import type {
  EvaluationProfile,
  LayerState,
  Rect,
  SelectionMode,
} from "./packerCoreTypes";
import { computeCandidateScore } from "./packerCandidateScore";
import { analyzeSupportAndTower } from "./packerCandidateEvaluationSupport";
import {
  buildCoveragePenaltyConfig,
  minimumRequiredCorners,
  violatesCoverageConstraints,
} from "./packerCandidateEvaluationCoverage";
import { deriveCandidateEvaluationStats } from "./packerCandidateEvaluationDerived";
import { resolveCandidateLayerBounds } from "./packerCandidateEvaluationLayout";
import { buildCandidateScoreInput } from "./packerCandidateEvaluationScoreInput";
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

  const layoutHash = deps.hashRects(rects);
  const layerBounds = resolveCandidateLayerBounds(rects, state, pallet, deps);
  if (!layerBounds) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
  const derived = deriveCandidateEvaluationStats({
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
  });

  const support = analyzeSupportAndTower(
    rects,
    state,
    carton,
    derived.nearTail,
    derived.rescue,
    uniformStackMode,
    derived.pressureFactor,
    deps,
  );
  if (!support) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };

  const cornerCount = deps.cornerCoverage(rects, pallet.width, pallet.length);
  if (!derived.isPartial) {
    const minCorners = minimumRequiredCorners(packingStyle, derived.taperAllowed, derived.rescue, derived.strict);
    if (cornerCount < minCorners) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
  }

  const coverageConfig = buildCoveragePenaltyConfig({
    packingStyle,
    baseLayer: derived.baseLayer,
    taperAllowed: derived.taperAllowed,
    rescue: derived.rescue,
  });
  if (violatesCoverageConstraints({
    isPartial: derived.isPartial,
    taperAllowed: derived.taperAllowed,
    rescue: derived.rescue,
    strict: derived.strict,
    centerGapStreak: state.centerGapStreak,
    centerHasCentralGap: derived.center.hasCentralGap,
    largestGapRatio: derived.gaps.largestGapRatio,
    relaxBaseGapLimits: coverageConfig.relaxBaseGapLimits,
  })) {
    return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
  }

  const score = computeCandidateScore(
    buildCandidateScoreInput({
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
    }),
  );

  return {
    valid: Number.isFinite(score),
    score,
    layoutHash,
  };
}
