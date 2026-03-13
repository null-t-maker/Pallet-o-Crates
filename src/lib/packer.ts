import { packAcrossMultiplePallets, summarizeMultiPackResult } from "./packerMultiPallet";
import {
  normalizePalletForPacking,
  resolveExtraPalletMode,
  resolveSampleGuidance,
} from "./packerConfig";
import type {
  CartonInput,
  MultiPackResult,
  PackResult,
  PalletInput,
} from "./packerTypes";
import {
  buildPackResult,
  maybeUseEdgeFallbackForCenterStyle,
  normalizeCartonsForPacking,
  prepareRemainingCartons,
} from "./packerSinglePalletFlow";
import {
  computeTotalPackedHeight,
  countUnpackedUnits,
  sanitizeCarton,
} from "./packerShared";
import { createPackPalletPipeline } from "./packerPackPalletPipeline";

export type {
  CartonInput,
  CartonUprightPolicy,
  ExtraPalletMode,
  Layer,
  ManualSpawnLevel,
  MultiPackResult,
  PackResult,
  PackSampleGuidance,
  PackedCarton,
  PackedPalletPlacement,
  PalletInput,
  PalletPackingStyle,
  SampleGuidanceFilter,
  SampleGuidanceMode,
} from "./packerTypes";

export function packPallet(pallet: PalletInput, cartons: CartonInput[]): PackResult {
  const safePallet = normalizePalletForPacking(pallet);
  const rem = prepareRemainingCartons(cartons, sanitizeCarton);
  const pipeline = createPackPalletPipeline(packPallet);

  const shortcut = pipeline.tryShortcutPack(safePallet, rem);
  if (shortcut) return shortcut;

  const packed = pipeline.runHeuristicPack(safePallet, rem);
  const result = buildPackResult(
    packed.layers,
    packed.totalWeight,
    packed.placed,
    rem,
    computeTotalPackedHeight,
  );

  return maybeUseEdgeFallbackForCenterStyle(safePallet, cartons, result, {
    countUnpackedUnits,
    packSinglePallet: packPallet,
  });
}

export function packPallets(pallet: PalletInput, cartons: CartonInput[]): MultiPackResult {
  const safePallet = normalizePalletForPacking(pallet);
  const mode = resolveExtraPalletMode(safePallet);
  const resolvedGuidance = resolveSampleGuidance(safePallet);
  const trialCount = resolvedGuidance ? resolvedGuidance.searchSteps : 1;
  const requestedCartons = normalizeCartonsForPacking(cartons, sanitizeCarton);
  const packed = packAcrossMultiplePallets(safePallet, requestedCartons, trialCount, mode, packPallet);
  return summarizeMultiPackResult(packed.pallets, requestedCartons, packed.remaining);
}
