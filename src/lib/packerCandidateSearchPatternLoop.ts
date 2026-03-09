import type { CartonInput, PalletInput } from "./packerTypes";
import type {
  BestCandidate,
  EvaluationProfile,
  LayerState,
  Rect,
} from "./packerCoreTypes";
import type { TryFindBestCandidateDeps } from "./packerCandidateSearchTypes";
import {
  buildCountOptions,
  buildModeOptions,
  shouldSkipMode,
} from "./packerCandidateSearchHelpers";
import {
  evaluateModeCandidate,
  type CandidateSearchContext,
} from "./packerCandidateSearchEvaluation";

interface EvaluatePatternLoopArgs {
  pallet: PalletInput;
  rem: CartonInput[];
  carton: CartonInput;
  state: LayerState;
  profile: EvaluationProfile;
  capacity: number;
  maxCount: number;
  availableRects: Rect[];
  blockedRects: Rect[];
  preferredDifferentTypeId: string | null;
  baseCritical: boolean;
  context: CandidateSearchContext;
  deps: TryFindBestCandidateDeps;
  currentBest: BestCandidate | null;
  candidateSink?: BestCandidate[];
}

export function evaluatePatternCandidateLoop({
  pallet,
  rem,
  carton,
  state,
  profile,
  capacity,
  maxCount,
  availableRects,
  blockedRects,
  preferredDifferentTypeId,
  baseCritical,
  context,
  deps,
  currentBest,
  candidateSink,
}: EvaluatePatternLoopArgs): BestCandidate | null {
  let best = currentBest;

  const nearTailForCarton = carton.quantity <= maxCount;
  const allowShapeDeviation = !context.uniformStackMode || nearTailForCarton || profile === "rescue";
  const mustKeepFullCountAtBase = profile !== "rescue" && (
    context.singleActiveType
    || (context.preferCenterMode && nearTailForCarton)
  );
  const sortedCounts = buildCountOptions(
    maxCount,
    mustKeepFullCountAtBase,
    allowShapeDeviation,
    profile,
    state.centerGapStreak,
    state.layerIndex,
  );

  for (const count of sortedCounts) {
    const hasSpareSlots = count < capacity;
    const likelyTaper = state.layerIndex >= 2
      && (
        state.centerGapStreak > 0
        || hasSpareSlots
        || (state.prevPlacements.length > 0 && count <= state.prevPlacements.length)
        || (carton.quantity - count <= capacity)
      );
    const modeOptions = buildModeOptions(
      context.preferCenterMode,
      context.singleActiveType,
      hasSpareSlots,
      likelyTaper,
      allowShapeDeviation,
      profile,
      nearTailForCarton,
      state.layerIndex,
    );

    for (const mode of modeOptions) {
      if (shouldSkipMode(mode, profile, count, capacity, state.centerGapStreak)) {
        continue;
      }

      const modeCandidate = evaluateModeCandidate({
        pallet,
        rem,
        carton,
        state,
        profile,
        mode,
        count,
        capacity,
        availableRects,
        blockedRects,
        preferredDifferentTypeId,
        baseCritical,
        context,
        deps,
      });
      if (!modeCandidate) continue;

      const candidate: BestCandidate = {
        carton,
        rects: modeCandidate.rects,
        score: modeCandidate.score,
        layoutHash: modeCandidate.layoutHash,
      };
      candidateSink?.push(candidate);

      if (!best || modeCandidate.score > best.score) {
        best = candidate;
      }
    }
  }

  return best;
}
