import { runHeuristicLayerPacking } from "./packerHeuristicCore";
import {
  packInterchangeableTypesAsUnified,
  packSingleTypeDeterministic,
} from "./packerDeterministic";
import {
  createCandidateSearchDeps,
  createDeterministicDeps,
  createHeuristicRunnerDeps,
  createPackPalletSharedDeps,
} from "./packerPackPalletDeps";
import {
  tryInitialShortcutPack,
} from "./packerSinglePalletFlow";
import type {
  CartonInput,
  Layer,
  PackedCarton,
  PackResult,
  PalletInput,
} from "./packerTypes";

export interface PackPalletPipeline {
  tryShortcutPack: (safePallet: PalletInput, rem: CartonInput[]) => PackResult | null;
  runHeuristicPack: (
    safePallet: PalletInput,
    rem: CartonInput[],
  ) => { layers: Layer[]; placed: PackedCarton[]; totalWeight: number };
}

export function createPackPalletPipeline(
  packPalletFn: (pallet: PalletInput, cartons: CartonInput[]) => PackResult,
): PackPalletPipeline {
  const shared = createPackPalletSharedDeps();
  const deterministicDeps = createDeterministicDeps(shared, packPalletFn);
  const candidateSearchDeps = createCandidateSearchDeps(shared);
  const heuristicDeps = createHeuristicRunnerDeps(shared, candidateSearchDeps);

  return {
    tryShortcutPack: (safePallet, rem) => tryInitialShortcutPack(safePallet, rem, {
      packInterchangeableTypesAsUnified: (palletInput, activeCartons) => (
        packInterchangeableTypesAsUnified(palletInput, activeCartons, deterministicDeps)
      ),
      packSingleTypeDeterministic: (palletInput, cartonInput) => (
        packSingleTypeDeterministic(palletInput, cartonInput, deterministicDeps)
      ),
    }),
    runHeuristicPack: (safePallet, rem) => runHeuristicLayerPacking(safePallet, rem, heuristicDeps),
  };
}
