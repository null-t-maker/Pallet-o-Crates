import type { PackedCarton } from "./packerTypes";

export function updateManualCartonsById(
  existing: PackedCarton[],
  id: string,
  next: Partial<Pick<PackedCarton, "x" | "y" | "z" | "w" | "l" | "h">>,
): PackedCarton[] {
  const toFiniteOr = (value: number | undefined, fallback: number): number =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return existing.map((carton) => (
    carton.id === id
      ? {
        ...carton,
        x: toFiniteOr(next.x, carton.x),
        y: toFiniteOr(next.y, carton.y),
        z: Math.max(0, toFiniteOr(next.z, carton.z)),
        w: Math.max(1, toFiniteOr(next.w, carton.w)),
        l: Math.max(1, toFiniteOr(next.l, carton.l)),
        h: Math.max(1, toFiniteOr(next.h, carton.h)),
      }
      : carton
  ));
}
