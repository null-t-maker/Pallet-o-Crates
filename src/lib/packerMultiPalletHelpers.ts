import type {
  CartonInput,
  PackResult,
  PalletInput,
} from "./packerTypes";

export function hasActiveCartons(cartons: CartonInput[]): boolean {
  return cartons.some((carton) => carton.quantity > 0);
}

export function cloneCartons(cartons: CartonInput[]): CartonInput[] {
  return cartons.map((carton) => ({ ...carton }));
}

export function countUnpackedUnits(cartons: CartonInput[]): number {
  return cartons.reduce((sum, carton) => sum + Math.max(0, Math.floor(carton.quantity)), 0);
}

export function reachesPalletHardLimit(result: PackResult, pallet: PalletInput, eps: number): boolean {
  return result.totalWeight >= pallet.maxWeight - eps
    || result.totalHeight >= pallet.maxHeight - eps;
}

export function crossOffsetForPallet(index: number, pallet: PalletInput, gapMm: number): { x: number; y: number } {
  if (index <= 0) return { x: 0, y: 0 };
  const ring = Math.floor((index - 1) / 4) + 1;
  const slot = (index - 1) % 4;
  const stepX = pallet.width + gapMm;
  const stepY = pallet.length + gapMm;

  if (slot === 0) return { x: ring * stepX, y: 0 };
  if (slot === 1) return { x: -ring * stepX, y: 0 };
  if (slot === 2) return { x: 0, y: ring * stepY };
  return { x: 0, y: -ring * stepY };
}
