import type { CartonInput, PalletInput } from "./packerTypes";

export function isUniformActiveCartons(
  rem: CartonInput[],
  pallet: PalletInput,
  zBase: number,
  heightCeil: number | null,
  eps: number,
): boolean {
  const active = rem.filter((carton) =>
    carton.quantity > 0
    && carton.weight > 0
    && zBase + carton.height <= pallet.maxHeight + eps
    && (heightCeil === null || carton.height <= heightCeil + 0.25));

  if (active.length <= 1) return active.length === 1;

  const first = active[0];
  const firstMin = Math.min(first.width, first.length);
  const firstMax = Math.max(first.width, first.length);

  return active.every((carton) => {
    const cartonMin = Math.min(carton.width, carton.length);
    const cartonMax = Math.max(carton.width, carton.length);
    return Math.abs(cartonMin - firstMin) <= 0.25
      && Math.abs(cartonMax - firstMax) <= 0.25
      && Math.abs(carton.height - first.height) <= 0.25
      && Math.abs(carton.weight - first.weight) <= 0.25;
  });
}

export function collectActiveTypeIds(
  rem: CartonInput[],
  pallet: PalletInput,
  zBase: number,
  heightCeil: number | null,
  remainingWeight: number,
  eps: number,
): Set<string> {
  return new Set(
    rem
      .filter((carton) =>
        carton.quantity > 0
        && carton.weight > 0
        && zBase + carton.height <= pallet.maxHeight + eps
        && (heightCeil === null || carton.height <= heightCeil + 0.25)
        && carton.weight <= remainingWeight + eps)
      .map((carton) => carton.id),
  );
}

export function resolveUniformStackMode(
  rem: CartonInput[],
  pallet: PalletInput,
  zBase: number,
  heightCeil: number | null,
  eps: number,
  singleActiveType: boolean,
  layerIndex: number,
): boolean {
  const rawUniformStackMode = isUniformActiveCartons(rem, pallet, zBase, heightCeil, eps);
  if (!rawUniformStackMode || !singleActiveType) {
    return rawUniformStackMode;
  }

  const active = rem.filter((carton) =>
    carton.quantity > 0
    && carton.weight > 0
    && zBase + carton.height <= pallet.maxHeight + eps
    && (heightCeil === null || carton.height <= heightCeil + 0.25));

  const single = active[0];
  if (!single) {
    return rawUniformStackMode;
  }

  const oneLayerCapacity = Math.max(
    Math.floor((pallet.width + eps) / Math.max(single.width, eps))
      * Math.floor((pallet.length + eps) / Math.max(single.length, eps)),
    Math.floor((pallet.width + eps) / Math.max(single.length, eps))
      * Math.floor((pallet.length + eps) / Math.max(single.width, eps)),
  );
  if (oneLayerCapacity <= 0) {
    return rawUniformStackMode;
  }

  const maxLayersByHeight = Math.floor((pallet.maxHeight - zBase + eps) / Math.max(single.height, eps));
  const maxUnitsByWeight = Math.floor((pallet.maxWeight + eps) / Math.max(single.weight, eps));
  const fitUnits = Math.min(single.quantity, maxUnitsByWeight, oneLayerCapacity * Math.max(0, maxLayersByHeight));
  const futureLayersLikely = fitUnits > oneLayerCapacity;

  const forceInterlockOnUniformStack = layerIndex >= 1 || futureLayersLikely;
  return forceInterlockOnUniformStack ? false : rawUniformStackMode;
}
