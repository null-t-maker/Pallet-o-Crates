import type { PackedCarton } from "./packerTypes";

export { tryCenterShiftLayer } from "./packerLayerCenterShift";
export { cumulativeStackLoadSafe } from "./packerLayerCumulativeLoad";
export type { CumulativeStackLoadDeps, TryCenterShiftLayerDeps } from "./packerLayerStabilityTypes";

export function findNextZBase(placed: PackedCarton[], currentZ: number, eps: number): number | null {
  let next = Number.POSITIVE_INFINITY;
  for (const carton of placed) {
    const top = carton.z + carton.h;
    if (top > currentZ + eps && top < next) next = top;
  }
  return Number.isFinite(next) ? next : null;
}
