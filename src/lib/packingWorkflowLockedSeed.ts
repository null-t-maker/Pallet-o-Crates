import {
  createCandidateSearchDeps,
  createHeuristicRunnerDeps,
  createPackPalletSharedDeps,
} from "./packerPackPalletDeps";
import { runHeuristicLayerStep } from "./packerHeuristicLayerStep";
import {
  collectSupportAndBlockedAtZ,
  createInitialLayerState,
  updateStateAfterCommittedLayer,
} from "./packerHeuristicState";
import { buildPackResult, prepareRemainingCartons } from "./packerSinglePalletFlow";
import { computeTotalPackedHeight, sanitizeCarton } from "./packerShared";
import type {
  CartonInput,
  Layer,
  MultiPackResult,
  PackSampleGuidance,
  PackResult,
  PackedCarton,
  PalletInput,
} from "./packerTypes";
import type { Pattern } from "./packerCoreTypes";
import { buildManualGenerationSeedResult } from "./manualGenerationSeed";
import { reachesPalletHardLimit, countUnpackedUnits } from "./packerMultiPalletHelpers";
import {
  applySampleGuidance,
  calculateGuidedWithFallback,
  calculateGuidedWithFallbackAsync,
} from "./packingWorkflowGuidance";
import { mergeTemplateWithSupplementaryPallets } from "./templateLock";
import {
  buildPalletResultsFromFinalizedPlacements,
  type FinalTemplatePlacement,
} from "./templateLockFinalization";
import { normalizePalletForPacking } from "./packerConfig";
import type { PackingProgressReporter } from "./packingProgress";
import { buildGenerationLockedSeedResult } from "./generationLockedSeed";

const EPS = 1e-6;

function cloneLayers(layers: Layer[]): Layer[] {
  return layers.map((layer) => ({
    ...layer,
    cartons: layer.cartons.map((carton) => ({ ...carton })),
  }));
}

function clonePlacedCartons(result: MultiPackResult | null): PackedCarton[] {
  return result?.pallets[0]?.result.layers.flatMap((layer) => layer.cartons.map((carton) => ({ ...carton }))) ?? [];
}

function collectSeedBlockedAtZ(
  placed: PackedCarton[],
  zBase: number,
): ReturnType<typeof collectSupportAndBlockedAtZ> {
  const collected = collectSupportAndBlockedAtZ(placed, zBase, EPS);
  for (const carton of placed) {
    const top = carton.z + carton.h;
    if (Math.abs(carton.z - zBase) <= 0.25 && top > zBase + EPS) {
      collected.blockedAtZ.push({
        x: carton.x,
        y: carton.y,
        w: carton.w,
        l: carton.l,
      });
    }
  }
  return collected;
}

function rebuildSingleSeededPackResult(
  pallet: PalletInput,
  placed: PackedCarton[],
  remaining: CartonInput[],
  fallbackLayers: Layer[],
  fallbackWeight: number,
): PackResult {
  const finalizedPlacements: FinalTemplatePlacement[] = placed.map((carton) => ({
    carton,
    palletIndex: 0,
    offsetX: 0,
    offsetY: 0,
    matchedShapeKey: null,
    assignedTypeId: carton.typeId,
  }));
  const rebuiltPallets = buildPalletResultsFromFinalizedPlacements(finalizedPlacements, pallet);
  const rebuilt = rebuiltPallets?.[0]?.result;
  if (!rebuilt) {
    return buildPackResult(
      fallbackLayers,
      fallbackWeight,
      placed,
      remaining,
      computeTotalPackedHeight,
    );
  }

  return {
    ...rebuilt,
    unpacked: remaining.filter((carton) => carton.quantity > 0).map((carton) => ({ ...carton })),
  };
}

