import type { NormalizedSampleGuidance } from "./packerConfig";
import type { CartonInput, PalletInput } from "./packerTypes";
import type {
  BestCandidate,
  EvaluationProfile,
  LayerState,
  Pattern,
  Rect,
} from "./packerCoreTypes";
import type { TryFindBestCandidateDeps } from "./packerCandidateSearchTypes";
import {
  buildCountOptions,
  buildModeOptions,
  canBeSafelySupportedByOtherTypes,
  shouldSkipMode,
} from "./packerCandidateSearchHelpers";
import { scoreCandidateSelection } from "./packerCandidateScoring";

interface CandidateSearchContext {
  packingStyle: "centerCompact" | "edgeAligned";
  sampleGuidance: NormalizedSampleGuidance | null;
  preferCenterMode: boolean;
  singleActiveType: boolean;
  uniformStackMode: boolean;
  criticalTypeIds: Set<string> | null;
}

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

          const selectedRaw = deps.selectRects(
            availableRects,
            count,
            mode,
            pallet.width,
            pallet.length,
          );
          const canRecenter = context.preferCenterMode && blockedRects.length === 0;
          const selected = canRecenter
            ? deps.sortRects(deps.recenterRects(selectedRaw, pallet.width, pallet.length))
            : selectedRaw;
          if (selected.length === 0) continue;
          if (!deps.isRectSetPlacementSafe(selected, blockedRects, pallet.width, pallet.length)) continue;

          const remainingSameType = carton.quantity - selected.length;
          const remainingTotalAfterPlacement = rem.reduce((sum, cart) => {
            const quantity = cart.id === carton.id ? cart.quantity - selected.length : cart.quantity;
            return sum + Math.max(0, quantity);
          }, 0);
          const evaluation = deps.evaluateCandidate(
            pallet,
            carton,
            selected,
            capacity,
            mode,
            state,
            profile,
            remainingSameType,
            remainingTotalAfterPlacement,
            context.uniformStackMode,
            context.packingStyle,
          );
          if (!evaluation.valid) continue;

          const scored = scoreCandidateSelection(
            {
              evaluationScore: evaluation.score,
              layoutHash: evaluation.layoutHash,
              selected,
              carton,
              mode,
              pallet,
              state,
              profile,
              preferredDifferentTypeId,
              sampleGuidance: context.sampleGuidance,
              singleActiveType: context.singleActiveType,
              baseCritical,
            },
            {
              centerStats: deps.centerStats,
              wallStats: deps.wallStats,
              guidanceTrialNoise: deps.guidanceTrialNoise,
            },
          );

          if (!best || scored > best.score) {
            best = {
              carton,
              rects: selected,
              score: scored,
              layoutHash: evaluation.layoutHash,
            };
          }
        }
      }
    }
  }

  return best;
}

