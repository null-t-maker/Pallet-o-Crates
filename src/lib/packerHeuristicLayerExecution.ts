import { v4 as uuidv4 } from "uuid";
import type { CartonInput, Layer, PackedCarton, PalletInput } from "./packerTypes";
import type {
  BestCandidate,
  GapPlacementCandidate,
  LayerState,
  Pattern,
  PlacementRect,
  Rect,
} from "./packerCoreTypes";
import type { HeuristicRunnerDeps } from "./packerHeuristicTypes";
import {
  applyBestCandidate,
  applyGapPlacementCandidate,
} from "./packerHeuristicPlacement";
import {
  runGapFillPhase,
  runSeedPhase,
  runTopOffPhase,
} from "./packerHeuristicPhases";

interface ExecuteHeuristicLayerPhasesArgs {
  safePallet: PalletInput;
  rem: CartonInput[];
  placed: PackedCarton[];
  state: LayerState;
  patternCache: Map<string, Pattern[]>;
  blockedRects: Rect[];
  zBase: number;
  layer: Layer;
  layerPlacements: PlacementRect[];
  usedTypeIds: Set<string>;
  best: BestCandidate | null;
  totalWeightRef: { value: number };
  EPS: number;
  deps: HeuristicRunnerDeps;
}

interface ExecuteHeuristicLayerPhasesResult {
  seeded: boolean;
}

export function executeHeuristicLayerPhases({
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
}: ExecuteHeuristicLayerPhasesArgs): ExecuteHeuristicLayerPhasesResult {
  const initialAllowUpright = deps.hasAnyPreferredUprightCandidates(rem);
  const placementContext = {
    safePallet,
    state,
    placed,
    layer,
    layerPlacements,
    blockedRects,
    usedTypeIds,
    zBase,
    totalWeightRef,
    EPS,
    createId: uuidv4,
    isRectSetPlacementSafe: deps.isRectSetPlacementSafe,
    isWrapFriendlyLayerShape: deps.isWrapFriendlyLayerShape,
    cumulativeStackLoadSafe: deps.cumulativeStackLoadSafe,
    noCollision: deps.noCollision,
  };
  const applyCandidate = (cand: BestCandidate): boolean => applyBestCandidate(cand, placementContext);
  const applySinglePlacement = (cand: GapPlacementCandidate): boolean => applyGapPlacementCandidate(cand, placementContext);

  const seeded = runSeedPhase({
    safePallet,
    rem,
    state,
    blockedRects,
    zBase,
    usedTypeIds,
    best,
    allowUprightNow: initialAllowUpright,
    applyCandidate,
    applySinglePlacement,
    deps,
    currentWeight: () => totalWeightRef.value,
  });
  if (!seeded) {
    return { seeded: false };
  }

  runTopOffPhase({
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
    currentWeight: () => totalWeightRef.value,
  });

  runGapFillPhase({
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
    currentWeight: () => totalWeightRef.value,
  });

  if (safePallet.packingStyle === "centerCompact" && layer.cartons.length > 0) {
    deps.tryCenterShiftLayer(layerPlacements, layer.cartons, state.prevPlacements, safePallet);
  }

  return { seeded: true };
}
