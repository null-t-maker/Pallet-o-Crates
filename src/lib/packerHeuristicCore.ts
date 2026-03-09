import type { CartonInput, Layer, PackedCarton, PalletInput } from "./packerTypes";
import type { Pattern } from "./packerCoreTypes";
import type { HeuristicRunnerDeps } from "./packerHeuristicTypes";
import {
  collectSupportAndBlockedAtZ,
  createInitialLayerState,
  updateStateAfterCommittedLayer,
} from "./packerHeuristicState";
import { runHeuristicLayerStep } from "./packerHeuristicLayerStep";

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

  while (rem.some((carton) => carton.quantity > 0) && safety < 800) {
    safety += 1;
    if (zBase > safePallet.maxHeight + EPS) break;

    const remainingWeight = safePallet.maxWeight - totalWeight;
    if (remainingWeight <= EPS) break;

    const { supportAtZ, blockedAtZ } = collectSupportAndBlockedAtZ(placed, zBase, EPS);
    state.prevPlacements = supportAtZ;

    const step = runHeuristicLayerStep({
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
    });
    totalWeight = step.totalWeight;

    if (!step.seeded) {
      const nextZ = deps.findNextZBase(placed, zBase);
      if (nextZ === null || nextZ > safePallet.maxHeight + EPS) break;
      zBase = nextZ;
      continue;
    }

    const { layer, layerPlacements, usedTypeIds } = step;
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
