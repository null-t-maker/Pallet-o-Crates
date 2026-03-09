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
  findBestCandidateInCurrentPass,
  findBestCandidatesInCurrentPass,
} from "./packerCandidateSearchCore";
import { buildCandidateSearchContext } from "./packerCandidateSearchContext";

export type { TryFindBestCandidateDeps } from "./packerCandidateSearchTypes";

export function tryFindCandidateOptions(
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
  maxOptions = 6,
  deps: TryFindBestCandidateDeps,
): BestCandidate[] {
  const context = buildCandidateSearchContext({
    pallet,
    rem,
    state,
    remainingWeight,
    zBase,
    heightCeil,
    enforceCriticalFirst,
    deps,
  });

  let candidates = findBestCandidatesInCurrentPass(
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
    context,
    deps,
  );

  if (candidates.length === 0 && context.criticalTypeIds && enforceCriticalFirst) {
    candidates = tryFindCandidateOptions(
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
      maxOptions,
      deps,
    );
  }

  if (
    allowCrossStyleFallback
    && context.packingStyle === "centerCompact"
    && context.singleActiveType
    && profile !== "rescue"
  ) {
    const edgeCandidates = tryFindCandidateOptions(
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
      maxOptions,
      deps,
    ).map((candidate) => {
      const canRecenter = blockedRects.length === 0;
      const recentered = canRecenter
        ? deps.sortRects(deps.recenterRects(candidate.rects, pallet.width, pallet.length))
        : candidate.rects;
      const safeRects = deps.isRectSetPlacementSafe(recentered, blockedRects, pallet.width, pallet.length)
        ? recentered
        : candidate.rects;
      return {
        ...candidate,
        rects: safeRects,
      };
    });
    candidates = [...candidates, ...edgeCandidates];
  }

  const unique = new Map<string, BestCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.carton.id}|${candidate.layoutHash}`;
    const existing = unique.get(key);
    if (!existing || candidate.score > existing.score) {
      unique.set(key, candidate);
    }
  }

  return Array.from(unique.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, maxOptions);
}

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
  const context = buildCandidateSearchContext({
    pallet,
    rem,
    state,
    remainingWeight,
    zBase,
    heightCeil,
    enforceCriticalFirst,
    deps,
  });

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
    context,
    deps,
  );

  if (!best && context.criticalTypeIds && enforceCriticalFirst) {
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
    && context.packingStyle === "centerCompact"
    && context.singleActiveType
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
