import type { PackedCarton } from "./packerTypes";

export function roundTo(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

export function overlapArea2D(a: PackedCarton, b: PackedCarton): number {
  const xOverlap = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const yOverlap = Math.max(0, Math.min(a.y + a.l, b.y + b.l) - Math.max(a.y, b.y));
  return xOverlap * yOverlap;
}

export function hasFullVerticalSupport(
  top: PackedCarton,
  candidates: PackedCarton[],
  minSupportRatio = 0.985,
): boolean {
  if (top.z <= 0.25) return true;
  const topArea = top.w * top.l;
  if (topArea <= 1e-6) return false;

  let supportedArea = 0;
  for (const below of candidates) {
    if (below.id === top.id) continue;
    const belowTop = below.z + below.h;
    if (Math.abs(belowTop - top.z) > 0.25) continue;
    const overlap = overlapArea2D(top, below);
    if (overlap <= 1e-6) continue;
    supportedArea += overlap;
    if (supportedArea + 1e-6 >= topArea * minSupportRatio) return true;
  }

  return supportedArea + 1e-6 >= topArea * minSupportRatio;
}

export function overlapVolume3D(a: PackedCarton, b: PackedCarton): number {
  const xOverlap = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const yOverlap = Math.max(0, Math.min(a.y + a.l, b.y + b.l) - Math.max(a.y, b.y));
  const zOverlap = Math.max(0, Math.min(a.z + a.h, b.z + b.h) - Math.max(a.z, b.z));
  return xOverlap * yOverlap * zOverlap;
}
