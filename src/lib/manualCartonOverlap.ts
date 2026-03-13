import type { PackedCarton } from "./packerTypes";

const OVERLAP_EPS = 1e-3;

function hasPositiveFiniteGeometry(carton: PackedCarton): boolean {
  return [carton.x, carton.y, carton.z, carton.w, carton.l, carton.h].every(Number.isFinite)
    && carton.w > 0
    && carton.l > 0
    && carton.h > 0;
}

function overlapsAxis(aStart: number, aSize: number, bStart: number, bSize: number): boolean {
  return aStart + aSize > bStart + OVERLAP_EPS && bStart + bSize > aStart + OVERLAP_EPS;
}

export function cartonsOverlap3d(a: PackedCarton, b: PackedCarton): boolean {
  if (a.id === b.id) return false;
  if (!hasPositiveFiniteGeometry(a) || !hasPositiveFiniteGeometry(b)) return false;
  return overlapsAxis(a.x, a.w, b.x, b.w)
    && overlapsAxis(a.y, a.l, b.y, b.l)
    && overlapsAxis(a.z, a.h, b.z, b.h);
}

export function hasAnyManualCartonOverlap(cartons: PackedCarton[]): boolean {
  for (let leftIndex = 0; leftIndex < cartons.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < cartons.length; rightIndex += 1) {
      if (cartonsOverlap3d(cartons[leftIndex], cartons[rightIndex])) {
        return true;
      }
    }
  }
  return false;
}
