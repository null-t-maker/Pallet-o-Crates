import type { PalletInput } from "./packerTypes";
import type { Rect, SelectionMode } from "./packerCoreTypes";

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

function areRectsConnected(a: Rect, b: Rect, deps: ShapeAnalysisDeps, tol = 0.25): boolean {
  if (deps.overlapArea(a, b) > deps.EPS) return true;

  const yOverlap = deps.intervalOverlapLength(a.y, a.y + a.l, b.y, b.y + b.l);
  const xOverlap = deps.intervalOverlapLength(a.x, a.x + a.w, b.x, b.x + b.w);

  if (yOverlap > deps.EPS && (deps.isNear(a.x + a.w, b.x, tol) || deps.isNear(a.x, b.x + b.w, tol))) return true;
  if (xOverlap > deps.EPS && (deps.isNear(a.y + a.l, b.y, tol) || deps.isNear(a.y, b.y + b.l, tol))) return true;
  return false;
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

export function connectedComponentCount(rects: Rect[], deps: ShapeAnalysisDeps): number {
  if (rects.length === 0) return 0;
  const visited = new Array<boolean>(rects.length).fill(false);
  let components = 0;

  for (let i = 0; i < rects.length; i++) {
    if (visited[i]) continue;
    components++;
    const queue: number[] = [i];
    visited[i] = true;

    while (queue.length > 0) {
      const idx = queue.shift() as number;
      for (let j = 0; j < rects.length; j++) {
        if (visited[j]) continue;
        if (!areRectsConnected(rects[idx], rects[j], deps)) continue;
        visited[j] = true;
        queue.push(j);
      }
    }
  }

  return components;
}

