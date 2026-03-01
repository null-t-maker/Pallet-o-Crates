import type { CartonInput, PalletInput } from "./packerTypes";
import type { OrientationOption, Rect } from "./packerCoreTypes";

interface AnchorDeps {
  EPS: number;
  clampToZero: (value: number) => number;
}

interface ContactDeps {
  isNear: (a: number, b: number, tol?: number) => boolean;
}

interface HeightLevelsDeps extends AnchorDeps {
  orientationOptions: (carton: CartonInput, allowUpright: boolean) => OrientationOption[];
  canUseUprightNow: (carton: CartonInput, allowUpright: boolean) => boolean;
}

export function anchorPositions(
  blockedRects: Rect[],
  span: number,
  item: number,
  axis: "x" | "y",
  deps: AnchorDeps,
): number[] {
  const vals = new Set<number>();
  vals.add(0);
  vals.add(deps.clampToZero((span - item) / 2));
  vals.add(deps.clampToZero(span - item));

  for (const blocked of blockedRects) {
    const pos = axis === "x" ? blocked.x : blocked.y;
    const size = axis === "x" ? blocked.w : blocked.l;
    vals.add(deps.clampToZero(pos));
    vals.add(deps.clampToZero(pos + size));
    vals.add(deps.clampToZero(pos - item));
    vals.add(deps.clampToZero(pos + (size - item) / 2));
  }

  return Array.from(vals)
    .filter((value) => value >= -deps.EPS && value + item <= span + deps.EPS)
    .map((value) => Math.max(0, Math.min(span - item, value)))
    .sort((a, b) => a - b);
}

function intervalOverlapLength(a1: number, a2: number, b1: number, b2: number): number {
  return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
}

export function lateralContactLength(rect: Rect, blockedRects: Rect[], deps: ContactDeps): number {
  let contact = 0;
  for (const blocked of blockedRects) {
    const yOverlap = intervalOverlapLength(rect.y, rect.y + rect.l, blocked.y, blocked.y + blocked.l);
    const xOverlap = intervalOverlapLength(rect.x, rect.x + rect.w, blocked.x, blocked.x + blocked.w);

    if (deps.isNear(rect.x + rect.w, blocked.x, 0.25)) contact += yOverlap;
    if (deps.isNear(rect.x, blocked.x + blocked.w, 0.25)) contact += yOverlap;
    if (deps.isNear(rect.y + rect.l, blocked.y, 0.25)) contact += xOverlap;
    if (deps.isNear(rect.y, blocked.y + blocked.l, 0.25)) contact += xOverlap;
  }
  return contact;
}

export function nearestGapDistance(rect: Rect, blockedRects: Rect[]): number {
  if (blockedRects.length === 0) return 0;
  let minGap = Number.POSITIVE_INFINITY;

  for (const blocked of blockedRects) {
    const dx = Math.max(
      0,
      Math.max(blocked.x - (rect.x + rect.w), rect.x - (blocked.x + blocked.w)),
    );
    const dy = Math.max(
      0,
      Math.max(blocked.y - (rect.y + rect.l), rect.y - (blocked.y + blocked.l)),
    );
    const gap = Math.hypot(dx, dy);
    minGap = Math.min(minGap, gap);
  }

  return Number.isFinite(minGap) ? minGap : 0;
}

export function exhaustiveAxisPositions(span: number, item: number, deps: AnchorDeps): number[] {
  if (item > span + deps.EPS) return [];

  const max = span - item;
  const step = Math.max(10, Math.min(40, Math.floor(item / 4)));
  const values = new Set<number>([0, deps.clampToZero(max / 2), deps.clampToZero(max)]);

  for (let pos = 0; pos <= max + deps.EPS; pos += step) {
    values.add(deps.clampToZero(Math.min(max, pos)));
  }

  return Array.from(values)
    .filter((value) => value >= -deps.EPS && value <= max + deps.EPS)
    .map((value) => Math.max(0, Math.min(max, value)))
    .sort((a, b) => a - b);
}

export function heightLevelsForGapPlacement(
  pallet: PalletInput,
  rem: CartonInput[],
  zBase: number,
  allowUpright: boolean,
  minHeightExclusive: number,
  deps: HeightLevelsDeps,
): number[] {
  const levels = new Set<number>();
  for (const carton of rem) {
    if (carton.quantity <= 0 || carton.weight <= 0) continue;
    for (const orientation of deps.orientationOptions(carton, deps.canUseUprightNow(carton, allowUpright))) {
      if (orientation.h <= minHeightExclusive + 0.25) continue;
      if (zBase + orientation.h > pallet.maxHeight + deps.EPS) continue;
      levels.add(Number(orientation.h.toFixed(3)));
    }
  }
  return Array.from(levels).sort((a, b) => a - b);
}

