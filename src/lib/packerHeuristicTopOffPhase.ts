import type { TopOffParams } from "./packerHeuristicPhaseTypes";

export function runTopOffPhase(params: TopOffParams): void {
  const {
    safePallet,
    rem,
    state,
    patternCache,
    blockedRects,
    zBase,
    layer,
    applyCandidate,
    deps,
    EPS,
    currentWeight,
  } = params;

  let topOffSafety = 0;
  while (topOffSafety < 8) {
    topOffSafety++;
    const remainingWeightNow = safePallet.maxWeight - currentWeight();
    if (remainingWeightNow <= EPS) break;

    const preferDifferentFrom = layer.cartons[0]?.typeId ?? null;
    const extraNormal = deps.tryFindBestCandidate(
      safePallet,
      rem,
      state,
      remainingWeightNow,
      patternCache,
      "normal",
      zBase,
      blockedRects,
      preferDifferentFrom,
    );
    const extra = extraNormal ?? deps.tryFindBestCandidate(
      safePallet,
      rem,
      state,
      remainingWeightNow,
      patternCache,
      "rescue",
      zBase,
      blockedRects,
      preferDifferentFrom,
    );

    if (!extra || extra.rects.length === 0) break;
    if (layer.height > 0 && extra.carton.height > layer.height + 0.25) break;
    if (!applyCandidate(extra)) break;
  }
}
