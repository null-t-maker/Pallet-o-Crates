import type {
  CartonInput,
  ExtraPalletMode,
  MultiPackResult,
  PackResult,
  PackedPalletPlacement,
  PalletInput,
} from "./packerTypes";
import {
  cloneCartons,
  countUnpackedUnits,
  crossOffsetForPallet,
  hasActiveCartons,
  reachesPalletHardLimit,
} from "./packerMultiPalletHelpers";
import { pickBestSinglePalletResult } from "./packerMultiPalletTrial";

const EPS = 1e-6;
const EXTRA_PALLET_GAP_MM = 250;
const MAX_EXTRA_PALLETS = 128;

export function packAcrossMultiplePallets(
  safePallet: PalletInput,
  requestedCartons: CartonInput[],
  trialCount: number,
  mode: ExtraPalletMode,
  packSinglePallet: (pallet: PalletInput, cartons: CartonInput[]) => PackResult,
): { pallets: PackedPalletPlacement[]; remaining: CartonInput[] } {
  let remaining = cloneCartons(requestedCartons);
  const pallets: PackedPalletPlacement[] = [];
  let safety = 0;

  while (hasActiveCartons(remaining) && safety < MAX_EXTRA_PALLETS) {
    safety++;
    const unitsBefore = countUnpackedUnits(remaining);
    const single = pickBestSinglePalletResult({
      pallet: safePallet,
      remaining,
      trialCount,
      unitsBefore,
      eps: EPS,
      packSinglePallet,
    });
    const unitsAfter = countUnpackedUnits(single.unpacked);
    const packedOnThisPallet = unitsBefore - unitsAfter;

    if (pallets.length === 0 || packedOnThisPallet > 0) {
      const offset = crossOffsetForPallet(pallets.length, safePallet, EXTRA_PALLET_GAP_MM);
      pallets.push({
        index: pallets.length,
        offsetX: offset.x,
        offsetY: offset.y,
        result: single,
      });
    }

    remaining = cloneCartons(single.unpacked);
    if (!hasActiveCartons(remaining)) break;
    if (packedOnThisPallet <= 0) break;

    if (mode === "none") break;
    if (mode === "limitsOnly" && pallets.length === 1 && !reachesPalletHardLimit(single, safePallet, EPS)) {
      break;
    }
  }

  return {
    pallets,
    remaining,
  };
}

export function summarizeMultiPackResult(
  pallets: PackedPalletPlacement[],
  requestedCartons: CartonInput[],
  remaining: CartonInput[],
): MultiPackResult {
  const unpacked = cloneCartons(remaining);
  const totalWeight = pallets.reduce((sum, placed) => sum + placed.result.totalWeight, 0);
  const maxHeight = pallets.reduce((max, placed) => Math.max(max, placed.result.totalHeight), 0);
  const requestedUnits = countUnpackedUnits(requestedCartons);
  const unpackedUnits = countUnpackedUnits(unpacked);
  const packedUnits = Math.max(0, requestedUnits - unpackedUnits);

  return {
    pallets,
    totalWeight,
    maxHeight,
    unpacked,
    packedUnits,
    requestedUnits,
  };
}