function packMissingAroundSeededFirstPallet(
  pallet: PalletInput,
  seedResult: MultiPackResult,
): PackResult {
  const safePallet = normalizePalletForPacking(pallet);
  const shared = createPackPalletSharedDeps();
  const candidateSearchDeps = createCandidateSearchDeps(shared);
  const heuristicDeps = createHeuristicRunnerDeps(shared, candidateSearchDeps);
  const seedPallet = seedResult.pallets[0]?.result;
  const layers = cloneLayers(seedPallet?.layers ?? []);
  const placed = clonePlacedCartons(seedResult);
  const remaining = prepareRemainingCartons(seedResult.unpacked.map((carton) => ({ ...carton })), sanitizeCarton);
  const state = createInitialLayerState();
  state.layerIndex = layers.length;

  let totalWeight = seedPallet?.totalWeight ?? 0;
  let zBase = 0;
  let safety = 0;
  const patternCache = new Map<string, Pattern[]>();

  while (remaining.some((carton) => carton.quantity > 0) && safety < 800) {
    safety += 1;
    if (zBase > safePallet.maxHeight + EPS) break;

    const remainingWeight = safePallet.maxWeight - totalWeight;
    if (remainingWeight <= EPS) break;

    const { supportAtZ, blockedAtZ } = collectSeedBlockedAtZ(placed, zBase);
    state.prevPlacements = supportAtZ;

    const step = runHeuristicLayerStep({
      safePallet,
      rem: remaining,
      placed,
      state,
      patternCache,
      blockedAtZ,
      zBase,
      totalWeight,
      EPS,
      deps: heuristicDeps,
    });
    totalWeight = step.totalWeight;

    if (!step.seeded) {
      const nextZ = heuristicDeps.findNextZBase(placed, zBase);
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
      remaining,
      heuristicDeps,
    );

    const nextZ = heuristicDeps.findNextZBase(placed, zBase);
    if (nextZ === null || nextZ > safePallet.maxHeight + EPS) break;
    zBase = nextZ;
  }

  return rebuildSingleSeededPackResult(
    safePallet,
    placed,
    remaining,
    layers,
    totalWeight,
  );
}

function pickBestSeededFirstPalletResult(
  pallet: PalletInput,
  seedResult: MultiPackResult,
): PackResult {
  const base = packMissingAroundSeededFirstPallet(pallet, seedResult);
  const searchSteps = Math.max(1, Math.floor(pallet.sampleGuidance?.searchSteps ?? 1));
  if (!pallet.sampleGuidance || searchSteps <= 1) {
    return base;
  }

  const unitsBefore = countUnpackedUnits(seedResult.unpacked);
  let best = base;
  let bestPacked = unitsBefore - countUnpackedUnits(base.unpacked);

  for (let trialIndex = 1; trialIndex < searchSteps; trialIndex += 1) {
    const trialPallet: PalletInput = {
      ...pallet,
      sampleGuidance: {
        ...pallet.sampleGuidance,
        trialIndex,
      },
    };
    const candidate = packMissingAroundSeededFirstPallet(trialPallet, seedResult);
    const candidatePacked = unitsBefore - countUnpackedUnits(candidate.unpacked);
    if (candidatePacked > bestPacked) {
      best = candidate;
      bestPacked = candidatePacked;
      continue;
    }
    if (candidatePacked !== bestPacked) continue;
    if (candidate.totalHeight < best.totalHeight - EPS) {
      best = candidate;
      continue;
    }
    if (Math.abs(candidate.totalHeight - best.totalHeight) <= EPS && candidate.layers.length < best.layers.length) {
      best = candidate;
    }
  }

  return best;
}

