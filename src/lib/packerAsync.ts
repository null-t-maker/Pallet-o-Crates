import { packPallet } from "./packer";
import {
  createCandidateSearchDeps,
  createDeterministicDeps,
  createHeuristicRunnerDeps,
  createPackPalletSharedDeps,
} from "./packerPackPalletDeps";
import {
  packInterchangeableTypesAsUnified,
  packSingleTypeDeterministic,
} from "./packerDeterministic";
import { runHeuristicLayerStep } from "./packerHeuristicLayerStep";
import {
  buildPackResult,
  prepareRemainingCartons,
  tryInitialShortcutPack,
} from "./packerSinglePalletFlow";
import {
  maybeUseEdgeFallbackForCenterStyle,
  normalizeCartonsForPacking,
} from "./packerSinglePalletFlow";
import {
  computeTotalPackedHeight,
  countUnpackedUnits,
  sanitizeCarton,
} from "./packerShared";
import {
  cloneCartons,
  crossOffsetForPallet,
  hasActiveCartons,
  reachesPalletHardLimit,
} from "./packerMultiPalletHelpers";
import { normalizePalletForPacking, resolveExtraPalletMode, resolveSampleGuidance } from "./packerConfig";
import type {
  CartonInput,
  ExtraPalletMode,
  Layer,
  MultiPackResult,
  PackResult,
  PackedCarton,
  PackedPalletPlacement,
  PalletInput,
} from "./packerTypes";
import type { Pattern } from "./packerCoreTypes";
import type { HeuristicRunnerDeps } from "./packerHeuristicCore";
import {
  collectSupportAndBlockedAtZ,
  createInitialLayerState,
  updateStateAfterCommittedLayer,
} from "./packerHeuristicState";
import type { PackingProgressReporter, PackingProgressStage } from "./packingProgress";

const EPS = 1e-6;
const EXTRA_PALLET_GAP_MM = 250;
const MAX_EXTRA_PALLETS = 128;

interface PackRunContext {
  reporter?: PackingProgressReporter | null;
  stage: PackingProgressStage;
  packedUnitsBase: number;
  palletIndex: number;
  trialIndex?: number;
  trialCount?: number;
  detail?: string;
}

function throwIfCancelled(reporter?: PackingProgressReporter | null): void {
  reporter?.throwIfCancelled();
}

async function reportProgress(
  context: PackRunContext,
  packedUnits: number,
  layerIndex?: number,
  options?: { force?: boolean; yieldToUi?: boolean; detail?: string; stage?: PackingProgressStage },
): Promise<void> {
  if (!context.reporter) return;
  throwIfCancelled(context.reporter);
  const trialProgress = typeof context.trialCount === "number" && context.trialCount > 1
    ? {
      trialIndex: context.trialIndex,
      trialCount: context.trialCount,
    }
    : {};
  await context.reporter.report({
    stage: options?.stage ?? context.stage,
    packedUnits,
    detail: options?.detail ?? context.detail,
    palletIndex: context.palletIndex,
    layerIndex,
    ...trialProgress,
  }, options);
}

