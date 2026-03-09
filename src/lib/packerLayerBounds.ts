import type { Rect } from "./packerCoreTypes";

const EPS = 1e-6;
const DEFAULT_MAX_LAYER_OUTSET_MM = 6;
const MAX_SUPPORT_OUTSET_MM = 48;
const MAX_SUPPORT_OUTSET_RATIO = 0.18;

export interface BoundsInsets {
  left: number;
  right: number;
  bottom: number;
  top: number;
  min: number;
  max: number;
}

export function insetsFromBounds(bounds: Rect, palletWidth: number, palletLength: number): BoundsInsets {
  const left = bounds.x;
  const right = palletWidth - (bounds.x + bounds.w);
  const bottom = bounds.y;
  const top = palletLength - (bounds.y + bounds.l);
  const min = Math.min(left, right, bottom, top);
  const max = Math.max(left, right, bottom, top);
  return {
    left,
    right,
    bottom,
    top,
    min,
    max,
  };
}

export function isWithinSupportEnvelope(
  candidate: Rect,
  support: Rect,
  tolerance = DEFAULT_MAX_LAYER_OUTSET_MM,
): boolean {
  const xTolerance = Math.max(
    tolerance,
    Math.min(MAX_SUPPORT_OUTSET_MM, candidate.w * MAX_SUPPORT_OUTSET_RATIO),
  );
  const yTolerance = Math.max(
    tolerance,
    Math.min(MAX_SUPPORT_OUTSET_MM, candidate.l * MAX_SUPPORT_OUTSET_RATIO),
  );
  const cRight = candidate.x + candidate.w;
  const cTop = candidate.y + candidate.l;
  const sRight = support.x + support.w;
  const sTop = support.y + support.l;

  return candidate.x + EPS >= support.x - xTolerance
    && candidate.y + EPS >= support.y - yTolerance
    && cRight <= sRight + xTolerance + EPS
    && cTop <= sTop + yTolerance + EPS;
}

export function layerFillRatio(
  rects: Rect[],
  boundsOfRects: (rects: Rect[]) => Rect | null,
  areaOf: (rect: Rect) => number,
): number {
  const bounds = boundsOfRects(rects);
  if (!bounds) return 0;
  const used = rects.reduce((sum, rect) => sum + areaOf(rect), 0);
  return used / Math.max(areaOf(bounds), EPS);
}
