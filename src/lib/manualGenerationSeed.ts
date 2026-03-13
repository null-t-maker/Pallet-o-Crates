import type {
  CartonInput,
  MultiPackResult,
  PackedCarton,
  PalletInput,
} from "./packerTypes";
import type { PlacementRect } from "./packerCoreTypes";
import { normalizeManualCartonsForSampleSave } from "./layoutSampleSaveNormalization";
import { PACKER_EPS, PACKER_MIN_FULL_SUPPORT_RATIO } from "./packerPackPalletSharedDepsTypes";
import { orientationOptions } from "./packerPlacementUtils";
import type { OrientationOption } from "./packerCoreTypes";
import { canUseUprightNow } from "./packerPolicy";
import { buildPackerRuntimeWrappers } from "./packerRuntimeWrappers";
import {
  buildUnpackedFromFinalizedPlacements,
  type FinalTemplatePlacement,
} from "./templateLockFinalization";
import { overlapVolume3D, roundTo } from "./templateLockMath";

const BOUNDS_EPS = 0.25;
const OVERLAP_EPS = 1e-6;
const SUPPORT_Z_EPS = 0.25;
const UPRIGHT_PRESSURE_LIMIT_FACTOR = 1.85;
const SINGLE_SUPPORT_PRESSURE_LIMIT_FACTOR = 2.1;
const MULTI_SUPPORT_PRESSURE_LIMIT_FACTOR = 2.25;
const packerRuntime = buildPackerRuntimeWrappers(PACKER_EPS, PACKER_MIN_FULL_SUPPORT_RATIO);

export interface ManualGenerationSeedBuildResult {
  seedResult: MultiPackResult | null;
  lockedCartons: PackedCarton[];
  ignoredCartons: PackedCarton[];
}

export function hasPositiveFiniteGeometry(carton: PackedCarton): boolean {
  return [carton.x, carton.y, carton.z, carton.w, carton.l, carton.h, carton.weight].every(Number.isFinite)
    && carton.w > 0
    && carton.l > 0
    && carton.h > 0
    && carton.weight >= 0;
}

export function isWithinPalletBounds(carton: PackedCarton, pallet: PalletInput): boolean {
  return carton.x >= -BOUNDS_EPS
    && carton.y >= -BOUNDS_EPS
    && carton.z >= -BOUNDS_EPS
    && carton.x + carton.w <= pallet.width + BOUNDS_EPS
    && carton.y + carton.l <= pallet.length + BOUNDS_EPS
    && carton.z + carton.h <= pallet.maxHeight + BOUNDS_EPS;
}

export function compareCartonsBySpatialOrder(a: PackedCarton, b: PackedCarton): number {
  if (Math.abs(a.z - b.z) > OVERLAP_EPS) return a.z - b.z;
  if (Math.abs(a.y - b.y) > OVERLAP_EPS) return a.y - b.y;
  if (Math.abs(a.x - b.x) > OVERLAP_EPS) return a.x - b.x;
  return a.id.localeCompare(b.id);
}

function toPlacementRect(carton: PackedCarton): PlacementRect {
  return {
    x: carton.x,
    y: carton.y,
    w: carton.w,
    l: carton.l,
    h: carton.h,
    typeId: carton.typeId,
    weight: carton.weight,
    density: carton.weight / Math.max(carton.w * carton.l, PACKER_EPS),
  };
}

function matchesDimension(a: number, b: number): boolean {
  return Math.abs(a - b) <= SUPPORT_Z_EPS;
}

function findMatchingPlacementOrientation(
  carton: PackedCarton,
  cartonInput: CartonInput | undefined,
): OrientationOption | null {
  if (!cartonInput) return null;

  return orientationOptions(cartonInput, canUseUprightNow(cartonInput, true)).find(
    (option) => matchesDimension(option.w, carton.w)
      && matchesDimension(option.l, carton.l)
      && matchesDimension(option.h, carton.h),
  ) ?? null;
}

export function resolveSeedPlacementCarton(
  carton: PackedCarton,
  cartonInput: CartonInput | undefined,
): PackedCarton | null {
  const matchingOrientation = findMatchingPlacementOrientation(carton, cartonInput);
  if (!cartonInput || !matchingOrientation) return null;

  return {
    ...carton,
    title: cartonInput.title,
    color: cartonInput.color,
    weight: cartonInput.weight,
    w: matchingOrientation.w,
    l: matchingOrientation.l,
    h: matchingOrientation.h,
  };
}

export function hasGenerationLegalSupport(
  carton: PackedCarton,
  lockedCartons: PackedCarton[],
  cartonInput: CartonInput | undefined,
): boolean {
  if (carton.z <= SUPPORT_Z_EPS) return true;

  const supportPlacements = lockedCartons
    .filter((below) => Math.abs((below.z + below.h) - carton.z) <= SUPPORT_Z_EPS)
    .map(toPlacementRect);
  const support = packerRuntime.analyzeSupport({
    x: carton.x,
    y: carton.y,
    w: carton.w,
    l: carton.l,
  }, supportPlacements);
  if (!packerRuntime.hasFullSupport(support)) return false;
  if (!packerRuntime.structuralSupportSafe(carton.weight, carton.w * carton.l, support)) return false;

  const pressureLimitFactor = (findMatchingPlacementOrientation(carton, cartonInput)?.upright ?? false)
    ? UPRIGHT_PRESSURE_LIMIT_FACTOR
    : (support.touching <= 1
        ? SINGLE_SUPPORT_PRESSURE_LIMIT_FACTOR
        : MULTI_SUPPORT_PRESSURE_LIMIT_FACTOR);

  return packerRuntime.pressureSafe(carton.weight, support, pressureLimitFactor).ok;
}