async function packMissingAroundSeededFirstPalletAsync(
  pallet: PalletInput,
  seedResult: MultiPackResult,
  progressReporter?: PackingProgressReporter | null,
  trialIndex?: number,
  trialCount?: number,
): Promise<PackResult> {
  progressReporter?.throwIfCancelled();
  const safePallet = normalizePalletForPacking(pallet);
  const shared = createPackPalletSharedDeps();
  const candidateSearchDeps = createCandidateSearchDeps(shared);
  const heuristicDeps = createHeuristicRunnerDeps(shared, candidateSearchDeps);
  const seedPallet = seedResult.pallets[0]?.result;
  const layers = cloneLayers(seedPallet?.layers ?? []);
  const placed = clonePlacedCartons(seedResult);
  const remaining = prepareRemainingCartons(seedResult.unpacked.map((carton) => ({ ...carton })), sanitizeCarton);
  const state = createInitialLayerState();
  state.layerIndex = layers.length;

  let totalWeight = seedPallet?.totalWeight ?? 0;
  let zBase = 0;
  let safety = 0;
  const patternCache = new Map<string, Pattern[]>();
  const unitsBefore = countUnpackedUnits(seedResult.unpacked);
  const basePackedUnits = seedResult.requestedUnits - unitsBefore;

  if (progressReporter) {
    await progressReporter.report({
      stage: "packingLayout",
      packedUnits: basePackedUnits,
      palletIndex: 1,
      trialIndex,
      trialCount,
      layerIndex: layers.length,
    }, { force: true, yieldToUi: true });
  }

  while (remaining.some((carton) => carton.quantity > 0) && safety < 800) {
    progressReporter?.throwIfCancelled();
    safety += 1;
    if (zBase > safePallet.maxHeight + EPS) break;

    const remainingWeight = safePallet.maxWeight - totalWeight;
    if (remainingWeight <= EPS) break;

    const { supportAtZ, blockedAtZ } = collectSeedBlockedAtZ(placed, zBase);
    state.prevPlacements = supportAtZ;

    const step = runHeuristicLayerStep({
      safePallet,
      rem: remaining,
      placed,
      state,
      patternCache,
      blockedAtZ,
      zBase,
      totalWeight,
      EPS,
      deps: heuristicDeps,
    });
    totalWeight = step.totalWeight;

    if (!step.seeded) {
      const nextZ = heuristicDeps.findNextZBase(placed, zBase);
      if (nextZ === null || nextZ > safePallet.maxHeight + EPS) break;
      zBase = nextZ;
      if (progressReporter) {
        await progressReporter.report({
          stage: "packingLayout",
          packedUnits: basePackedUnits + (unitsBefore - countUnpackedUnits(remaining)),
          palletIndex: 1,
          trialIndex,
          trialCount,
          layerIndex: layers.length,
        });
      }
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
      remaining,
      heuristicDeps,
    );

    if (progressReporter) {
      await progressReporter.report({
        stage: "packingLayout",
        packedUnits: basePackedUnits + (unitsBefore - countUnpackedUnits(remaining)),
        palletIndex: 1,
        trialIndex,
        trialCount,
        layerIndex: layers.length,
      });
    }

    const nextZ = heuristicDeps.findNextZBase(placed, zBase);
    if (nextZ === null || nextZ > safePallet.maxHeight + EPS) break;
    zBase = nextZ;
  }

  return rebuildSingleSeededPackResult(
    safePallet,
    placed,
    remaining,
    layers,
    totalWeight,
  );
}

async function pickBestSeededFirstPalletResultAsync(
  pallet: PalletInput,
  seedResult: MultiPackResult,
  progressReporter?: PackingProgressReporter | null,
): Promise<PackResult> {
  progressReporter?.throwIfCancelled();
  const base = await packMissingAroundSeededFirstPalletAsync(
    pallet,
    seedResult,
    progressReporter,
    1,
    Math.max(1, Math.floor(pallet.sampleGuidance?.searchSteps ?? 1)),
  );
  const searchSteps = Math.max(1, Math.floor(pallet.sampleGuidance?.searchSteps ?? 1));
  if (!pallet.sampleGuidance || searchSteps <= 1) {
    return base;
  }

  const unitsBefore = countUnpackedUnits(seedResult.unpacked);
  let best = base;
  let bestPacked = unitsBefore - countUnpackedUnits(base.unpacked);

  for (let trialIndex = 1; trialIndex < searchSteps; trialIndex += 1) {
    progressReporter?.throwIfCancelled();
    if (progressReporter) {
      await progressReporter.report({
        stage: "packingLayout",
        packedUnits: seedResult.requestedUnits - unitsBefore,
        palletIndex: 1,
        trialIndex: trialIndex + 1,
        trialCount: searchSteps,
      }, { force: true, yieldToUi: true });
    }
    const trialPallet: PalletInput = {
      ...pallet,
      sampleGuidance: {
        ...pallet.sampleGuidance,
        trialIndex,
      },
    };
    const candidate = await packMissingAroundSeededFirstPalletAsync(
      trialPallet,
      seedResult,
      progressReporter,
      trialIndex + 1,
      searchSteps,
    );
    const candidatePacked = unitsBefore - countUnpackedUnits(candidate.unpacked);
    if (candidatePacked > bestPacked) {
      best = candidate;
      bestPacked = candidatePacked;
      continue;
    }
    if (candidatePacked !== bestPacked) continue;
    if (candidate.totalHeight < best.totalHeight - EPS) {
      best = candidate;
      continue;
    }
    if (Math.abs(candidate.totalHeight - best.totalHeight) <= EPS && candidate.layers.length < best.layers.length) {
      best = candidate;
    }
  }

  return best;
}

function buildSeededFirstPalletResult(
  seedResult: MultiPackResult,
  firstPallet: PackResult,
): MultiPackResult {
  const unpacked = firstPallet.unpacked.map((carton) => ({ ...carton }));
  const unpackedUnits = countUnpackedUnits(unpacked);

  return {
    pallets: [{
      index: 0,
      offsetX: 0,
      offsetY: 0,
      result: firstPallet,
    }],
    totalWeight: firstPallet.totalWeight,
    maxHeight: firstPallet.totalHeight,
    unpacked,
    packedUnits: Math.max(0, seedResult.requestedUnits - unpackedUnits),
    requestedUnits: seedResult.requestedUnits,
  };
}

