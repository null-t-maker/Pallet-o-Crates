import type {
  CartonInput,
  PackResult,
  PalletInput,
} from "./packerTypes";
import { cloneCartons, countUnpackedUnits } from "./packerMultiPalletHelpers";

interface PickBestSinglePalletResultArgs {
  pallet: PalletInput;
  remaining: CartonInput[];
  trialCount: number;
  unitsBefore: number;
  eps: number;
  packSinglePallet: (pallet: PalletInput, cartons: CartonInput[]) => PackResult;
}

function isTrialPackBetter(
  trialResult: PackResult,
  trialPacked: number,
  bestPacked: number,
  bestHeight: number,
  bestLayers: number,
  eps: number,
): boolean {
  return trialPacked > bestPacked
    || (
      trialPacked === bestPacked
      && (
        trialResult.totalHeight < bestHeight - eps
        || (
          Math.abs(trialResult.totalHeight - bestHeight) <= eps
          && trialResult.layers.length < bestLayers
        )
      )
    );
}

export function pickBestSinglePalletResult({
  pallet,
  remaining,
  trialCount,
  unitsBefore,
  eps,
  packSinglePallet,
}: PickBestSinglePalletResultArgs): PackResult {
  let bestResult = packSinglePallet(pallet, cloneCartons(remaining));
  if (trialCount <= 1 || !pallet.sampleGuidance) {
    return bestResult;
  }

  let bestPacked = unitsBefore - countUnpackedUnits(bestResult.unpacked);
  let bestHeight = bestResult.totalHeight;
  let bestLayers = bestResult.layers.length;

  for (let trial = 1; trial < trialCount; trial++) {
    const trialPallet: PalletInput = {
      ...pallet,
      sampleGuidance: {
        ...pallet.sampleGuidance,
        trialIndex: trial,
      },
    };
    const trialResult = packSinglePallet(trialPallet, cloneCartons(remaining));
    const trialPacked = unitsBefore - countUnpackedUnits(trialResult.unpacked);
    if (!isTrialPackBetter(trialResult, trialPacked, bestPacked, bestHeight, bestLayers, eps)) {
      continue;
    }
    bestResult = trialResult;
    bestPacked = trialPacked;
    bestHeight = trialResult.totalHeight;
    bestLayers = trialResult.layers.length;
  }

  return bestResult;
}
