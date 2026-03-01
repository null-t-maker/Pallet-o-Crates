import type { CartonInput, PalletInput } from "./packerTypes";
import type { EvaluationProfile, SelectionMode } from "./packerCoreTypes";

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
  const forceInterlockOnUniformUpperLayers = rawUniformStackMode
    && singleActiveType
    && layerIndex >= 1;
  return forceInterlockOnUniformUpperLayers ? false : rawUniformStackMode;
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

export function buildCountOptions(
  maxCount: number,
  mustKeepFullCountAtBase: boolean,
  allowShapeDeviation: boolean,
  profile: EvaluationProfile,
  centerGapStreak: number,
  layerIndex: number,
): number[] {
  const countOptions = new Set<number>([maxCount]);
  if (!mustKeepFullCountAtBase) {
    if (allowShapeDeviation) {
      if (maxCount > 2) countOptions.add(maxCount - 1);
      if (maxCount > 4) countOptions.add(maxCount - 2);
      if (maxCount > 6 && (centerGapStreak > 0 || layerIndex >= 2)) {
        countOptions.add(Math.max(2, Math.floor(maxCount * 0.85)));
      }
    }
    if (profile === "rescue" && allowShapeDeviation) {
      for (let n = 1; n <= Math.min(8, maxCount); n++) countOptions.add(n);
      if (maxCount > 8) countOptions.add(Math.max(2, Math.floor(maxCount * 0.65)));
    }
  }

  return Array.from(countOptions)
    .filter((count) => count > 0 && count <= maxCount)
    .sort((a, b) => b - a);
}

export function buildModeOptions(
  preferCenterMode: boolean,
  singleActiveType: boolean,
  hasSpareSlots: boolean,
  likelyTaper: boolean,
  allowShapeDeviation: boolean,
  profile: EvaluationProfile,
  nearTailForCarton: boolean,
  layerIndex: number,
): SelectionMode[] {
  const modeSet = new Set<SelectionMode>([
    preferCenterMode ? "center" : "edge",
  ]);
  if (preferCenterMode && singleActiveType) {
    modeSet.add("edge");
  }
  if ((hasSpareSlots || likelyTaper) && allowShapeDeviation) {
    if (preferCenterMode) {
      if (profile === "rescue") {
        modeSet.add("pin");
      }
      if (nearTailForCarton || layerIndex >= 3 || profile === "rescue") {
        modeSet.add("edge");
      }
    } else {
      modeSet.add("center");
      modeSet.add("pin");
    }
  }
  if (profile === "rescue" && allowShapeDeviation) {
    modeSet.add("center");
    modeSet.add("pin");
    modeSet.add("edge");
  }
  return Array.from(modeSet);
}

export function shouldSkipMode(
  mode: SelectionMode,
  profile: EvaluationProfile,
  count: number,
  capacity: number,
  centerGapStreak: number,
): boolean {
  return mode === "pin"
    && profile !== "rescue"
    && count > Math.max(6, Math.floor(capacity * 0.6))
    && centerGapStreak === 0;
}