export interface CalculateMissingCartonsResult {
  result: MultiPackResult;
  lockedStatus: string | null;
}

export async function calculateMissingCartonsFromManualSeedAsync({
  pallet,
  cartons,
  manualCartons,
  sampleGuidance,
  progressReporter,
}: {
  pallet: PalletInput;
  cartons: CartonInput[];
  manualCartons: PackedCarton[];
  sampleGuidance: PackSampleGuidance | null;
  progressReporter?: PackingProgressReporter | null;
}): Promise<CalculateMissingCartonsResult> {
  progressReporter?.throwIfCancelled();
  const nextPallet = normalizePalletForPacking(applySampleGuidance(pallet, sampleGuidance ?? null));
  if (progressReporter) {
    await progressReporter.report({
      stage: "analyzingManualSeed",
      packedUnits: 0,
    }, { force: true, yieldToUi: true });
  }
  const seed = buildManualGenerationSeedResult({
    pallet,
    cartons,
    manualCartons,
  });
  if (!seed.seedResult) {
    return {
      result: await calculateGuidedWithFallbackAsync(nextPallet, cartons, sampleGuidance ?? null, progressReporter),
      lockedStatus: "Locked manual seed: no valid locked cartons found",
    };
  }

  const preserved = seed.lockedCartons.length;
  const ignored = seed.ignoredCartons.length;
  const lockedStatus = ignored > 0
    ? `Locked manual seed: preserved ${preserved}, ignored ${ignored}`
    : `Locked manual seed: preserved ${preserved}`;

  if (progressReporter) {
    await progressReporter.report({
      stage: "analyzingManualSeed",
      packedUnits: seed.seedResult.packedUnits,
      detail: lockedStatus,
    }, { force: true, yieldToUi: true });
  }

  if (countUnpackedUnits(seed.seedResult.unpacked) <= 0) {
    return {
      result: seed.seedResult,
      lockedStatus,
    };
  }

  const firstPallet = await pickBestSeededFirstPalletResultAsync(
    nextPallet,
    seed.seedResult,
    progressReporter,
  );
  const seededResult = buildSeededFirstPalletResult(seed.seedResult, firstPallet);

  if (countUnpackedUnits(firstPallet.unpacked) <= 0) {
    return {
      result: seededResult,
      lockedStatus,
    };
  }

  if (nextPallet.extraPalletMode === "none") {
    return {
      result: seededResult,
      lockedStatus,
    };
  }

  if (
    nextPallet.extraPalletMode === "limitsOnly"
    && !reachesPalletHardLimit(firstPallet, nextPallet, EPS)
  ) {
    return {
      result: seededResult,
      lockedStatus,
    };
  }

  if (progressReporter) {
    await progressReporter.report({
      stage: "packingSupplementary",
      packedUnits: seededResult.packedUnits,
      detail: lockedStatus,
    }, { force: true, yieldToUi: true });
  }
  progressReporter?.throwIfCancelled();

  const supplementary = await calculateGuidedWithFallbackAsync(
    nextPallet,
    firstPallet.unpacked.map((carton) => ({ ...carton })),
    sampleGuidance ?? null,
    progressReporter,
  );

  return {
    result: mergeTemplateWithSupplementaryPallets(seededResult, supplementary, nextPallet),
    lockedStatus,
  };
}

