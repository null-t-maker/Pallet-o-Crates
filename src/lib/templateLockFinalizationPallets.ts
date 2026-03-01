import type {
  MultiPackResult,
  PackedCarton,
  PalletInput,
} from "./packerTypes";
import {
  hasFullVerticalSupport,
  overlapVolume3D,
  roundTo,
} from "./templateLockParsing";
import type { FinalTemplatePlacement } from "./templateLockFinalizationTypes";

export function buildPalletResultsFromFinalizedPlacements(
  finalizedPlacements: FinalTemplatePlacement[],
  pallet: PalletInput,
): MultiPackResult["pallets"] | null {
  const eps = 1e-6;
  const cartonsByPallet = new Map<number, PackedCarton[]>();
  const offsetsByPallet = new Map<number, { offsetX: number; offsetY: number }>();

  for (const placement of finalizedPlacements) {
    const target = cartonsByPallet.get(placement.palletIndex) ?? [];
    target.push(placement.carton);
    cartonsByPallet.set(placement.palletIndex, target);
    offsetsByPallet.set(placement.palletIndex, {
      offsetX: placement.offsetX,
      offsetY: placement.offsetY,
    });
  }

  const placementList = Array.from(cartonsByPallet.entries()).sort((a, b) => a[0] - b[0]);
  if (placementList.length === 0) return null;

  const palletsResult: MultiPackResult["pallets"] = [];
  for (const [palletIndex, placedCartons] of placementList) {
    for (let i = 0; i < placedCartons.length; i++) {
      for (let j = i + 1; j < placedCartons.length; j++) {
        if (overlapVolume3D(placedCartons[i], placedCartons[j]) > 1e-6) return null;
      }
    }
    for (const carton of placedCartons) {
      if (!hasFullVerticalSupport(carton, placedCartons)) return null;
    }

    const layerMap = new Map<string, { zBase: number; height: number; cartons: PackedCarton[] }>();
    let totalWeight = 0;
    let totalHeight = 0;

    for (const carton of placedCartons) {
      const zBase = roundTo(carton.z, 3);
      const key = zBase.toFixed(3);
      const current = layerMap.get(key);
      if (!current) {
        layerMap.set(key, { zBase, height: carton.h, cartons: [carton] });
      } else {
        current.height = Math.max(current.height, carton.h);
        current.cartons.push(carton);
      }
      totalWeight += carton.weight;
      totalHeight = Math.max(totalHeight, carton.z + carton.h);
    }

    if (totalWeight > pallet.maxWeight + eps) return null;
    if (totalHeight > pallet.maxHeight + eps) return null;

    const layers = Array.from(layerMap.values())
      .sort((a, b) => a.zBase - b.zBase)
      .map((layer) => ({
        zBase: layer.zBase,
        height: layer.height,
        cartons: layer.cartons.sort((a, b) => {
          if (Math.abs(a.y - b.y) > 1e-6) return a.y - b.y;
          if (Math.abs(a.x - b.x) > 1e-6) return a.x - b.x;
          return a.id.localeCompare(b.id);
        }),
      }));

    const offset = offsetsByPallet.get(palletIndex) ?? { offsetX: 0, offsetY: 0 };
    palletsResult.push({
      index: palletIndex,
      offsetX: offset.offsetX,
      offsetY: offset.offsetY,
      result: {
        layers,
        totalWeight,
        totalHeight,
        unpacked: [],
      },
    });
  }

  return palletsResult;
}
