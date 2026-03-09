import type { PalletInput } from "./packerTypes";
import type { Rect, SelectionMode } from "./packerCoreTypes";
export { connectedComponentCount } from "./packerShapeConnectivity";

export interface ShapeAnalysisDeps {
  EPS: number;
  boundsOfRects: (rects: Rect[]) => Rect | null;
  touchesWall: (rect: Rect, palletWidth: number, palletLength: number) => boolean;
  lateralContactLength: (rect: Rect, blockedRects: Rect[]) => number;
  isWithinSupportEnvelope: (candidate: Rect, support: Rect, tolerance?: number) => boolean;
  distanceToNearestWall: (rect: Rect, palletWidth: number, palletLength: number) => number;
  coversPoint: (rect: Rect, px: number, py: number) => boolean;
  overlapArea: (a: Rect, b: Rect) => number;
  intervalOverlapLength: (a1: number, a2: number, b1: number, b2: number) => number;
  isNear: (a: number, b: number, tol?: number) => boolean;
}

export function hasWrapBlockingEdgeProtrusion(
  rects: Rect[],
  palletWidth: number,
  palletLength: number,
  deps: ShapeAnalysisDeps,
): boolean {
  if (rects.length < 4) return false;

  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    if (!deps.touchesWall(rect, palletWidth, palletLength)) continue;

    const others: Rect[] = [];
    for (let j = 0; j < rects.length; j++) {
      if (j !== i) others.push(rects[j]);
    }
    const contact = deps.lateralContactLength(rect, others);
    const contactNeed = Math.min(rect.w, rect.l) * 0.22;
    if (contact + deps.EPS < contactNeed) return true;
  }

  return false;
}

export function isWrapFriendlyLayerShape(
  rects: Rect[],
  supportRects: Rect[],
  pallet: PalletInput,
  deps: ShapeAnalysisDeps,
): boolean {
  if (rects.length === 0) return false;
  const bounds = deps.boundsOfRects(rects);
  if (!bounds) return false;

  const supportBounds = deps.boundsOfRects(supportRects);
  if (supportBounds && !deps.isWithinSupportEnvelope(bounds, supportBounds)) {
    return false;
  }

  if (hasWrapBlockingEdgeProtrusion(rects, pallet.width, pallet.length, deps)) {
    return false;
  }

  return true;
}

export function compactness(
  rects: Rect[],
  palletWidth: number,
  palletLength: number,
  mode: SelectionMode,
  deps: ShapeAnalysisDeps,
): number {
  if (rects.length === 0) return 0;

  const cx = palletWidth / 2;
  const cy = palletLength / 2;
  const maxCenterDist = Math.hypot(cx, cy) || 1;
  const maxWallDist = Math.min(palletWidth, palletLength) / 2 || 1;

  if (mode === "center" || mode === "pin") {
    let sum = 0;
    for (const rect of rects) {
      const rx = rect.x + rect.w / 2;
      const ry = rect.y + rect.l / 2;
      const centerDist = Math.hypot(rx - cx, ry - cy) / maxCenterDist;
      const axisDist = Math.min(Math.abs(rx - cx), Math.abs(ry - cy)) / Math.max(Math.min(palletWidth, palletLength) / 2, deps.EPS);
      sum += mode === "pin" ? (centerDist * 0.5 + axisDist * 0.5) : centerDist;
    }
    return 1 - (sum / rects.length);
  }

  let sum = 0;
  for (const rect of rects) {
    sum += deps.distanceToNearestWall(rect, palletWidth, palletLength) / maxWallDist;
  }
  return 1 - (sum / rects.length);
}

export function cornerCoverage(
  rects: Rect[],
  palletWidth: number,
  palletLength: number,
  deps: ShapeAnalysisDeps,
): number {
  const corners: Array<[number, number]> = [
    [0, 0],
    [palletWidth, 0],
    [0, palletLength],
    [palletWidth, palletLength],
  ];

  let covered = 0;
  for (const [x, y] of corners) {
    const px = x === 0 ? 0.001 : x - 0.001;
    const py = y === 0 ? 0.001 : y - 0.001;
    if (rects.some((rect) => deps.coversPoint(rect, px, py))) covered++;
  }
  return covered;
}