export async function calculateMissingCartonsFromGenerationSeedAsync({
  pallet,
  cartons,
  generationResult,
  sampleGuidance,
  progressReporter,
}: {
  pallet: PalletInput;
  cartons: CartonInput[];
  generationResult: MultiPackResult | null;
  sampleGuidance: PackSampleGuidance | null;
  progressReporter?: PackingProgressReporter | null;
}): Promise<CalculateMissingCartonsResult> {
  progressReporter?.throwIfCancelled();
  const nextPallet = normalizePalletForPacking(applySampleGuidance(pallet, sampleGuidance ?? null));
  if (progressReporter) {
    await progressReporter.report({
      stage: "analyzingManualSeed",
      packedUnits: 0,
      detail: "Analyzing current layout",
    }, { force: true, yieldToUi: true });
  }

  const seed = buildGenerationLockedSeedResult({
    pallet,
    cartons,
    result: generationResult,
  });

  if (!seed.seedResult) {
    return {
      result: await calculateGuidedWithFallbackAsync(nextPallet, cartons, sampleGuidance ?? null, progressReporter),
      lockedStatus: generationResult
        ? "Locked generation seed: no valid locked cartons found"
        : "Locked generation seed: no current layout to preserve",
    };
  }

  const preserved = seed.lockedCartons.length;
  const ignored = seed.ignoredCartons.length;
  const lockedStatus = ignored > 0
    ? `Locked generation seed: preserved ${preserved}, ignored ${ignored}`
    : `Locked generation seed: preserved ${preserved}`;

  if (progressReporter) {
    await progressReporter.report({
      stage: "analyzingManualSeed",
      packedUnits: seed.seedResult.packedUnits,
      detail: lockedStatus,
    }, { force: true, yieldToUi: true });
  }

  if (countUnpackedUnits(seed.seedResult.unpacked) <= 0) {
    return {
      result: seed.seedResult,
      lockedStatus,
    };
  }

  const seededResult = seed.seedResult.pallets.length === 1
    ? buildSeededFirstPalletResult(
      seed.seedResult,
      await pickBestSeededFirstPalletResultAsync(nextPallet, seed.seedResult, progressReporter),
    )
    : seed.seedResult;

  if (countUnpackedUnits(seededResult.unpacked) <= 0) {
    return {
      result: seededResult,
      lockedStatus,
    };
  }

  if (nextPallet.extraPalletMode === "none") {
    return {
      result: seededResult,
      lockedStatus,
    };
  }

  const guardPallet = seededResult.pallets[seededResult.pallets.length - 1]?.result ?? null;
  if (
    nextPallet.extraPalletMode === "limitsOnly"
    && guardPallet
    && !reachesPalletHardLimit(guardPallet, nextPallet, EPS)
  ) {
    return {
      result: seededResult,
      lockedStatus,
    };
  }

  if (progressReporter) {
    await progressReporter.report({
      stage: "packingSupplementary",
      packedUnits: seededResult.packedUnits,
      detail: lockedStatus,
    }, { force: true, yieldToUi: true });
  }
  progressReporter?.throwIfCancelled();

  const supplementary = await calculateGuidedWithFallbackAsync(
    nextPallet,
    seededResult.unpacked.map((carton) => ({ ...carton })),
    sampleGuidance ?? null,
    progressReporter,
  );

  return {
    result: mergeTemplateWithSupplementaryPallets(seededResult, supplementary, nextPallet),
    lockedStatus,
  };
}

export function calculateMissingCartonsFromManualSeed({
  pallet,
  cartons,
  manualCartons,
  sampleGuidance,
}: {
  pallet: PalletInput;
  cartons: CartonInput[];
  manualCartons: PackedCarton[];
  sampleGuidance: PackSampleGuidance | null;
}): CalculateMissingCartonsResult {
  const nextPallet = normalizePalletForPacking(applySampleGuidance(pallet, sampleGuidance ?? null));
  const seed = buildManualGenerationSeedResult({
    pallet,
    cartons,
    manualCartons,
  });
  if (!seed.seedResult) {
    return {
      result: calculateGuidedWithFallback(nextPallet, cartons, sampleGuidance ?? null),
      lockedStatus: "Locked manual seed: no valid locked cartons found",
    };
  }

  const preserved = seed.lockedCartons.length;
  const ignored = seed.ignoredCartons.length;
  const lockedStatus = ignored > 0
    ? `Locked manual seed: preserved ${preserved}, ignored ${ignored}`
    : `Locked manual seed: preserved ${preserved}`;

  if (countUnpackedUnits(seed.seedResult.unpacked) <= 0) {
    return {
      result: seed.seedResult,
      lockedStatus,
    };
  }

  const firstPallet = pickBestSeededFirstPalletResult(nextPallet, seed.seedResult);
  const seededResult = buildSeededFirstPalletResult(seed.seedResult, firstPallet);

  if (countUnpackedUnits(firstPallet.unpacked) <= 0) {
    return {
      result: seededResult,
      lockedStatus,
    };
  }

  if (nextPallet.extraPalletMode === "none") {
    return {
      result: seededResult,
      lockedStatus,
    };
  }

  if (
    nextPallet.extraPalletMode === "limitsOnly"
    && !reachesPalletHardLimit(firstPallet, nextPallet, EPS)
  ) {
    return {
      result: seededResult,
      lockedStatus,
    };
  }

  const supplementary = calculateGuidedWithFallback(
    nextPallet,
    firstPallet.unpacked.map((carton) => ({ ...carton })),
    sampleGuidance ?? null,
  );

  return {
    result: mergeTemplateWithSupplementaryPallets(seededResult, supplementary, nextPallet),
    lockedStatus,
  };
}
