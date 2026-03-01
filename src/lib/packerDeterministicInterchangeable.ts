import type {
  CartonInput,
  Layer,
  PackedCarton,
  PackResult,
  PalletInput,
} from "./packerTypes";
import type { DeterministicPackDeps } from "./packerDeterministicTypes";

function areInterchangeableCartons(
  a: CartonInput,
  b: CartonInput,
  deps: DeterministicPackDeps,
): boolean {
  const aMin = Math.min(a.width, a.length);
  const aMax = Math.max(a.width, a.length);
  const bMin = Math.min(b.width, b.length);
  const bMax = Math.max(b.width, b.length);

  return Math.abs(aMin - bMin) <= 0.25
    && Math.abs(aMax - bMax) <= 0.25
    && Math.abs(a.height - b.height) <= 0.25
    && Math.abs(a.weight - b.weight) <= 0.01
    && deps.resolveUprightPolicy(a) === deps.resolveUprightPolicy(b);
}

export function packInterchangeableTypesAsUnified(
  pallet: PalletInput,
  activeCartons: CartonInput[],
  deps: DeterministicPackDeps,
): PackResult | null {
  if (activeCartons.length <= 1) return null;

  const first = activeCartons[0];
  if (!activeCartons.every((carton) => areInterchangeableCartons(first, carton, deps))) return null;

  const totalQuantity = activeCartons.reduce((sum, carton) => sum + Math.max(0, carton.quantity), 0);
  if (totalQuantity <= 0) return null;

  const merged: CartonInput = {
    ...first,
    id: "__uniform_merged__",
    quantity: totalQuantity,
  };

  const mergedResult = deps.packPallet(pallet, [merged]);
  const queue = activeCartons.map((carton) => ({ carton: { ...carton }, remaining: carton.quantity }));
  const pickQueueItem = (): { carton: CartonInput; remaining: number } | null =>
    queue.find((item) => item.remaining > 0) ?? null;

  const mappedLayers: Layer[] = mergedResult.layers.map((layer) => {
    const mappedCartons: PackedCarton[] = layer.cartons.map((packed) => {
      const item = pickQueueItem();
      if (!item) {
        return {
          ...packed,
          typeId: first.id,
          title: first.title,
          weight: first.weight,
          color: first.color,
        };
      }
      item.remaining -= 1;
      return {
        ...packed,
        typeId: item.carton.id,
        title: item.carton.title,
        weight: item.carton.weight,
        color: item.carton.color,
      };
    });

    return {
      ...layer,
      cartons: mappedCartons,
    };
  });

  const unpacked = queue
    .filter((item) => item.remaining > 0)
    .map((item) => ({
      ...item.carton,
      quantity: item.remaining,
    }));

  return {
    layers: mappedLayers,
    totalWeight: mergedResult.totalWeight,
    totalHeight: mergedResult.totalHeight,
    unpacked,
  };
}