async function runHeuristicLayerPackingAsync(
  safePallet: PalletInput,
  rem: CartonInput[],
  deps: HeuristicRunnerDeps,
  context: PackRunContext,
): Promise<{ layers: Layer[]; placed: PackedCarton[]; totalWeight: number }> {
  const layers: Layer[] = [];
  const placed: PackedCarton[] = [];
  let totalWeight = 0;
  let zBase = 0;
  let safety = 0;

  const state = createInitialLayerState();
  const patternCache = new Map<string, Pattern[]>();
  const unitsBefore = countUnpackedUnits(rem);

  await reportProgress(context, context.packedUnitsBase, 0, { force: true, yieldToUi: true });

  while (rem.some((carton) => carton.quantity > 0) && safety < 800) {
    throwIfCancelled(context.reporter);
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
      await reportProgress(
        context,
        context.packedUnitsBase + (unitsBefore - countUnpackedUnits(rem)),
        layers.length,
      );
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

    const packedUnits = context.packedUnitsBase + (unitsBefore - countUnpackedUnits(rem));
    await reportProgress(context, packedUnits, layers.length);

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

async function packPalletAsyncInternal(
  pallet: PalletInput,
  cartons: CartonInput[],
  context: PackRunContext,
  allowCenterFallback: boolean,
): Promise<PackResult> {
  const safePallet = normalizePalletForPacking(pallet);
  throwIfCancelled(context.reporter);
  const rem = prepareRemainingCartons(cartons, sanitizeCarton);
  const shared = createPackPalletSharedDeps();
  const deterministicDeps = createDeterministicDeps(shared, packPallet);

  const shortcut = tryInitialShortcutPack(safePallet, rem, {
    packInterchangeableTypesAsUnified: (palletInput, activeCartons) => (
      packInterchangeableTypesAsUnified(palletInput, activeCartons, deterministicDeps)
    ),
    packSingleTypeDeterministic: (palletInput, cartonInput) => (
      packSingleTypeDeterministic(palletInput, cartonInput, deterministicDeps)
    ),
  });
  if (shortcut) {
    await reportProgress(
      context,
      context.packedUnitsBase + (countUnpackedUnits(cartons) - countUnpackedUnits(shortcut.unpacked)),
      shortcut.layers.length,
      { force: true },
    );
    return shortcut;
  }

  const candidateSearchDeps = createCandidateSearchDeps(shared);
  const heuristicDeps = createHeuristicRunnerDeps(shared, candidateSearchDeps);
  const packed = await runHeuristicLayerPackingAsync(safePallet, rem, heuristicDeps, context);
  const result = buildPackResult(
    packed.layers,
    packed.totalWeight,
    packed.placed,
    rem,
    computeTotalPackedHeight,
  );

  if (!allowCenterFallback) {
    return result;
  }

  if (safePallet.packingStyle !== "centerCompact") {
    return result;
  }

  await reportProgress(context, context.packedUnitsBase + (countUnpackedUnits(cartons) - countUnpackedUnits(result.unpacked)), result.layers.length, {
    force: true,
    yieldToUi: true,
    stage: "comparingFallback",
  });

  const edgeResult = await packPalletAsyncInternal(
    { ...safePallet, packingStyle: "edgeAligned" },
    cartons.map((carton) => ({ ...carton })),
    {
      ...context,
      detail: "edge-aligned fallback",
    },
    false,
  );

  return maybeUseEdgeFallbackForCenterStyle(safePallet, cartons, result, {
    countUnpackedUnits,
    packSinglePallet: () => edgeResult,
  });
}

async function packSinglePalletAsync(
  pallet: PalletInput,
  cartons: CartonInput[],
  context: PackRunContext,
): Promise<PackResult> {
  return packPalletAsyncInternal(pallet, cartons, context, true);
}

async function pickBestSinglePalletResultAsync({
  pallet,
  remaining,
  trialCount,
  unitsBefore,
  packContext,
}: {
  pallet: PalletInput;
  remaining: CartonInput[];
  trialCount: number;
  unitsBefore: number;
  packContext: Omit<PackRunContext, "trialIndex" | "trialCount">;
}): Promise<PackResult> {
  let bestResult = await packSinglePalletAsync(pallet, cloneCartons(remaining), {
    ...packContext,
    trialIndex: 1,
    trialCount,
  });
  if (trialCount <= 1 || !pallet.sampleGuidance) {
    return bestResult;
  }

  let bestPacked = unitsBefore - countUnpackedUnits(bestResult.unpacked);
  let bestHeight = bestResult.totalHeight;
  let bestLayers = bestResult.layers.length;

  for (let trial = 1; trial < trialCount; trial++) {
    throwIfCancelled(packContext.reporter);
    const trialPallet: PalletInput = {
      ...pallet,
      sampleGuidance: {
        ...pallet.sampleGuidance,
        trialIndex: trial,
      },
    };
    await reportProgress(packContext, packContext.packedUnitsBase, undefined, {
      force: true,
      yieldToUi: true,
    });
    const trialResult = await packSinglePalletAsync(trialPallet, cloneCartons(remaining), {
      ...packContext,
      trialIndex: trial + 1,
      trialCount,
    });
    const trialPacked = unitsBefore - countUnpackedUnits(trialResult.unpacked);
    const isBetter = trialPacked > bestPacked
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
    if (!isBetter) continue;
    bestResult = trialResult;
    bestPacked = trialPacked;
    bestHeight = trialResult.totalHeight;
    bestLayers = trialResult.layers.length;
  }

  return bestResult;
}

async function packAcrossMultiplePalletsAsync(
  safePallet: PalletInput,
  requestedCartons: CartonInput[],
  trialCount: number,
  mode: ExtraPalletMode,
  reporter?: PackingProgressReporter | null,
): Promise<{ pallets: PackedPalletPlacement[]; remaining: CartonInput[] }> {
  let remaining = cloneCartons(requestedCartons);
  const pallets: PackedPalletPlacement[] = [];
  let safety = 0;
  const requestedUnits = countUnpackedUnits(requestedCartons);

  while (hasActiveCartons(remaining) && safety < MAX_EXTRA_PALLETS) {
    throwIfCancelled(reporter);
    safety++;
    const unitsBefore = countUnpackedUnits(remaining);
    const basePackedUnits = requestedUnits - unitsBefore;
    const single = await pickBestSinglePalletResultAsync({
      pallet: safePallet,
      remaining,
      trialCount,
      unitsBefore,
      packContext: {
        reporter,
        stage: "packingLayout",
        packedUnitsBase: basePackedUnits,
        palletIndex: pallets.length + 1,
      },
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

export async function packPalletsAsync(
  pallet: PalletInput,
  cartons: CartonInput[],
  reporter?: PackingProgressReporter | null,
): Promise<MultiPackResult> {
  throwIfCancelled(reporter);
  const safePallet = normalizePalletForPacking(pallet);
  const mode = resolveExtraPalletMode(safePallet);
  const resolvedGuidance = resolveSampleGuidance(safePallet);
  const trialCount = resolvedGuidance ? resolvedGuidance.searchSteps : 1;
  const requestedCartons = normalizeCartonsForPacking(cartons, sanitizeCarton);
  const packed = await packAcrossMultiplePalletsAsync(
    safePallet,
    requestedCartons,
    trialCount,
    mode,
    reporter,
  );

  const unpacked = cloneCartons(packed.remaining);
  const totalWeight = packed.pallets.reduce((sum, placed) => sum + placed.result.totalWeight, 0);
  const maxHeight = packed.pallets.reduce((max, placed) => Math.max(max, placed.result.totalHeight), 0);
  const requestedUnits = countUnpackedUnits(requestedCartons);
  const unpackedUnits = countUnpackedUnits(unpacked);
  const packedUnits = Math.max(0, requestedUnits - unpackedUnits);

  return {
    pallets: packed.pallets,
    totalWeight,
    maxHeight,
    unpacked,
    packedUnits,
    requestedUnits,
  };
}
