import type { CartonInput } from "./packerTypes";
import type { OrientationOption, Rect } from "./packerCoreTypes";

export function orientationOptions(carton: CartonInput, allowUpright: boolean): OrientationOption[] {
  const base: OrientationOption[] = [
    { w: carton.width, l: carton.length, h: carton.height, upright: false },
    { w: carton.length, l: carton.width, h: carton.height, upright: false },
  ];

  if (allowUpright) {
    base.push(
      { w: carton.width, l: carton.height, h: carton.length, upright: true },
      { w: carton.height, l: carton.width, h: carton.length, upright: true },
      { w: carton.length, l: carton.height, h: carton.width, upright: true },
      { w: carton.height, l: carton.length, h: carton.width, upright: true },
    );
  }

  const unique = new Map<string, OrientationOption>();
  for (const option of base) {
    const key = [option.w.toFixed(3), option.l.toFixed(3), option.h.toFixed(3)].join("|");
    if (!unique.has(key)) unique.set(key, option);
  }
  return Array.from(unique.values());
}

export function noCollision(
  rect: Rect,
  blockedRects: Rect[],
  overlapArea: (a: Rect, b: Rect) => number,
  eps: number,
): boolean {
  return blockedRects.every((blocked) => overlapArea(rect, blocked) <= eps);
}

export function isRectSetPlacementSafe(
  rects: Rect[],
  blockedRects: Rect[],
  palletWidth: number,
  palletLength: number,
  overlapArea: (a: Rect, b: Rect) => number,
  eps: number,
): boolean {
  const occupied = blockedRects.map((rect) => ({ ...rect }));
  for (const rect of rects) {
    if (rect.x < -eps || rect.y < -eps) return false;
    if (rect.x + rect.w > palletWidth + eps || rect.y + rect.l > palletLength + eps) return false;
    if (!noCollision(rect, occupied, overlapArea, eps)) return false;
    occupied.push(rect);
  }
  return true;
}

