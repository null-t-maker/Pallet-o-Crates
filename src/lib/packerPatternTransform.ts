import type { Rect } from "./packerCoreTypes";
import type { TransformMode } from "./packerPatternTypes";

export function clampToZero(value: number, eps: number): number {
  return Math.abs(value) < eps ? 0 : value;
}

export function transformRects(
  rects: Rect[],
  palletWidth: number,
  palletLength: number,
  mode: TransformMode,
  eps: number,
): Rect[] {
  switch (mode) {
    case "normal":
      return rects.map((rect) => ({ ...rect }));
    case "mx":
      return rects.map((rect) => ({
        x: clampToZero(palletWidth - rect.x - rect.w, eps),
        y: rect.y,
        w: rect.w,
        l: rect.l,
      }));
    case "my":
      return rects.map((rect) => ({
        x: rect.x,
        y: clampToZero(palletLength - rect.y - rect.l, eps),
        w: rect.w,
        l: rect.l,
      }));
    case "r180":
      return rects.map((rect) => ({
        x: clampToZero(palletWidth - rect.x - rect.w, eps),
        y: clampToZero(palletLength - rect.y - rect.l, eps),
        w: rect.w,
        l: rect.l,
      }));
  }
}
