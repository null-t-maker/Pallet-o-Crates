import type { SeedLayerParams } from "./packerHeuristicPhaseTypes";

export function runSeedPhase(params: SeedLayerParams): boolean {
  const {
    safePallet,
    rem,
    state,
    blockedRects,
    zBase,
    usedTypeIds,
    best,
    allowUprightNow,
    applyCandidate,
    applySinglePlacement,
    deps,
    currentWeight,
  } = params;

  let seeded = false;
  if (best && best.rects.length > 0) {
    seeded = applyCandidate(best);
  }
  if (!seeded) {
    const seedPreferType = state.prevLayerTypeId;
    const lowestSeed = deps.findLowestHeightGapPlacement(
      safePallet,
      rem,
      state,
      safePallet.maxWeight - currentWeight(),
      blockedRects,
      zBase,
      0,
      allowUprightNow,
      seedPreferType,
      usedTypeIds,
    );
    if (lowestSeed) seeded = applySinglePlacement(lowestSeed);
  }
  if (!seeded) {
    const seedPreferType = state.prevLayerTypeId;
    const seedFlat = deps.findGapPlacementExhaustive(
      safePallet,
      rem,
      state,
      safePallet.maxWeight - currentWeight(),
      blockedRects,
      zBase,
      0,
      false,
      seedPreferType,
      usedTypeIds,
    );
    if (seedFlat) seeded = applySinglePlacement(seedFlat);

    if (!seeded && allowUprightNow) {
      const seedUpright = deps.findGapPlacementExhaustive(
        safePallet,
        rem,
        state,
        safePallet.maxWeight - currentWeight(),
        blockedRects,
        zBase,
        0,
        true,
        seedPreferType,
        usedTypeIds,
      );
      if (seedUpright) seeded = applySinglePlacement(seedUpright);
    }
  }

  return seeded;
}
