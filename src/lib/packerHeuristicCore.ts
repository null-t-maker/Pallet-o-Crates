import { v4 as uuidv4 } from "uuid";
import type { CartonInput, Layer, PackedCarton, PalletInput } from "./packerTypes";
import type {
  BestCandidate,
  GapPlacementCandidate,
  Pattern,
  PlacementRect,
  Rect,
} from "./packerCoreTypes";
import type { HeuristicRunnerDeps } from "./packerHeuristicTypes";
import {
  collectSupportAndBlockedAtZ,
  createInitialLayerState,
  updateStateAfterCommittedLayer,
} from "./packerHeuristicState";
import {
  applyBestCandidate,
  applyGapPlacementCandidate,
} from "./packerHeuristicPlacement";
import {
  runGapFillPhase,
  runSeedPhase,
  runTopOffPhase,
} from "./packerHeuristicPhases";

const EPS = 1e-6;

export type { HeuristicRunnerDeps } from "./packerHeuristicTypes";

export function runHeuristicLayerPacking(
  safePallet: PalletInput,
  rem: CartonInput[],
  deps: HeuristicRunnerDeps,
): { layers: Layer[]; placed: PackedCarton[]; totalWeight: number } {
  const layers: Layer[] = [];
  const placed: PackedCarton[] = [];
  let totalWeight = 0;
  let zBase = 0;
  let safety = 0;

  const state = createInitialLayerState();
  const patternCache = new Map<string, Pattern[]>();

  while (rem.some((c) => c.quantity > 0) && safety < 800) {
    safety++;
    if (zBase > safePallet.maxHeight + EPS) break;

    const remainingWeight = safePallet.maxWeight - totalWeight;
    if (remainingWeight <= EPS) break;

    const { supportAtZ, blockedAtZ } = collectSupportAndBlockedAtZ(placed, zBase, EPS);
    state.prevPlacements = supportAtZ;
    const initialAllowUpright = deps.hasAnyPreferredUprightCandidates(rem);

    const bestStrict = deps.tryFindBestCandidate(
      safePallet,
      rem,
      state,
      remainingWeight,
      patternCache,
      "strict",
      zBase,
      blockedAtZ,
    );
    const bestNormal = bestStrict ?? deps.tryFindBestCandidate(
      safePallet,
      rem,
      state,
      remainingWeight,
      patternCache,
      "normal",
      zBase,
      blockedAtZ,
    );
    const best = bestNormal ?? deps.tryFindBestCandidate(
      safePallet,
      rem,
      state,
      remainingWeight,
      patternCache,
      "rescue",
      zBase,
      blockedAtZ,
    );

    const layer: Layer = {
      zBase,
      height: 0,
      cartons: [],
    };
    const layerPlacements: PlacementRect[] = [];
    const blockedRects: Rect[] = blockedAtZ.map((r) => ({ ...r }));
    const usedTypeIds = new Set<string>();

    const totalWeightRef = { value: totalWeight };
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
    const applyCandidate = (cand: BestCandidate): boolean => {
      const ok = applyBestCandidate(cand, placementContext);
      totalWeight = totalWeightRef.value;
      return ok;
    };
    const applySinglePlacement = (cand: GapPlacementCandidate): boolean => {
      const ok = applyGapPlacementCandidate(cand, placementContext);
      totalWeight = totalWeightRef.value;
      return ok;
    };

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
      currentWeight: () => totalWeight,
    });
    if (!seeded) {
      const nextZ = deps.findNextZBase(placed, zBase);
      if (nextZ === null || nextZ > safePallet.maxHeight + EPS) break;
      zBase = nextZ;
      continue;
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
      currentWeight: () => totalWeight,
    });

    // Saturate the current z-level before moving up: no "tower first" if something still fits below.
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
      currentWeight: () => totalWeight,
    });

    if (safePallet.packingStyle === "centerCompact" && layer.cartons.length > 0) {
      deps.tryCenterShiftLayer(layerPlacements, layer.cartons, state.prevPlacements, safePallet);
    }

    if (layer.cartons.length === 0 || layer.height <= 0) break;
    layers.push(layer);
    placed.push(...layer.cartons);

    updateStateAfterCommittedLayer(
      state,
      layer,
      layerPlacements,
      safePallet,
      usedTypeIds,
      rem,
      deps,
    );

    const nextZ = deps.findNextZBase(placed, zBase);
    if (nextZ === null || nextZ > safePallet.maxHeight + EPS) break;
    zBase = nextZ;
  }

  return {
    layers,
    placed,
    totalWeight,
  };
}