function buildSeedPallets(
  lockedCartons: PackedCarton[],
  pallet: PalletInput,
): MultiPackResult["pallets"] | null {
  if (lockedCartons.length === 0) return null;

  let totalWeight = 0;
  let totalHeight = 0;
  const layerMap = new Map<string, { zBase: number; height: number; cartons: PackedCarton[] }>();

  for (const carton of lockedCartons) {
    totalWeight += carton.weight;
    totalHeight = Math.max(totalHeight, carton.z + carton.h);

    const zBase = roundTo(carton.z, 3);
    const key = zBase.toFixed(3);
    const existingLayer = layerMap.get(key);
    if (!existingLayer) {
      layerMap.set(key, {
        zBase,
        height: carton.h,
        cartons: [carton],
      });
      continue;
    }

    existingLayer.height = Math.max(existingLayer.height, carton.h);
    existingLayer.cartons.push(carton);
  }

  if (totalWeight > pallet.maxWeight + OVERLAP_EPS) return null;
  if (totalHeight > pallet.maxHeight + BOUNDS_EPS) return null;

  return [{
    index: 0,
    offsetX: 0,
    offsetY: 0,
    result: {
      layers: Array.from(layerMap.values())
        .sort((a, b) => a.zBase - b.zBase)
        .map((layer) => ({
          zBase: layer.zBase,
          height: layer.height,
          cartons: layer.cartons.sort((a, b) => {
            if (Math.abs(a.y - b.y) > OVERLAP_EPS) return a.y - b.y;
            if (Math.abs(a.x - b.x) > OVERLAP_EPS) return a.x - b.x;
            return a.id.localeCompare(b.id);
          }),
        })),
      totalWeight,
      totalHeight,
      unpacked: [],
    },
  }];
}

export function buildManualGenerationSeedResult({
  pallet,
  cartons,
  manualCartons,
}: {
  pallet: PalletInput;
  cartons: CartonInput[];
  manualCartons: PackedCarton[];
}): ManualGenerationSeedBuildResult {
  const requestedByType = new Map(
    cartons.map((carton) => [carton.id, Math.max(0, Math.floor(carton.quantity))] as const),
  );
  const cartonByType = new Map(cartons.map((carton) => [carton.id, carton] as const));
  const normalizedManualCartons = normalizeManualCartonsForSampleSave(manualCartons)
    .filter(hasPositiveFiniteGeometry)
    .sort(compareCartonsBySpatialOrder);

  const acceptedCountsByType = new Map<string, number>();
  const lockedCartons: PackedCarton[] = [];
  const ignoredCartons: PackedCarton[] = [];
  const finalizedPlacements: FinalTemplatePlacement[] = [];

  for (const carton of normalizedManualCartons) {
    const currentType = cartonByType.get(carton.typeId);
    const requestedCount = requestedByType.get(carton.typeId) ?? 0;
    const acceptedCount = acceptedCountsByType.get(carton.typeId) ?? 0;
    if (requestedCount <= 0 || acceptedCount >= requestedCount) {
      ignoredCartons.push(carton);
      continue;
    }

    const resolvedCarton = resolveSeedPlacementCarton(carton, currentType);
    if (!resolvedCarton) {
      ignoredCartons.push(carton);
      continue;
    }

    if (!isWithinPalletBounds(resolvedCarton, pallet)) {
      ignoredCartons.push(carton);
      continue;
    }

    if (lockedCartons.some((existing) => overlapVolume3D(existing, resolvedCarton) > OVERLAP_EPS)) {
      ignoredCartons.push(carton);
      continue;
    }

    if (!hasGenerationLegalSupport(resolvedCarton, lockedCartons, currentType)) {
      ignoredCartons.push(carton);
      continue;
    }

    lockedCartons.push(resolvedCarton);
    acceptedCountsByType.set(carton.typeId, acceptedCount + 1);
    finalizedPlacements.push({
      carton: resolvedCarton,
      palletIndex: 0,
      offsetX: 0,
      offsetY: 0,
      matchedShapeKey: null,
      assignedTypeId: carton.typeId,
    });
  }

  if (finalizedPlacements.length === 0) {
    return {
      seedResult: null,
      lockedCartons,
      ignoredCartons,
    };
  }

  const pallets = buildSeedPallets(lockedCartons, pallet);
  if (!pallets) {
    return {
      seedResult: null,
      lockedCartons: [],
      ignoredCartons: normalizedManualCartons,
    };
  }

  const { requestedUnits, unpacked, packedUnits } = buildUnpackedFromFinalizedPlacements(
    cartons,
    finalizedPlacements,
  );
  const totalWeight = pallets.reduce((sum, placed) => sum + placed.result.totalWeight, 0);
  const maxHeight = pallets.reduce((max, placed) => Math.max(max, placed.result.totalHeight), 0);

  return {
    seedResult: {
      pallets,
      totalWeight,
      maxHeight,
      unpacked,
      packedUnits,
      requestedUnits,
    },
    lockedCartons,
    ignoredCartons,
  };
}
