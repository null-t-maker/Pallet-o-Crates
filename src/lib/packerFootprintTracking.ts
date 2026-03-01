import type { PlacementRect, Rect } from "./packerCoreTypes";

function isNear(a: number, b: number, tol = 0.25): boolean {
  return Math.abs(a - b) <= tol;
}

export function exactAlignmentCount(rects: Rect[], below: PlacementRect[]): number {
  let count = 0;
  for (const rect of rects) {
    const aligned = below.some((b) =>
      isNear(rect.x, b.x, 0.2)
      && isNear(rect.y, b.y, 0.2)
      && isNear(rect.w, b.w, 0.2)
      && isNear(rect.l, b.l, 0.2));
    if (aligned) count++;
  }
  return count;
}

export function footprintKey(rect: Rect): string {
  return [
    rect.x.toFixed(1),
    rect.y.toFixed(1),
    rect.w.toFixed(1),
    rect.l.toFixed(1),
  ].join("|");
}

export function typedFootprintKey(rect: Rect, typeId: string): string {
  return `${typeId}|${footprintKey(rect)}`;
}

export function updateStreakMaps(
  placements: PlacementRect[],
  prevFootprint: Map<string, number>,
  prevType: Map<string, number>,
): { footprint: Map<string, number>; typed: Map<string, number> } {
  const footprint = new Map<string, number>();
  const typed = new Map<string, number>();

  for (const rect of placements) {
    const fKey = footprintKey(rect);
    const tKey = typedFootprintKey(rect, rect.typeId);
    footprint.set(fKey, (prevFootprint.get(fKey) ?? 0) + 1);
    typed.set(tKey, (prevType.get(tKey) ?? 0) + 1);
  }

  return { footprint, typed };
}
