import type { CartonInput, PalletInput } from "./packerTypes";

function cartonDensity(carton: Pick<CartonInput, "width" | "length" | "weight">): number {
  return carton.weight / Math.max(carton.width * carton.length, 1e-6);
}

export function canBeSafelySupportedByOtherTypes(
  carton: CartonInput,
  rem: CartonInput[],
  pressureFactor: number,
  eps: number,
): boolean {
  const targetDensity = cartonDensity(carton);
  const targetArea = carton.width * carton.length;
  for (const other of rem) {
    if (other.id === carton.id || other.quantity <= 0) continue;
    const supportDensity = cartonDensity(other);
    const supportArea = other.width * other.length;
    const weightOk = other.weight + eps >= carton.weight * 0.9;
    const areaOk = supportArea + eps >= targetArea * 0.9;
    const densityOk = targetDensity <= supportDensity * pressureFactor + eps;
    if (weightOk && areaOk && densityOk) return true;
  }
  return false;
}

export function collectCriticalTypeIds(
  rem: CartonInput[],
  prevPlacements: Array<{ typeId: string }>,
  zBase: number,
  pallet: PalletInput,
  heightCeil: number | null,
  remainingWeight: number,
  eps: number,
): Set<string> | null {
  const supportTypesAtZ = new Set(prevPlacements.map((placement) => placement.typeId));
  const criticalIds = rem
    .filter((carton) =>
      carton.quantity > 0
      && carton.weight > 0
      && zBase + carton.height <= pallet.maxHeight + eps
      && (heightCeil === null || carton.height <= heightCeil + 0.25)
      && carton.weight <= remainingWeight + eps
      && !canBeSafelySupportedByOtherTypes(carton, rem, 2.25, eps)
      && (prevPlacements.length === 0 || supportTypesAtZ.has(carton.id)))
    .map((carton) => carton.id);
  if (criticalIds.length === 0) return null;
  return new Set<string>(criticalIds);
}
