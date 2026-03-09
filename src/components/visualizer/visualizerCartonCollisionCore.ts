import type { PackedCarton } from "../../lib/packer";

export const COLLISION_EPS = 1e-3;

function overlapsAxis(aMin: number, aSize: number, bMin: number, bSize: number): boolean {
  return aMin + aSize > bMin + COLLISION_EPS && bMin + bSize > aMin + COLLISION_EPS;
}

function cartonsOverlap3D(a: PackedCarton, b: PackedCarton): boolean {
  return overlapsAxis(a.x, a.w, b.x, b.w)
    && overlapsAxis(a.y, a.l, b.y, b.l)
    && overlapsAxis(a.z, a.h, b.z, b.h);
}

export function isValidCartonGeometry(carton: PackedCarton): boolean {
  return Number.isFinite(carton.x)
    && Number.isFinite(carton.y)
    && Number.isFinite(carton.z)
    && Number.isFinite(carton.w)
    && Number.isFinite(carton.l)
    && Number.isFinite(carton.h)
    && Number.isFinite(carton.weight)
    && carton.w > 0
    && carton.l > 0
    && carton.h > 0;
}

export function hasCartonCollision(
  candidate: PackedCarton,
  cartons: PackedCarton[],
  ignoreId: string,
): boolean {
  return cartons.some((other) => other.id !== ignoreId && cartonsOverlap3D(candidate, other));
}
