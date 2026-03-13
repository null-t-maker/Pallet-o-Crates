import type {
  CartonInput,
  MultiPackResult,
  PackedCarton,
  PalletInput,
} from "./packerTypes";
import {
  compareCartonsBySpatialOrder,
  hasGenerationLegalSupport,
  hasPositiveFiniteGeometry,
  isWithinPalletBounds,
  resolveSeedPlacementCarton,
} from "./manualGenerationSeed";
import { normalizeManualCartonsForSampleSave } from "./layoutSampleSaveNormalization";
import {
  buildUnpackedFromFinalizedPlacements,
  type FinalTemplatePlacement,
} from "./templateLockFinalization";

const OVERLAP_EPS = 1e-6;

export interface GenerationLockedSeedBuildResult {
  seedResult: MultiPackResult | null;
  lockedCartons: PackedCarton[];
  ignoredCartons: PackedCarton[];
}

interface SeedPlacementEntry {
  carton: PackedCarton;
  palletIndex: number;
  offsetX: number;
  offsetY: number;
}

function overlapVolume3D(a: PackedCarton, b: PackedCarton): number {
  const dx = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const dy = Math.max(0, Math.min(a.y + a.l, b.y + b.l) - Math.max(a.y, b.y));
  const dz = Math.max(0, Math.min(a.z + a.h, b.z + b.h) - Math.max(a.z, b.z));
  return dx * dy * dz;
}

function buildSeedPallets(
  entries: SeedPlacementEntry[],
  pallet: PalletInput,
): MultiPackResult["pallets"] | null {
  if (entries.length === 0) return null;

  const grouped = new Map<number, SeedPlacementEntry[]>();
  for (const entry of entries) {
    const bucket = grouped.get(entry.palletIndex) ?? [];
    bucket.push(entry);
    grouped.set(entry.palletIndex, bucket);
  }

  const pallets = Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([palletIndex, palletEntries]) => {
      let totalWeight = 0;
      let totalHeight = 0;
      const layerMap = new Map<string, { zBase: number; height: number; cartons: PackedCarton[] }>();

      for (const entry of palletEntries) {
        const carton = entry.carton;
        totalWeight += carton.weight;
        totalHeight = Math.max(totalHeight, carton.z + carton.h);

        const key = carton.z.toFixed(3);
        const current = layerMap.get(key);
        if (!current) {
          layerMap.set(key, {
            zBase: carton.z,
            height: carton.h,
            cartons: [carton],
          });
          continue;
        }

        current.height = Math.max(current.height, carton.h);
        current.cartons.push(carton);
      }

      if (totalWeight > pallet.maxWeight + OVERLAP_EPS) return null;
      if (totalHeight > pallet.maxHeight + OVERLAP_EPS) return null;

      const firstEntry = palletEntries[0];
      return {
        index: palletIndex,
        offsetX: firstEntry?.offsetX ?? 0,
        offsetY: firstEntry?.offsetY ?? 0,
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
      };
    });

  if (pallets.some((entry) => entry === null)) return null;
  return pallets.filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

export function buildGenerationLockedSeedResult({
  pallet,
  cartons,
  result,
}: {
  pallet: PalletInput;
  cartons: CartonInput[];
  result: MultiPackResult | null;
}): GenerationLockedSeedBuildResult {
  if (!result || result.pallets.length === 0 || result.packedUnits <= 0) {
    return {
      seedResult: null,
      lockedCartons: [],
      ignoredCartons: [],
    };
  }

  const requestedByType = new Map(
    cartons.map((carton) => [carton.id, Math.max(0, Math.floor(carton.quantity))] as const),
  );
  const cartonByType = new Map(cartons.map((carton) => [carton.id, carton] as const));
  const normalizedEntries = result.pallets
    .flatMap((placed) => placed.result.layers.flatMap((layer) => layer.cartons.map((carton) => ({
      carton,
      palletIndex: placed.index,
      offsetX: placed.offsetX,
      offsetY: placed.offsetY,
    }))))
    .map((entry) => ({
      ...entry,
      carton: normalizeManualCartonsForSampleSave([entry.carton])[0] ?? entry.carton,
    }))
    .filter((entry) => hasPositiveFiniteGeometry(entry.carton))
    .sort((left, right) => {
      if (left.palletIndex !== right.palletIndex) return left.palletIndex - right.palletIndex;
      return compareCartonsBySpatialOrder(left.carton, right.carton);
    });

  const acceptedCountsByType = new Map<string, number>();
  const lockedCartons: PackedCarton[] = [];
  const ignoredCartons: PackedCarton[] = [];
  const lockedEntries: SeedPlacementEntry[] = [];
  const finalizedPlacements: FinalTemplatePlacement[] = [];
  const lockedByPallet = new Map<number, PackedCarton[]>();

  for (const entry of normalizedEntries) {
    const { carton, palletIndex, offsetX, offsetY } = entry;
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

    const existingOnPallet = lockedByPallet.get(palletIndex) ?? [];
    if (existingOnPallet.some((existing) => overlapVolume3D(existing, resolvedCarton) > OVERLAP_EPS)) {
      ignoredCartons.push(carton);
      continue;
    }

    if (!hasGenerationLegalSupport(resolvedCarton, existingOnPallet, currentType)) {
      ignoredCartons.push(carton);
      continue;
    }

    lockedCartons.push(resolvedCarton);
    lockedEntries.push({
      carton: resolvedCarton,
      palletIndex,
      offsetX,
      offsetY,
    });
    lockedByPallet.set(palletIndex, [...existingOnPallet, resolvedCarton]);
    acceptedCountsByType.set(carton.typeId, acceptedCount + 1);
    finalizedPlacements.push({
      carton: resolvedCarton,
      palletIndex,
      offsetX,
      offsetY,
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

  const pallets = buildSeedPallets(lockedEntries, pallet);
  if (!pallets) {
    return {
      seedResult: null,
      lockedCartons: [],
      ignoredCartons: normalizedEntries.map((entry) => entry.carton),
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
