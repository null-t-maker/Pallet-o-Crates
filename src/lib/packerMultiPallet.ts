import type {
  CartonInput,
  ExtraPalletMode,
  MultiPackResult,
  PackResult,
  PackedPalletPlacement,
  PalletInput,
} from "./packerTypes";

const EPS = 1e-6;
const EXTRA_PALLET_GAP_MM = 250;
const MAX_EXTRA_PALLETS = 128;

function hasActiveCartons(cartons: CartonInput[]): boolean {
  return cartons.some((carton) => carton.quantity > 0);
}

function cloneCartons(cartons: CartonInput[]): CartonInput[] {
  return cartons.map((carton) => ({ ...carton }));
}

function countUnpackedUnits(cartons: CartonInput[]): number {
  return cartons.reduce((sum, carton) => sum + Math.max(0, Math.floor(carton.quantity)), 0);
}

function isTrialPackBetter(
  trialResult: PackResult,
  trialPacked: number,
  bestPacked: number,
  bestHeight: number,
  bestLayers: number,
): boolean {
  return trialPacked > bestPacked
    || (
      trialPacked === bestPacked
      && (
        trialResult.totalHeight < bestHeight - EPS
        || (
          Math.abs(trialResult.totalHeight - bestHeight) <= EPS
          && trialResult.layers.length < bestLayers
        )
      )
    );
}

function pickBestSinglePalletResult(
  pallet: PalletInput,
  remaining: CartonInput[],
  trialCount: number,
  unitsBefore: number,
  packSinglePallet: (pallet: PalletInput, cartons: CartonInput[]) => PackResult,
): PackResult {
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
    if (!isTrialPackBetter(trialResult, trialPacked, bestPacked, bestHeight, bestLayers)) {
      continue;
    }
    bestResult = trialResult;
    bestPacked = trialPacked;
    bestHeight = trialResult.totalHeight;
    bestLayers = trialResult.layers.length;
  }

  return bestResult;
}

function reachesPalletHardLimit(result: PackResult, pallet: PalletInput): boolean {
  return result.totalWeight >= pallet.maxWeight - EPS
    || result.totalHeight >= pallet.maxHeight - EPS;
}

function crossOffsetForPallet(index: number, pallet: PalletInput): { x: number; y: number } {
  if (index <= 0) return { x: 0, y: 0 };
  const ring = Math.floor((index - 1) / 4) + 1;
  const slot = (index - 1) % 4;
  const stepX = pallet.width + EXTRA_PALLET_GAP_MM;
  const stepY = pallet.length + EXTRA_PALLET_GAP_MM;

  if (slot === 0) return { x: ring * stepX, y: 0 };
  if (slot === 1) return { x: -ring * stepX, y: 0 };
  if (slot === 2) return { x: 0, y: ring * stepY };
  return { x: 0, y: -ring * stepY };
}

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
    const single = pickBestSinglePalletResult(
      safePallet,
      remaining,
      trialCount,
      unitsBefore,
      packSinglePallet,
    );
    const unitsAfter = countUnpackedUnits(single.unpacked);
    const packedOnThisPallet = unitsBefore - unitsAfter;

    if (pallets.length === 0 || packedOnThisPallet > 0) {
      const offset = crossOffsetForPallet(pallets.length, safePallet);
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
    if (mode === "limitsOnly" && pallets.length === 1 && !reachesPalletHardLimit(single, safePallet)) {
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
