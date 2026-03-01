import type { CartonInput, PalletInput } from "./packerTypes";
import type {
  BestCandidate,
  EvaluationProfile,
  LayerState,
  Pattern,
  Rect,
} from "./packerCoreTypes";
import {
  collectActiveTypeIds,
  collectCriticalTypeIds,
  resolveUniformStackMode,
} from "./packerCandidateSearchHelpers";
import type { TryFindBestCandidateDeps } from "./packerCandidateSearchTypes";
import { findBestCandidateInCurrentPass } from "./packerCandidateSearchCore";

export type { TryFindBestCandidateDeps } from "./packerCandidateSearchTypes";

export function tryFindBestCandidate(
  pallet: PalletInput,
  rem: CartonInput[],
  state: LayerState,
  remainingWeight: number,
  patternCache: Map<string, Pattern[]>,
  profile: EvaluationProfile,
  zBase: number,
  blockedRects: Rect[] = [],
  preferredDifferentTypeId: string | null = null,
  heightCeil: number | null = null,
  enforceCriticalFirst = true,
  allowCrossStyleFallback = true,
  deps: TryFindBestCandidateDeps,
): BestCandidate | null {
  const packingStyle = deps.resolvePackingStyle(pallet);
  const sampleGuidance = deps.resolveSampleGuidance(pallet);
  const preferCenterMode = packingStyle === "centerCompact";
  const activeTypeIds = collectActiveTypeIds(
    rem,
    pallet,
    zBase,
    heightCeil,
    remainingWeight,
    deps.EPS,
  );
  const singleActiveType = activeTypeIds.size <= 1;
  const uniformStackMode = resolveUniformStackMode(
    rem,
    pallet,
    zBase,
    heightCeil,
    deps.EPS,
    singleActiveType,
    state.layerIndex,
  );
  const criticalTypeIds = enforceCriticalFirst
    ? collectCriticalTypeIds(
      rem,
      state.prevPlacements,
      zBase,
      pallet,
      heightCeil,
      remainingWeight,
      deps.EPS,
    )
    : null;

  const best = findBestCandidateInCurrentPass(
    pallet,
    rem,
    state,
    remainingWeight,
    patternCache,
    profile,
    zBase,
    blockedRects,
    preferredDifferentTypeId,
    heightCeil,
    {
      packingStyle,
      sampleGuidance,
      preferCenterMode,
      singleActiveType,
      uniformStackMode,
      criticalTypeIds,
    },
    deps,
  );

  if (!best && criticalTypeIds && enforceCriticalFirst) {
    return tryFindBestCandidate(
      pallet,
      rem,
      state,
      remainingWeight,
      patternCache,
      profile,
      zBase,
      blockedRects,
      preferredDifferentTypeId,
      heightCeil,
      false,
      allowCrossStyleFallback,
      deps,
    );
  }

  if (
    allowCrossStyleFallback
    && packingStyle === "centerCompact"
    && singleActiveType
    && profile !== "rescue"
  ) {
    const edgeBest = tryFindBestCandidate(
      { ...pallet, packingStyle: "edgeAligned" },
      rem,
      state,
      remainingWeight,
      patternCache,
      profile,
      zBase,
      blockedRects,
      preferredDifferentTypeId,
      heightCeil,
      enforceCriticalFirst,
      false,
      deps,
    );
    if (edgeBest && (!best || edgeBest.rects.length > best.rects.length)) {
      const canRecenter = blockedRects.length === 0;
      const recentered = canRecenter
        ? deps.sortRects(deps.recenterRects(edgeBest.rects, pallet.width, pallet.length))
        : edgeBest.rects;
      const safeRects = deps.isRectSetPlacementSafe(recentered, blockedRects, pallet.width, pallet.length)
        ? recentered
        : edgeBest.rects;
      return {
        ...edgeBest,
        rects: safeRects,
      };
    }
  }

  return best;
}
