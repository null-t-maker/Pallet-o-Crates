import type { Layer } from "./packerTypes";
import type {
  PlacementRect,
  Rect,
} from "./packerCoreTypes";
import { executeHeuristicLayerPhases } from "./packerHeuristicLayerExecution";
import { resolveBestHeuristicLayerCandidate } from "./packerHeuristicLayerCandidate";
import type { RunHeuristicLayerStepArgs, RunHeuristicLayerStepResult } from "./packerHeuristicLayerStepTypes";

export function runHeuristicLayerStepGreedy({
  safePallet,
  rem,
  placed,
  state,
  patternCache,
  blockedAtZ,
  zBase,
  totalWeight,
  EPS,
  deps,
}: RunHeuristicLayerStepArgs): RunHeuristicLayerStepResult {
  const remainingWeight = safePallet.maxWeight - totalWeight;
  const best = resolveBestHeuristicLayerCandidate({
    safePallet,
    rem,
    state,
    remainingWeight,
    patternCache,
    zBase,
    blockedAtZ,
    deps,
  });

  const layer: Layer = {
    zBase,
    height: 0,
    cartons: [],
  };
  const layerPlacements: PlacementRect[] = [];
  const blockedRects: Rect[] = blockedAtZ.map((r) => ({ ...r }));
  const usedTypeIds = new Set<string>();

  const totalWeightRef = { value: totalWeight };
  const { seeded } = executeHeuristicLayerPhases({
    safePallet,
    rem,
    placed,
    state,
    patternCache,
    blockedRects,
    zBase,
    layer,
    layerPlacements,
    usedTypeIds,
    best,
    totalWeightRef,
    EPS,
    deps,
  });
  if (!seeded) {
    return {
      seeded: false,
      layer,
      layerPlacements,
      usedTypeIds,
      totalWeight: totalWeightRef.value,
    };
  }

  return {
    seeded: true,
    layer,
    layerPlacements,
    usedTypeIds,
    totalWeight: totalWeightRef.value,
  };
}
