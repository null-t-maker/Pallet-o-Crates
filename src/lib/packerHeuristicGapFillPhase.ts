import type { GapFillParams } from "./packerHeuristicPhaseTypes";

export function runGapFillPhase(params: GapFillParams): void {
  const {
    safePallet,
    rem,
    state,
    blockedRects,
    zBase,
    layer,
    usedTypeIds,
    applySinglePlacement,
    deps,
    EPS,
    currentWeight,
  } = params;

  let gapFillSafety = 0;
  while (gapFillSafety < 180) {
    gapFillSafety++;
    const remainingWeightNow = safePallet.maxWeight - currentWeight();
    if (remainingWeightNow <= EPS) break;
    const allowUprightNow = deps.hasAnyNonNeverUprightCandidates(rem);

    const preferDifferentFrom = layer.cartons[0]?.typeId ?? null;
    const flatFill = deps.findGapPlacement(
      safePallet,
      rem,
      state,
      remainingWeightNow,
      blockedRects,
      zBase,
      layer.height,
      false,
      preferDifferentFrom,
      usedTypeIds,
      layer.height,
    );
    if (flatFill && applySinglePlacement(flatFill)) continue;

    const flatFallback = deps.findGapPlacementExhaustive(
      safePallet,
      rem,
      state,
      remainingWeightNow,
      blockedRects,
      zBase,
      layer.height,
      false,
      preferDifferentFrom,
      usedTypeIds,
      layer.height,
    );
    if (flatFallback && applySinglePlacement(flatFallback)) continue;

    const uprightFill = deps.findGapPlacement(
      safePallet,
      rem,
      state,
      remainingWeightNow,
      blockedRects,
      zBase,
      layer.height,
      allowUprightNow,
      preferDifferentFrom,
      usedTypeIds,
      layer.height,
    );
    if (uprightFill && applySinglePlacement(uprightFill)) continue;

    const uprightFallback = deps.findGapPlacementExhaustive(
      safePallet,
      rem,
      state,
      remainingWeightNow,
      blockedRects,
      zBase,
      layer.height,
      allowUprightNow,
      preferDifferentFrom,
      usedTypeIds,
      layer.height,
    );
    if (uprightFallback && applySinglePlacement(uprightFallback)) continue;

    // Only if nothing fits within current layer height, allow layer growth.
    const growLowest = deps.findLowestHeightGapPlacement(
      safePallet,
      rem,
      state,
      remainingWeightNow,
      blockedRects,
      zBase,
      layer.height,
      allowUprightNow,
      preferDifferentFrom,
      usedTypeIds,
      layer.height,
    );
    if (!growLowest || !applySinglePlacement(growLowest)) break;
  }
}
