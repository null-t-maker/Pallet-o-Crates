import type { Rect } from "./packerCoreTypes";

const EPS = 1e-6;
const HASH_PRECISION = 2;

export function overlapArea(a: Rect, b: Rect): number {
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + a.l, b.y + b.l) - Math.max(a.y, b.y));
  return ox * oy;
}

export function areaOf(rect: Rect): number {
  return rect.w * rect.l;
}

export function clampToZero(value: number): number {
  return Math.abs(value) < EPS ? 0 : value;
}

export function sortRects(rects: Rect[]): Rect[] {
  return rects.slice().sort((a, b) => {
    if (Math.abs(a.y - b.y) > EPS) return a.y - b.y;
    if (Math.abs(a.x - b.x) > EPS) return a.x - b.x;
    if (Math.abs(a.w - b.w) > EPS) return a.w - b.w;
    return a.l - b.l;
  });
}

export function hashRects(rects: Rect[]): string {
  return sortRects(rects)
    .map((rect) => [
      rect.x.toFixed(HASH_PRECISION),
      rect.y.toFixed(HASH_PRECISION),
      rect.w.toFixed(HASH_PRECISION),
      rect.l.toFixed(HASH_PRECISION),
    ].join(","))
    .join("|");
}

export function isNear(a: number, b: number, tol = 0.25): boolean {
  return Math.abs(a - b) <= tol;
}

export function coversPoint(rect: Rect, px: number, py: number): boolean {
  return rect.x <= px + EPS
    && rect.x + rect.w >= px - EPS
    && rect.y <= py + EPS
    && rect.y + rect.l >= py - EPS;
}

export function touchesWall(rect: Rect, palletWidth: number, palletLength: number): boolean {
  return isNear(rect.x, 0)
    || isNear(rect.y, 0)
    || isNear(rect.x + rect.w, palletWidth)
    || isNear(rect.y + rect.l, palletLength);
}

export function distanceToNearestWall(rect: Rect, palletWidth: number, palletLength: number): number {
  return Math.min(rect.x, rect.y, palletWidth - (rect.x + rect.w), palletLength - (rect.y + rect.l));
}

export function distanceToNearestCorner(rect: Rect, palletWidth: number, palletLength: number): number {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.l / 2;
  const d1 = Math.hypot(cx, cy);
  const d2 = Math.hypot(cx - palletWidth, cy);
  const d3 = Math.hypot(cx, cy - palletLength);
  const d4 = Math.hypot(cx - palletWidth, cy - palletLength);
  return Math.min(d1, d2, d3, d4);
}

export function boundsOfRects(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null;

  let minX = rects[0].x;
  let minY = rects[0].y;
  let maxX = rects[0].x + rects[0].w;
  let maxY = rects[0].y + rects[0].l;

  for (let i = 1; i < rects.length; i++) {
    const rect = rects[i];
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.w);
    maxY = Math.max(maxY, rect.y + rect.l);
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    l: maxY - minY,
  };
}

export function recenterRects(rects: Rect[], palletWidth: number, palletLength: number): Rect[] {
  if (rects.length === 0) return [];
  const bounds = boundsOfRects(rects);
  if (!bounds) return [];

  const targetX = (palletWidth - bounds.w) / 2;
  const targetY = (palletLength - bounds.l) / 2;
  const dx = targetX - bounds.x;
  const dy = targetY - bounds.y;

  return rects.map((rect) => ({
    x: clampToZero(rect.x + dx),
    y: clampToZero(rect.y + dy),
    w: rect.w,
    l: rect.l,
  }));
}

export function intervalOverlapLength(a1: number, a2: number, b1: number, b2: number): number {
  return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
}

export function lateralContactLength(rect: Rect, blockedRects: Rect[]): number {
  let contact = 0;
  for (const blocked of blockedRects) {
    const yOverlap = intervalOverlapLength(rect.y, rect.y + rect.l, blocked.y, blocked.y + blocked.l);
    const xOverlap = intervalOverlapLength(rect.x, rect.x + rect.w, blocked.x, blocked.x + blocked.w);

    if (isNear(rect.x + rect.w, blocked.x, 0.25)) contact += yOverlap;
    if (isNear(rect.x, blocked.x + blocked.w, 0.25)) contact += yOverlap;
    if (isNear(rect.y + rect.l, blocked.y, 0.25)) contact += xOverlap;
    if (isNear(rect.y, blocked.y + blocked.l, 0.25)) contact += xOverlap;
  }
  return contact;
}
