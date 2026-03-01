import {
  packPallet,
} from "./packer";
import type {
  CartonInput,
  MultiPackResult,
  PackResult,
  PalletInput,
  PalletPackingStyle,
} from "./packerTypes";

const TEMPLATE_LOCK_EXTRA_PALLET_GAP_MM = 250;
const TEMPLATE_LOCK_ADAPTIVE_MAX_PALLETS = 128;

export function countCartonUnits(cartons: CartonInput[]): number {
  return cartons.reduce((sum, carton) => sum + Math.max(0, Math.floor(carton.quantity)), 0);
}

function crossOffsetForTemplateSupplementary(index: number, pallet: PalletInput): { x: number; y: number } {
  if (index <= 0) return { x: 0, y: 0 };
  const ring = Math.floor((index - 1) / 4) + 1;
  const slot = (index - 1) % 4;
  const stepX = pallet.width + TEMPLATE_LOCK_EXTRA_PALLET_GAP_MM;
  const stepY = pallet.length + TEMPLATE_LOCK_EXTRA_PALLET_GAP_MM;

  if (slot === 0) return { x: ring * stepX, y: 0 };
  if (slot === 1) return { x: -ring * stepX, y: 0 };
  if (slot === 2) return { x: 0, y: ring * stepY };
  return { x: 0, y: -ring * stepY };
}

function isBetterSinglePalletPack(
  candidate: PackResult,
  candidatePacked: number,
  currentBest: PackResult,
  currentBestPacked: number,
): boolean {
  if (candidatePacked !== currentBestPacked) return candidatePacked > currentBestPacked;
  const candidateUnpacked = countCartonUnits(candidate.unpacked);
  const currentUnpacked = countCartonUnits(currentBest.unpacked);
  if (candidateUnpacked !== currentUnpacked) return candidateUnpacked < currentUnpacked;
  if (Math.abs(candidate.totalHeight - currentBest.totalHeight) > 1e-6) {
    return candidate.totalHeight < currentBest.totalHeight;
  }
  if (candidate.layers.length !== currentBest.layers.length) {
    return candidate.layers.length < currentBest.layers.length;
  }
  return candidate.totalWeight < currentBest.totalWeight - 1e-6;
}

export function packTemplateRemainderAdaptive(
  pallet: PalletInput,
  cartons: CartonInput[],
): { result: MultiPackResult; usedStyles: PalletPackingStyle[] } {
  const basePallet: PalletInput = {
    ...pallet,
    sampleGuidance: undefined,
    extraPalletMode: "full",
  };

  const requestedUnits = countCartonUnits(cartons);
  let remaining = cartons.map((carton) => ({ ...carton }));
  const pallets: MultiPackResult["pallets"] = [];
  const usedStyles: PalletPackingStyle[] = [];
  let totalWeight = 0;
  let maxHeight = 0;
  let safety = 0;

  while (countCartonUnits(remaining) > 0 && safety < TEMPLATE_LOCK_ADAPTIVE_MAX_PALLETS) {
    safety += 1;
    const unitsBefore = countCartonUnits(remaining);

    const edge = packPallet(
      { ...basePallet, packingStyle: "edgeAligned" },
      remaining.map((carton) => ({ ...carton })),
    );
    const center = packPallet(
      { ...basePallet, packingStyle: "centerCompact" },
      remaining.map((carton) => ({ ...carton })),
    );

    const edgePacked = unitsBefore - countCartonUnits(edge.unpacked);
    const centerPacked = unitsBefore - countCartonUnits(center.unpacked);

    let chosenStyle: PalletPackingStyle = "edgeAligned";
    let chosen = edge;
    let chosenPacked = edgePacked;

    if (isBetterSinglePalletPack(center, centerPacked, chosen, chosenPacked)) {
      chosenStyle = "centerCompact";
      chosen = center;
      chosenPacked = centerPacked;
    }

    if (chosenPacked <= 0) break;

    const offset = crossOffsetForTemplateSupplementary(pallets.length, basePallet);
    pallets.push({
      index: pallets.length,
      offsetX: offset.x,
      offsetY: offset.y,
      result: chosen,
    });
    usedStyles.push(chosenStyle);
    totalWeight += chosen.totalWeight;
    maxHeight = Math.max(maxHeight, chosen.totalHeight);
    remaining = chosen.unpacked.map((carton) => ({ ...carton }));
  }

  const unpacked = remaining.map((carton) => ({ ...carton }));
  const unpackedUnits = countCartonUnits(unpacked);

  return {
    result: {
      pallets,
      totalWeight,
      maxHeight,
      unpacked,
      packedUnits: Math.max(0, requestedUnits - unpackedUnits),
      requestedUnits,
    },
    usedStyles,
  };
}

export function mergeTemplateWithSupplementaryPallets(
  templateResult: MultiPackResult,
  supplementaryResult: MultiPackResult,
  pallet: PalletInput,
): MultiPackResult {
  if (supplementaryResult.pallets.length === 0) {
    return {
      ...templateResult,
      unpacked: supplementaryResult.unpacked.map((carton) => ({ ...carton })),
      packedUnits: Math.max(0, templateResult.requestedUnits - countCartonUnits(supplementaryResult.unpacked)),
    };
  }

  const templateMaxOffsetX = templateResult.pallets.reduce(
    (max, placed) => Math.max(max, placed.offsetX),
    0,
  );
  const supplementaryMinOffsetX = supplementaryResult.pallets.reduce(
    (min, placed) => Math.min(min, placed.offsetX),
    0,
  );
  const shiftX = (templateMaxOffsetX + pallet.width + TEMPLATE_LOCK_EXTRA_PALLET_GAP_MM) - supplementaryMinOffsetX;

  const shiftedSupplementary = supplementaryResult.pallets.map((placed, idx) => ({
    ...placed,
    index: templateResult.pallets.length + idx,
    offsetX: placed.offsetX + shiftX,
  }));
  const unpacked = supplementaryResult.unpacked.map((carton) => ({ ...carton }));
  const requestedUnits = templateResult.requestedUnits;
  const unpackedUnits = countCartonUnits(unpacked);

  return {
    pallets: [...templateResult.pallets, ...shiftedSupplementary],
    totalWeight: templateResult.totalWeight + supplementaryResult.totalWeight,
    maxHeight: Math.max(templateResult.maxHeight, supplementaryResult.maxHeight),
    unpacked,
    packedUnits: Math.max(0, requestedUnits - unpackedUnits),
    requestedUnits,
  };
}

export function isBetterMultiPackResult(candidate: MultiPackResult, current: MultiPackResult): boolean {
  if (candidate.packedUnits !== current.packedUnits) return candidate.packedUnits > current.packedUnits;
  const candidateUnpacked = countCartonUnits(candidate.unpacked);
  const currentUnpacked = countCartonUnits(current.unpacked);
  if (candidateUnpacked !== currentUnpacked) return candidateUnpacked < currentUnpacked;
  if (candidate.pallets.length !== current.pallets.length) return candidate.pallets.length < current.pallets.length;
  if (Math.abs(candidate.maxHeight - current.maxHeight) > 1e-6) return candidate.maxHeight < current.maxHeight;
  return candidate.totalWeight < current.totalWeight - 1e-6;
}
