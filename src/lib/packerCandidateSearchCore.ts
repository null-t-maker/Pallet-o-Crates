import type { CartonInput, PalletInput } from "./packerTypes";
import type {
  BestCandidate,
  EvaluationProfile,
  LayerState,
  Pattern,
  Rect,
} from "./packerCoreTypes";
import type { TryFindBestCandidateDeps } from "./packerCandidateSearchTypes";
import { canBeSafelySupportedByOtherTypes } from "./packerCandidateSearchHelpers";
import type { CandidateSearchContext } from "./packerCandidateSearchEvaluation";
import { evaluatePatternCandidateLoop } from "./packerCandidateSearchPatternLoop";

export function findBestCandidateInCurrentPass(
  pallet: PalletInput,
  rem: CartonInput[],
  state: LayerState,
  remainingWeight: number,
  patternCache: Map<string, Pattern[]>,
  profile: EvaluationProfile,
  zBase: number,
  blockedRects: Rect[],
  preferredDifferentTypeId: string | null,
  heightCeil: number | null,
  context: CandidateSearchContext,
  deps: TryFindBestCandidateDeps,
): BestCandidate | null {
  let best: BestCandidate | null = null;

  for (const carton of rem) {
    if (carton.quantity <= 0) continue;
    if (context.criticalTypeIds && !context.criticalTypeIds.has(carton.id)) continue;
    if (zBase + carton.height > pallet.maxHeight + deps.EPS) continue;
    if (heightCeil !== null && carton.height > heightCeil + 0.25) continue;
    if (carton.weight <= 0) continue;

    const hasSameTypeSupportBelow = state.prevPlacements.some((placement) => placement.typeId === carton.id);
    const supportableByOthers = canBeSafelySupportedByOtherTypes(carton, rem, 2.25, deps.EPS);
    const baseCritical = !supportableByOthers && !hasSameTypeSupportBelow;

    const maxByWeight = Math.floor((remainingWeight + deps.EPS) / carton.weight);
    if (maxByWeight <= 0) continue;

    const patterns = deps.getPatternCandidates(
      pallet.width,
      pallet.length,
      carton.width,
      carton.length,
      patternCache,
    );

    for (const pattern of patterns) {
      const availableRects = blockedRects.length === 0
        ? pattern.rects
        : pattern.rects.filter((rect) => blockedRects.every((blocked) => deps.overlapArea(rect, blocked) <= deps.EPS));

      const capacity = availableRects.length;
      if (capacity <= 0) continue;

      const maxCount = Math.min(capacity, carton.quantity, maxByWeight);
      if (maxCount <= 0) continue;

      best = evaluatePatternCandidateLoop({
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
        currentBest: best,
      });
    }
  }

  return best;
}

export function findBestCandidatesInCurrentPass(
  pallet: PalletInput,
  rem: CartonInput[],
  state: LayerState,
  remainingWeight: number,
  patternCache: Map<string, Pattern[]>,
  profile: EvaluationProfile,
  zBase: number,
  blockedRects: Rect[],
  preferredDifferentTypeId: string | null,
  heightCeil: number | null,
  context: CandidateSearchContext,
  deps: TryFindBestCandidateDeps,
): BestCandidate[] {
  const candidates: BestCandidate[] = [];

  for (const carton of rem) {
    if (carton.quantity <= 0) continue;
    if (context.criticalTypeIds && !context.criticalTypeIds.has(carton.id)) continue;
    if (zBase + carton.height > pallet.maxHeight + deps.EPS) continue;
    if (heightCeil !== null && carton.height > heightCeil + 0.25) continue;
    if (carton.weight <= 0) continue;

    const hasSameTypeSupportBelow = state.prevPlacements.some((placement) => placement.typeId === carton.id);
    const supportableByOthers = canBeSafelySupportedByOtherTypes(carton, rem, 2.25, deps.EPS);
    const baseCritical = !supportableByOthers && !hasSameTypeSupportBelow;

    const maxByWeight = Math.floor((remainingWeight + deps.EPS) / carton.weight);
    if (maxByWeight <= 0) continue;

    const patterns = deps.getPatternCandidates(
      pallet.width,
      pallet.length,
      carton.width,
      carton.length,
      patternCache,
    );

    for (const pattern of patterns) {
      const availableRects = blockedRects.length === 0
        ? pattern.rects
        : pattern.rects.filter((rect) => blockedRects.every((blocked) => deps.overlapArea(rect, blocked) <= deps.EPS));

      const capacity = availableRects.length;
      if (capacity <= 0) continue;

      const maxCount = Math.min(capacity, carton.quantity, maxByWeight);
      if (maxCount <= 0) continue;

      evaluatePatternCandidateLoop({
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
        currentBest: null,
        candidateSink: candidates,
      });
    }
  }

  return candidates;
}
