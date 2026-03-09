import { packPallets } from "./packer";
import type {
  CartonInput,
  MultiPackResult,
  PackSampleGuidance,
  PalletInput,
} from "./packerTypes";
import { isBetterMultiPackResult } from "./templateLock";

export function applySampleGuidance(
  pallet: PalletInput,
  sampleGuidance: PackSampleGuidance | null,
): PalletInput {
  const nextPallet: PalletInput = { ...pallet };
  if (!sampleGuidance) return nextPallet;

  nextPallet.sampleGuidance = sampleGuidance;
  if (
    (sampleGuidance.confidence ?? 0) >= 0.72
    && sampleGuidance.preferredPackingStyle
  ) {
    nextPallet.packingStyle = sampleGuidance.preferredPackingStyle;
  }
  return nextPallet;
}

export function calculateGuidedWithFallback(
  pallet: PalletInput,
  cartons: CartonInput[],
  sampleGuidance: PackSampleGuidance | null,
): MultiPackResult {
  const guided = packPallets(pallet, cartons.map((carton) => ({ ...carton })));
  if (!sampleGuidance) return guided;

  const unguided = packPallets(
    { ...pallet, sampleGuidance: undefined },
    cartons.map((carton) => ({ ...carton })),
  );
  return isBetterMultiPackResult(unguided, guided) ? unguided : guided;
}
