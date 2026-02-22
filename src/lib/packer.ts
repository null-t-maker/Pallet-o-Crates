import { v4 as uuidv4 } from "uuid";

export type PalletPackingStyle = "centerCompact" | "edgeAligned";
export type CartonUprightPolicy = "never" | "tailOnly" | "prefer";

export interface PalletInput {
  width: number;
  length: number;
  maxHeight: number;
  maxWeight: number;
  packingStyle?: PalletPackingStyle;
}

export interface CartonInput {
  id: string;
  title: string;
  width: number;
  length: number;
  height: number;
  weight: number;
  quantity: number;
  color: string;
  uprightPolicy?: CartonUprightPolicy;
  allowUpright?: boolean;
}

export interface PackedCarton {
  id: string;
  typeId: string;
  title: string;
  x: number;
  y: number;
  z: number;
  w: number;
  l: number;
  h: number;
  weight: number;
  color: string;
}

export interface Layer {
  zBase: number;
  height: number;
  cartons: PackedCarton[];
}

export interface PackResult {
  layers: Layer[];
  totalWeight: number;
  totalHeight: number;
  unpacked: CartonInput[];
}

interface Rect {
  x: number;
  y: number;
  w: number;
  l: number;
}

interface PlacementRect extends Rect {
  typeId: string;
  weight: number;
  density: number;
  h: number;
}

interface Pattern {
  id: string;
  rects: Rect[];
}

type SelectionMode = "edge" | "center" | "pin";
type EvaluationProfile = "strict" | "normal" | "rescue";

interface LayerState {
  prevPlacements: PlacementRect[];
  prevLayerTypeId: string | null;
  prevHash: string;
  prevMirrorHashes: Set<string>;
  streakByFootprint: Map<string, number>;
  streakByType: Map<string, number>;
  typeWaitById: Map<string, number>;
  prevWallCoverage: number;
  prevCenterOccupancy: number;
  centerGapStreak: number;
  layerIndex: number;
}

interface SupportInfo {
  ratio: number;
  touching: number;
  centroidSupported: boolean;
  maxOverlapRatio: number;
  overlaps: Array<{ below: PlacementRect; area: number }>;
}

interface WallStats {
  coverage: number;
  balance: number;
  segments: number;
}

interface GapStats {
  largestGapRatio: number;
  emptyRatio: number;
}

interface CenterStats {
  occupancy: number;
  axisCoverage: number;
  hasCentralGap: boolean;
}

interface Evaluation {
  valid: boolean;
  score: number;
  layoutHash: string;
}

interface BestCandidate {
  carton: CartonInput;
  rects: Rect[];
  score: number;
  layoutHash: string;
}

interface OrientationOption {
  w: number;
  l: number;
  h: number;
  upright: boolean;
}

interface GapPlacementCandidate {
  carton: CartonInput;
  rect: Rect;
  orientation: OrientationOption;
  score: number;
}

const EPS = 1e-6;
const HASH_PRECISION = 2;
const MAX_LAYER_OUTSET_MM = 6;
const PREFERRED_MIN_EDGE_SETBACK_MM = 12;
const MAX_RECOMMENDED_EDGE_SETBACK_MM = 80;

function resolvePackingStyle(pallet: PalletInput): PalletPackingStyle {
  return pallet.packingStyle === "centerCompact" ? "centerCompact" : "edgeAligned";
}

function resolveUprightPolicy(carton: CartonInput): CartonUprightPolicy {
  if (carton.uprightPolicy === "never" || carton.uprightPolicy === "tailOnly" || carton.uprightPolicy === "prefer") {
    return carton.uprightPolicy;
  }
  if (carton.allowUpright === false) return "never";
  return "prefer";
}

function canUseUprightNow(carton: CartonInput, allowUpright: boolean): boolean {
  if (!allowUpright) return false;
  const policy = resolveUprightPolicy(carton);
  if (policy === "never") return false;
  return true;
}

function hasAnyPreferredUprightCandidates(rem: CartonInput[]): boolean {
  return rem.some((carton) => carton.quantity > 0 && resolveUprightPolicy(carton) === "prefer");
}

function hasAnyNonNeverUprightCandidates(rem: CartonInput[]): boolean {
  return rem.some((carton) => carton.quantity > 0 && resolveUprightPolicy(carton) !== "never");
}

function overlapArea(a: Rect, b: Rect): number {
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + a.l, b.y + b.l) - Math.max(a.y, b.y));
  return ox * oy;
}

function areaOf(r: Rect): number {
  return r.w * r.l;
}

function clampToZero(value: number): number {
  return Math.abs(value) < EPS ? 0 : value;
}

function sortRects(rects: Rect[]): Rect[] {
  return rects.slice().sort((a, b) => {
    if (Math.abs(a.y - b.y) > EPS) return a.y - b.y;
    if (Math.abs(a.x - b.x) > EPS) return a.x - b.x;
    if (Math.abs(a.w - b.w) > EPS) return a.w - b.w;
    return a.l - b.l;
  });
}

function hashRects(rects: Rect[]): string {
  return sortRects(rects)
    .map((r) => [
      r.x.toFixed(HASH_PRECISION),
      r.y.toFixed(HASH_PRECISION),
      r.w.toFixed(HASH_PRECISION),
      r.l.toFixed(HASH_PRECISION),
    ].join(","))
    .join("|");
}

function isNear(a: number, b: number, tol = 0.25): boolean {
  return Math.abs(a - b) <= tol;
}

function coversPoint(rect: Rect, px: number, py: number): boolean {
  return rect.x <= px + EPS
    && rect.x + rect.w >= px - EPS
    && rect.y <= py + EPS
    && rect.y + rect.l >= py - EPS;
}

function touchesWall(rect: Rect, pw: number, pl: number): boolean {
  return isNear(rect.x, 0) || isNear(rect.y, 0) || isNear(rect.x + rect.w, pw) || isNear(rect.y + rect.l, pl);
}

function distanceToNearestWall(rect: Rect, pw: number, pl: number): number {
  return Math.min(rect.x, rect.y, pw - (rect.x + rect.w), pl - (rect.y + rect.l));
}

function distanceToNearestCorner(rect: Rect, pw: number, pl: number): number {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.l / 2;
  const d1 = Math.hypot(cx, cy);
  const d2 = Math.hypot(cx - pw, cy);
  const d3 = Math.hypot(cx, cy - pl);
  const d4 = Math.hypot(cx - pw, cy - pl);
  return Math.min(d1, d2, d3, d4);
}

function boundsOfRects(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null;

  let minX = rects[0].x;
  let minY = rects[0].y;
  let maxX = rects[0].x + rects[0].w;
  let maxY = rects[0].y + rects[0].l;

  for (let i = 1; i < rects.length; i++) {
    const r = rects[i];
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.w);
    maxY = Math.max(maxY, r.y + r.l);
  }

  return {
    x: minX,
    y: minY,
    w: Math.max(0, maxX - minX),
    l: Math.max(0, maxY - minY),
  };
}

function recenterRects(rects: Rect[], pw: number, pl: number): Rect[] {
  const bounds = boundsOfRects(rects);
  if (!bounds) return rects.map((r) => ({ ...r }));

  const targetX = (pw - bounds.w) / 2;
  const targetY = (pl - bounds.l) / 2;
  const dx = targetX - bounds.x;
  const dy = targetY - bounds.y;

  return rects.map((r) => ({
    x: clampToZero(r.x + dx),
    y: clampToZero(r.y + dy),
    w: r.w,
    l: r.l,
  }));
}

function insetsFromBounds(bounds: Rect, pw: number, pl: number): {
  left: number;
  right: number;
  bottom: number;
  top: number;
  min: number;
  max: number;
} {
  const left = bounds.x;
  const right = pw - (bounds.x + bounds.w);
  const bottom = bounds.y;
  const top = pl - (bounds.y + bounds.l);
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

function isWithinSupportEnvelope(
  candidate: Rect,
  support: Rect,
  tolerance = MAX_LAYER_OUTSET_MM,
): boolean {
  const cRight = candidate.x + candidate.w;
  const cTop = candidate.y + candidate.l;
  const sRight = support.x + support.w;
  const sTop = support.y + support.l;

  return candidate.x + EPS >= support.x - tolerance
    && candidate.y + EPS >= support.y - tolerance
    && cRight <= sRight + tolerance + EPS
    && cTop <= sTop + tolerance + EPS;
}

function layerFillRatio(rects: Rect[]): number {
  const bounds = boundsOfRects(rects);
  if (!bounds) return 0;
  const used = rects.reduce((sum, r) => sum + areaOf(r), 0);
  return used / Math.max(areaOf(bounds), EPS);
}

function hasWrapBlockingEdgeProtrusion(rects: Rect[], pw: number, pl: number): boolean {
  if (rects.length < 4) return false;

  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    if (!touchesWall(rect, pw, pl)) continue;

    const others: Rect[] = [];
    for (let j = 0; j < rects.length; j++) {
      if (j !== i) others.push(rects[j]);
    }
    const contact = lateralContactLength(rect, others);
    const contactNeed = Math.min(rect.w, rect.l) * 0.22;
    if (contact + EPS < contactNeed) return true;
  }

  return false;
}

function isWrapFriendlyLayerShape(
  rects: Rect[],
  supportRects: Rect[],
  pallet: PalletInput,
): boolean {
  if (rects.length === 0) return false;
  const bounds = boundsOfRects(rects);
  if (!bounds) return false;

  const supportBounds = boundsOfRects(supportRects);
  if (supportBounds && !isWithinSupportEnvelope(bounds, supportBounds)) {
    return false;
  }

  if (hasWrapBlockingEdgeProtrusion(rects, pallet.width, pallet.length)) {
    return false;
  }

  return true;
}

function compactness(rects: Rect[], pw: number, pl: number, mode: SelectionMode): number {
  if (rects.length === 0) return 0;

  const cx = pw / 2;
  const cy = pl / 2;
  const maxCenterDist = Math.hypot(cx, cy) || 1;
  const maxWallDist = Math.min(pw, pl) / 2 || 1;

  if (mode === "center" || mode === "pin") {
    let sum = 0;
    for (const r of rects) {
      const rx = r.x + r.w / 2;
      const ry = r.y + r.l / 2;
      const centerDist = Math.hypot(rx - cx, ry - cy) / maxCenterDist;
      const axisDist = Math.min(Math.abs(rx - cx), Math.abs(ry - cy)) / Math.max(Math.min(pw, pl) / 2, EPS);
      sum += mode === "pin" ? (centerDist * 0.5 + axisDist * 0.5) : centerDist;
    }
    return 1 - (sum / rects.length);
  }

  let sum = 0;
  for (const r of rects) {
    sum += distanceToNearestWall(r, pw, pl) / maxWallDist;
  }
  return 1 - (sum / rects.length);
}

function cornerCoverage(rects: Rect[], pw: number, pl: number): number {
  const corners: Array<[number, number]> = [
    [0, 0],
    [pw, 0],
    [0, pl],
    [pw, pl],
  ];

  let covered = 0;
  for (const [x, y] of corners) {
    const px = x === 0 ? 0.001 : x - 0.001;
    const py = y === 0 ? 0.001 : y - 0.001;
    if (rects.some((r) => coversPoint(r, px, py))) covered++;
  }
  return covered;
}

function mergeIntervals(intervals: Array<[number, number]>): Array<[number, number]> {
  if (intervals.length === 0) return [];
  const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);
  const out: Array<[number, number]> = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const [start, end] = sorted[i];
    const last = out[out.length - 1];
    if (start <= last[1] + EPS) {
      last[1] = Math.max(last[1], end);
    } else {
      out.push([start, end]);
    }
  }
  return out;
}

function wallStats(rects: Rect[], pw: number, pl: number): WallStats {
  const leftIntervals: Array<[number, number]> = [];
  const rightIntervals: Array<[number, number]> = [];
  const bottomIntervals: Array<[number, number]> = [];
  const topIntervals: Array<[number, number]> = [];

  for (const r of rects) {
    if (isNear(r.x, 0)) leftIntervals.push([r.y, r.y + r.l]);
    if (isNear(r.x + r.w, pw)) rightIntervals.push([r.y, r.y + r.l]);
    if (isNear(r.y, 0)) bottomIntervals.push([r.x, r.x + r.w]);
    if (isNear(r.y + r.l, pl)) topIntervals.push([r.x, r.x + r.w]);
  }

  const left = mergeIntervals(leftIntervals);
  const right = mergeIntervals(rightIntervals);
  const bottom = mergeIntervals(bottomIntervals);
  const top = mergeIntervals(topIntervals);

  const lenLeft = left.reduce((acc, [a, b]) => acc + (b - a), 0);
  const lenRight = right.reduce((acc, [a, b]) => acc + (b - a), 0);
  const lenBottom = bottom.reduce((acc, [a, b]) => acc + (b - a), 0);
  const lenTop = top.reduce((acc, [a, b]) => acc + (b - a), 0);

  const coverage = (
    (lenLeft / Math.max(pl, EPS))
    + (lenRight / Math.max(pl, EPS))
    + (lenBottom / Math.max(pw, EPS))
    + (lenTop / Math.max(pw, EPS))
  ) / 4;

  const balance = 1 - (
    (Math.abs((lenLeft / Math.max(pl, EPS)) - (lenRight / Math.max(pl, EPS)))
      + Math.abs((lenBottom / Math.max(pw, EPS)) - (lenTop / Math.max(pw, EPS))))
    / 2
  );

  const segments = left.length + right.length + bottom.length + top.length;

  return {
    coverage: Math.max(0, Math.min(1, coverage)),
    balance: Math.max(0, Math.min(1, balance)),
    segments,
  };
}

function estimateGapStats(rects: Rect[], pw: number, pl: number): GapStats {
  if (rects.length === 0) {
    return { largestGapRatio: 1, emptyRatio: 1 };
  }

  const gridX = 20;
  const gridY = 20;
  const stepX = pw / gridX;
  const stepY = pl / gridY;

  const occupied: boolean[][] = Array.from({ length: gridY }, () => Array.from({ length: gridX }, () => false));
  let filledCells = 0;

  for (let gy = 0; gy < gridY; gy++) {
    for (let gx = 0; gx < gridX; gx++) {
      const px = (gx + 0.5) * stepX;
      const py = (gy + 0.5) * stepY;
      const isFilled = rects.some((r) => coversPoint(r, px, py));
      occupied[gy][gx] = isFilled;
      if (isFilled) filledCells++;
    }
  }

  const visited: boolean[][] = Array.from({ length: gridY }, () => Array.from({ length: gridX }, () => false));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let largestEmptyComponent = 0;

  for (let gy = 0; gy < gridY; gy++) {
    for (let gx = 0; gx < gridX; gx++) {
      if (visited[gy][gx] || occupied[gy][gx]) continue;

      let cells = 0;
      const queue: Array<[number, number]> = [[gx, gy]];
      visited[gy][gx] = true;

      while (queue.length > 0) {
        const [cx, cy] = queue.shift() as [number, number];
        cells++;

        for (const [dx, dy] of dirs) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= gridX || ny < 0 || ny >= gridY) continue;
          if (visited[ny][nx] || occupied[ny][nx]) continue;
          visited[ny][nx] = true;
          queue.push([nx, ny]);
        }
      }

      largestEmptyComponent = Math.max(largestEmptyComponent, cells);
    }
  }

  const totalCells = gridX * gridY;
  const emptyCells = totalCells - filledCells;
  return {
    largestGapRatio: largestEmptyComponent / totalCells,
    emptyRatio: emptyCells / totalCells,
  };
}

function centerStats(rects: Rect[], pw: number, pl: number): CenterStats {
  if (rects.length === 0) {
    return {
      occupancy: 0,
      axisCoverage: 0,
      hasCentralGap: true,
    };
  }

  const zoneScale = 0.36;
  const zoneW = pw * zoneScale;
  const zoneL = pl * zoneScale;
  const zoneX = (pw - zoneW) / 2;
  const zoneY = (pl - zoneL) / 2;
  const grid = 10;
  const stepX = zoneW / grid;
  const stepY = zoneL / grid;
  let filled = 0;

  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      const px = zoneX + (gx + 0.5) * stepX;
      const py = zoneY + (gy + 0.5) * stepY;
      if (rects.some((r) => coversPoint(r, px, py))) filled++;
    }
  }

  const midX = pw / 2;
  const midY = pl / 2;
  const crossX = rects.some((r) => r.x <= midX + EPS && r.x + r.w >= midX - EPS);
  const crossY = rects.some((r) => r.y <= midY + EPS && r.y + r.l >= midY - EPS);
  const axisCoverage = (crossX ? 0.5 : 0) + (crossY ? 0.5 : 0);
  const occupancy = filled / (grid * grid);
  const hasCentralGap = occupancy < 0.22 && axisCoverage < 1;

  return {
    occupancy,
    axisCoverage,
    hasCentralGap,
  };
}

function areRectsConnected(a: Rect, b: Rect, tol = 0.25): boolean {
  if (overlapArea(a, b) > EPS) return true;

  const yOverlap = intervalOverlapLength(a.y, a.y + a.l, b.y, b.y + b.l);
  const xOverlap = intervalOverlapLength(a.x, a.x + a.w, b.x, b.x + b.w);

  if (yOverlap > EPS && (isNear(a.x + a.w, b.x, tol) || isNear(a.x, b.x + b.w, tol))) return true;
  if (xOverlap > EPS && (isNear(a.y + a.l, b.y, tol) || isNear(a.y, b.y + b.l, tol))) return true;
  return false;
}

function connectedComponentCount(rects: Rect[]): number {
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
        if (!areRectsConnected(rects[idx], rects[j])) continue;
        visited[j] = true;
        queue.push(j);
      }
    }
  }

  return components;
}

function analyzeSupport(rect: Rect, below: PlacementRect[]): SupportInfo {
  const overlaps: Array<{ below: PlacementRect; area: number }> = [];
  if (below.length === 0) {
    return {
      ratio: 1,
      touching: 1,
      centroidSupported: true,
      maxOverlapRatio: 1,
      overlaps,
    };
  }

  const topArea = areaOf(rect);
  let supportedArea = 0;
  let maxOverlapRatio = 0;
  for (const b of below) {
    const overlap = overlapArea(rect, b);
    if (overlap <= EPS) continue;
    overlaps.push({ below: b, area: overlap });
    supportedArea += overlap;
    maxOverlapRatio = Math.max(maxOverlapRatio, overlap / topArea);
  }

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.l / 2;
  const centroidSupported = below.some((b) => coversPoint(b, cx, cy));

  return {
    ratio: supportedArea / Math.max(topArea, EPS),
    touching: overlaps.length,
    centroidSupported,
    maxOverlapRatio,
    overlaps,
  };
}

function pressureSafe(
  cartonWeight: number,
  support: SupportInfo,
  pressureLimitFactor: number,
): { ok: boolean; marginScore: number } {
  if (support.overlaps.length === 0) return { ok: false, marginScore: 0 };

  const totalOverlap = support.overlaps.reduce((acc, o) => acc + o.area, 0);
  if (totalOverlap <= EPS) return { ok: false, marginScore: 0 };

  let marginScore = 0;
  for (const o of support.overlaps) {
    const sharedWeight = cartonWeight * (o.area / totalOverlap);
    const pressure = sharedWeight / Math.max(o.area, EPS);
    const ratio = pressure / Math.max(o.below.density, EPS);
    if (ratio > pressureLimitFactor) return { ok: false, marginScore: 0 };
    marginScore += Math.max(0, pressureLimitFactor - ratio);
  }

  return {
    ok: true,
    marginScore: marginScore / support.overlaps.length,
  };
}

function structuralSupportSafe(
  topWeight: number,
  topArea: number,
  support: SupportInfo,
): boolean {
  if (support.overlaps.length === 0) return false;

  let dominant = support.overlaps[0];
  for (const o of support.overlaps) {
    if (o.area > dominant.area) dominant = o;
  }

  const totalOverlap = support.overlaps.reduce((sum, o) => sum + o.area, 0);
  if (totalOverlap <= EPS) return false;

  for (const o of support.overlaps) {
    const share = topWeight * (o.area / totalOverlap);
    const shareRatio = share / Math.max(o.below.weight, EPS);
    const supportShareRatio = o.area / Math.max(topArea, EPS);
    const topMuchHeavier = topWeight > o.below.weight * 1.35;

    // Prevent a heavier carton from relying mostly on one or two lighter supports.
    if (topMuchHeavier && shareRatio > 0.95 && (supportShareRatio >= 0.45 || support.touching <= 2)) {
      return false;
    }
  }

  const dominantRatio = dominant.area / Math.max(topArea, EPS);
  const belowArea = areaOf(dominant.below);
  const topDensity = topWeight / Math.max(topArea, EPS);
  const densityRatio = topDensity / Math.max(dominant.below.density, EPS);
  const weightRatio = topWeight / Math.max(dominant.below.weight, EPS);
  if (support.touching <= 1) {
    const belowSmaller = belowArea + EPS < topArea * 0.98;
    const heavyOnLight = weightRatio > 1.25 || densityRatio > 1.15;

    // Targeted hard block: one smaller carton cannot carry a larger/heavier carton with overhang.
    if (belowSmaller && heavyOnLight) {
      if (support.ratio < 0.96) return false;
      if (dominantRatio < 0.88) return false;
    }
  }

  return true;
}

function cartonDensity(carton: Pick<CartonInput, "width" | "length" | "weight">): number {
  return carton.weight / Math.max(carton.width * carton.length, EPS);
}

function canBeSafelySupportedByOtherTypes(
  carton: CartonInput,
  rem: CartonInput[],
  pressureFactor = 2.25,
): boolean {
  const targetDensity = cartonDensity(carton);
  const targetArea = carton.width * carton.length;
  for (const other of rem) {
    if (other.id === carton.id || other.quantity <= 0) continue;
    const supportDensity = cartonDensity(other);
    const supportArea = other.width * other.length;
    const weightOk = other.weight + EPS >= carton.weight * 0.9;
    const areaOk = supportArea + EPS >= targetArea * 0.9;
    const densityOk = targetDensity <= supportDensity * pressureFactor + EPS;
    if (weightOk && areaOk && densityOk) return true;
  }
  return false;
}

function exactAlignmentCount(rects: Rect[], below: PlacementRect[]): number {
  let count = 0;
  for (const r of rects) {
    const aligned = below.some((b) =>
      isNear(r.x, b.x, 0.2)
      && isNear(r.y, b.y, 0.2)
      && isNear(r.w, b.w, 0.2)
      && isNear(r.l, b.l, 0.2));
    if (aligned) count++;
  }
  return count;
}

function footprintKey(r: Rect): string {
  return [
    r.x.toFixed(1),
    r.y.toFixed(1),
    r.w.toFixed(1),
    r.l.toFixed(1),
  ].join("|");
}

function typedFootprintKey(r: Rect, typeId: string): string {
  return `${typeId}|${footprintKey(r)}`;
}

function sampleCounts(max: number): number[] {
  if (max <= 0) return [0];
  if (max <= 8) return Array.from({ length: max + 1 }, (_, i) => i);

  const set = new Set<number>([
    0,
    1,
    2,
    3,
    Math.floor(max / 3),
    Math.floor(max / 2),
    Math.floor((2 * max) / 3),
    max - 3,
    max - 2,
    max - 1,
    max,
  ]);
  return Array.from(set).filter((v) => v >= 0 && v <= max).sort((a, b) => a - b);
}

function axisCoords(span: number, item: number, count: number, anchor: SelectionMode): number[] {
  if (count <= 0 || item <= 0) return [];
  const used = count * item;
  if (used > span + EPS) return [];

  if (anchor === "center") {
    const start = (span - used) / 2;
    return Array.from({ length: count }, (_, i) => clampToZero(start + i * item));
  }

  if (count === 1) return [0];
  const frontCount = Math.floor(count / 2);
  const backCount = count - frontCount;
  const coords: number[] = [];

  for (let i = 0; i < frontCount; i++) {
    coords.push(clampToZero(i * item));
  }

  const backStart = span - backCount * item;
  for (let i = 0; i < backCount; i++) {
    coords.push(clampToZero(backStart + i * item));
  }

  return coords.sort((a, b) => a - b);
}

function buildGrid(
  zoneX: number,
  zoneY: number,
  zoneW: number,
  zoneL: number,
  itemW: number,
  itemL: number,
  anchorX: SelectionMode,
  anchorY: SelectionMode,
): Rect[] {
  const cols = Math.floor((zoneW + EPS) / itemW);
  const rows = Math.floor((zoneL + EPS) / itemL);
  if (cols <= 0 || rows <= 0) return [];

  const xs = axisCoords(zoneW, itemW, cols, anchorX).map((x) => zoneX + x);
  const ys = axisCoords(zoneL, itemL, rows, anchorY).map((y) => zoneY + y);
  const out: Rect[] = [];

  for (const x of xs) {
    for (const y of ys) {
      out.push({ x, y, w: itemW, l: itemL });
    }
  }
  return out;
}

function transformRects(rects: Rect[], pw: number, pl: number, mode: "normal" | "mx" | "my" | "r180"): Rect[] {
  switch (mode) {
    case "normal":
      return rects.map((r) => ({ ...r }));
    case "mx":
      return rects.map((r) => ({ x: clampToZero(pw - r.x - r.w), y: r.y, w: r.w, l: r.l }));
    case "my":
      return rects.map((r) => ({ x: r.x, y: clampToZero(pl - r.y - r.l), w: r.w, l: r.l }));
    case "r180":
      return rects.map((r) => ({
        x: clampToZero(pw - r.x - r.w),
        y: clampToZero(pl - r.y - r.l),
        w: r.w,
        l: r.l,
      }));
  }
}

function getPatternCandidates(
  pw: number,
  pl: number,
  cw: number,
  cl: number,
  cache: Map<string, Pattern[]>,
): Pattern[] {
  const cacheKey = [pw, pl, cw, cl].join("|");
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const oA = { w: cw, l: cl };
  const oB = { w: cl, l: cw };
  const base: Pattern[] = [];
  const seenBase = new Set<string>();

  const pushBase = (id: string, rects: Rect[]): void => {
    if (rects.length === 0) return;
    const hash = hashRects(rects);
    if (seenBase.has(hash)) return;
    seenBase.add(hash);
    base.push({ id, rects: sortRects(rects) });
  };

  pushBase("grid-edge-a", buildGrid(0, 0, pw, pl, oA.w, oA.l, "edge", "edge"));
  pushBase("grid-center-a", buildGrid(0, 0, pw, pl, oA.w, oA.l, "center", "center"));

  if (!isNear(oA.w, oB.w) || !isNear(oA.l, oB.l)) {
    pushBase("grid-edge-b", buildGrid(0, 0, pw, pl, oB.w, oB.l, "edge", "edge"));
    pushBase("grid-center-b", buildGrid(0, 0, pw, pl, oB.w, oB.l, "center", "center"));
  }

  for (const colsLeft of sampleCounts(Math.floor((pw + EPS) / oA.w))) {
    const leftW = colsLeft * oA.w;
    const colsRight = Math.floor((pw - leftW + EPS) / oB.w);
    const rightW = colsRight * oB.w;
    if (leftW <= EPS && rightW <= EPS) continue;

    const rects = [
      ...buildGrid(0, 0, leftW, pl, oA.w, oA.l, "edge", "edge"),
      ...buildGrid(pw - rightW, 0, rightW, pl, oB.w, oB.l, "edge", "edge"),
    ];
    pushBase(`split-v-${colsLeft}-${colsRight}`, rects);
  }

  for (const rowsBottom of sampleCounts(Math.floor((pl + EPS) / oA.l))) {
    const bottomL = rowsBottom * oA.l;
    const rowsTop = Math.floor((pl - bottomL + EPS) / oB.l);
    const topL = rowsTop * oB.l;
    if (bottomL <= EPS && topL <= EPS) continue;

    const rects = [
      ...buildGrid(0, 0, pw, bottomL, oA.w, oA.l, "edge", "edge"),
      ...buildGrid(0, pl - topL, pw, topL, oB.w, oB.l, "edge", "edge"),
    ];
    pushBase(`split-h-${rowsBottom}-${rowsTop}`, rects);
  }

  for (const centerCols of sampleCounts(Math.floor((pw + EPS) / oB.w)).filter((v) => v > 0)) {
    const centerW = centerCols * oB.w;
    const leftRightSpace = pw - centerW;
    if (leftRightSpace <= 0) continue;
    const sideCols = Math.floor(((leftRightSpace / 2) + EPS) / oA.w);
    if (sideCols <= 0) continue;
    const sideW = sideCols * oA.w;
    const centerX = (pw - centerW) / 2;
    if (centerX < sideW - EPS) continue;

    const rects = [
      ...buildGrid(0, 0, sideW, pl, oA.w, oA.l, "edge", "edge"),
      ...buildGrid(centerX, 0, centerW, pl, oB.w, oB.l, "edge", "edge"),
      ...buildGrid(pw - sideW, 0, sideW, pl, oA.w, oA.l, "edge", "edge"),
    ];
    pushBase(`triple-v-${centerCols}-${sideCols}`, rects);
  }

  for (const centerRows of sampleCounts(Math.floor((pl + EPS) / oB.l)).filter((v) => v > 0)) {
    const centerL = centerRows * oB.l;
    const topBottomSpace = pl - centerL;
    if (topBottomSpace <= 0) continue;
    const sideRows = Math.floor(((topBottomSpace / 2) + EPS) / oA.l);
    if (sideRows <= 0) continue;
    const sideL = sideRows * oA.l;
    const centerY = (pl - centerL) / 2;
    if (centerY < sideL - EPS) continue;

    const rects = [
      ...buildGrid(0, 0, pw, sideL, oA.w, oA.l, "edge", "edge"),
      ...buildGrid(0, centerY, pw, centerL, oB.w, oB.l, "edge", "edge"),
      ...buildGrid(0, pl - sideL, pw, sideL, oA.w, oA.l, "edge", "edge"),
    ];
    pushBase(`triple-h-${centerRows}-${sideRows}`, rects);
  }

  const all: Pattern[] = [];
  const seenAll = new Set<string>();

  for (const p of base) {
    const variants: Array<{ key: string; rects: Rect[] }> = [
      { key: "normal", rects: transformRects(p.rects, pw, pl, "normal") },
      { key: "mx", rects: transformRects(p.rects, pw, pl, "mx") },
      { key: "my", rects: transformRects(p.rects, pw, pl, "my") },
      { key: "r180", rects: transformRects(p.rects, pw, pl, "r180") },
    ];

    for (const v of variants) {
      const normalized = sortRects(v.rects);
      const hash = hashRects(normalized);
      if (seenAll.has(hash)) continue;
      seenAll.add(hash);
      all.push({ id: `${p.id}:${v.key}`, rects: normalized });
    }
  }

  cache.set(cacheKey, all);
  return all;
}

function selectRects(rects: Rect[], count: number, mode: SelectionMode, pw: number, pl: number): Rect[] {
  if (count >= rects.length) return sortRects(rects);

  const cx = pw / 2;
  const cy = pl / 2;

  const scored = rects.map((r) => {
    const rx = r.x + r.w / 2;
    const ry = r.y + r.l / 2;
    const centerDist = Math.hypot(rx - cx, ry - cy);
    const wallDist = distanceToNearestWall(r, pw, pl);
    const cornerDist = distanceToNearestCorner(r, pw, pl);
    const axisDist = Math.min(Math.abs(rx - cx), Math.abs(ry - cy));

    let score = 0;
    if (mode === "center") {
      score = centerDist + (touchesWall(r, pw, pl) ? Math.min(pw, pl) * 0.1 : 0);
    } else if (mode === "pin") {
      score = (axisDist * 1.9) + (centerDist * 0.4) + (touchesWall(r, pw, pl) ? Math.min(pw, pl) * 0.22 : 0);
    } else {
      score = (wallDist * 2.2) + (cornerDist * 0.9);
    }

    return { r, score };
  });

  scored.sort((a, b) => {
    if (Math.abs(a.score - b.score) > EPS) return a.score - b.score;
    if (Math.abs(a.r.y - b.r.y) > EPS) return a.r.y - b.r.y;
    return a.r.x - b.r.x;
  });

  return sortRects(scored.slice(0, count).map((s) => s.r));
}

function orientationOptions(carton: CartonInput, allowUpright: boolean): OrientationOption[] {
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
  for (const o of base) {
    const key = [o.w.toFixed(3), o.l.toFixed(3), o.h.toFixed(3)].join("|");
    if (!unique.has(key)) unique.set(key, o);
  }
  return Array.from(unique.values());
}

function anchorPositions(
  blockedRects: Rect[],
  span: number,
  item: number,
  axis: "x" | "y",
): number[] {
  const vals = new Set<number>();
  vals.add(0);
  vals.add(clampToZero((span - item) / 2));
  vals.add(clampToZero(span - item));

  for (const b of blockedRects) {
    const pos = axis === "x" ? b.x : b.y;
    const size = axis === "x" ? b.w : b.l;
    vals.add(clampToZero(pos));
    vals.add(clampToZero(pos + size));
    vals.add(clampToZero(pos - item));
    vals.add(clampToZero(pos + (size - item) / 2));
  }

  return Array.from(vals)
    .filter((v) => v >= -EPS && v + item <= span + EPS)
    .map((v) => Math.max(0, Math.min(span - item, v)))
    .sort((a, b) => a - b);
}

function noCollision(rect: Rect, blockedRects: Rect[]): boolean {
  return blockedRects.every((b) => overlapArea(rect, b) <= EPS);
}

function isRectSetPlacementSafe(
  rects: Rect[],
  blockedRects: Rect[],
  pw: number,
  pl: number,
): boolean {
  const occupied = blockedRects.map((r) => ({ ...r }));
  for (const r of rects) {
    if (r.x < -EPS || r.y < -EPS) return false;
    if (r.x + r.w > pw + EPS || r.y + r.l > pl + EPS) return false;
    if (!noCollision(r, occupied)) return false;
    occupied.push(r);
  }
  return true;
}

function intervalOverlapLength(a1: number, a2: number, b1: number, b2: number): number {
  return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
}

function lateralContactLength(rect: Rect, blockedRects: Rect[]): number {
  let contact = 0;
  for (const b of blockedRects) {
    const yOverlap = intervalOverlapLength(rect.y, rect.y + rect.l, b.y, b.y + b.l);
    const xOverlap = intervalOverlapLength(rect.x, rect.x + rect.w, b.x, b.x + b.w);

    if (isNear(rect.x + rect.w, b.x, 0.25)) contact += yOverlap;
    if (isNear(rect.x, b.x + b.w, 0.25)) contact += yOverlap;
    if (isNear(rect.y + rect.l, b.y, 0.25)) contact += xOverlap;
    if (isNear(rect.y, b.y + b.l, 0.25)) contact += xOverlap;
  }
  return contact;
}

function nearestGapDistance(rect: Rect, blockedRects: Rect[]): number {
  if (blockedRects.length === 0) return 0;
  let minGap = Number.POSITIVE_INFINITY;

  for (const b of blockedRects) {
    const dx = Math.max(
      0,
      Math.max(b.x - (rect.x + rect.w), rect.x - (b.x + b.w)),
    );
    const dy = Math.max(
      0,
      Math.max(b.y - (rect.y + rect.l), rect.y - (b.y + b.l)),
    );
    const gap = Math.hypot(dx, dy);
    minGap = Math.min(minGap, gap);
  }

  return Number.isFinite(minGap) ? minGap : 0;
}

function findGapPlacement(
  pallet: PalletInput,
  rem: CartonInput[],
  state: LayerState,
  remainingWeight: number,
  blockedRects: Rect[],
  zBase: number,
  currentLayerHeight: number,
  allowUpright: boolean,
  preferredDifferentTypeId: string | null,
  usedTypeIds: Set<string>,
  heightCeil: number | null = null,
): GapPlacementCandidate | null {
  let best: GapPlacementCandidate | null = null;
  const supportBounds = boundsOfRects(state.prevPlacements);
  const packingStyle = resolvePackingStyle(pallet);
  const baseLayer = state.prevPlacements.length === 0;

  for (const carton of rem) {
    if (carton.quantity <= 0) continue;
    if (carton.weight <= 0 || remainingWeight + EPS < carton.weight) continue;

    const waitLayers = state.typeWaitById.get(carton.id) ?? 0;
    const options = orientationOptions(carton, canUseUprightNow(carton, allowUpright));

    for (const o of options) {
      if (zBase + o.h > pallet.maxHeight + EPS) continue;
      if (heightCeil !== null && o.h > heightCeil + 0.25) continue;

      const xs = anchorPositions(blockedRects, pallet.width, o.w, "x");
      const ys = anchorPositions(blockedRects, pallet.length, o.l, "y");

      for (const x of xs) {
        for (const y of ys) {
          const rect: Rect = { x, y, w: o.w, l: o.l };
          if (!noCollision(rect, blockedRects)) continue;
          if (supportBounds && !isWithinSupportEnvelope(rect, supportBounds)) continue;

          const support = analyzeSupport(rect, state.prevPlacements);
          const supportOk = state.prevPlacements.length === 0
            || (
              (
                support.ratio >= (o.upright ? 0.5 : 0.38)
                || (support.ratio >= 0.28 && support.touching >= 2)
              )
              && (
                support.centroidSupported
                || support.ratio >= (o.upright ? 0.72 : 0.62)
              )
            );
          if (!supportOk) continue;
          if (state.prevPlacements.length > 0 && !structuralSupportSafe(carton.weight, areaOf(rect), support)) {
            continue;
          }

          if (state.prevPlacements.length > 0) {
            const localPressure = support.touching <= 1
              ? (o.upright ? 1.85 : 2.1)
              : (o.upright ? 1.85 : 2.25);
            const pressure = pressureSafe(carton.weight, support, localPressure);
            if (!pressure.ok) continue;
          }

          const centerX = pallet.width / 2;
          const centerY = pallet.length / 2;
          const rx = rect.x + rect.w / 2;
          const ry = rect.y + rect.l / 2;
          const centerDist = Math.hypot(rx - centerX, ry - centerY)
            / Math.max(Math.hypot(centerX, centerY), EPS);
          const wallDist = distanceToNearestWall(rect, pallet.width, pallet.length)
            / Math.max(Math.min(pallet.width, pallet.length) / 2, EPS);
          const contactLen = lateralContactLength(rect, blockedRects);
          const gapDist = nearestGapDistance(rect, blockedRects);
          const maxPerimeter = Math.max(rect.w + rect.l, EPS);
          const edgeTouch = touchesWall(rect, pallet.width, pallet.length);
          const contactNeed = Math.min(rect.w, rect.l) * 0.3;
          const isolatedWall = edgeTouch && contactLen < contactNeed;
          const deepGap = gapDist > Math.max(rect.w, rect.l) * 0.9;
          const highLayer = state.layerIndex >= 3;
          const tailBatch = carton.quantity <= 4;

          let score = 0;
          score += 320;
          score += Math.min(8, waitLayers) * 90;
          score += support.ratio * 150;
          if (packingStyle === "centerCompact") {
            const centerBoost = baseLayer
              ? (state.centerGapStreak > 0 ? 220 : 175)
              : (highLayer || tailBatch ? 260 : 210);
            const wallPenalty = baseLayer ? 120 : (highLayer ? 150 : 115);
            score += (1 - centerDist) * centerBoost;
            score -= (1 - wallDist) * wallPenalty;
          } else {
            score += state.centerGapStreak > 0 ? (1 - centerDist) * 190 : (1 - wallDist) * 95;
          }
          score += (contactLen / maxPerimeter) * 210;
          score -= gapDist * 0.55;
          score += usedTypeIds.has(carton.id) ? -35 : 55;
          if (o.upright) {
            score += currentLayerHeight > 0 && o.h <= currentLayerHeight + 0.25 ? 60 : -40;
          } else {
            score += 20;
          }
          score -= o.h * (state.layerIndex > 2 ? 1.1 : 0.65);

          if (isolatedWall) {
            score -= 220;
          }
          if (highLayer && isolatedWall) score -= 180;
          if (highLayer && isolatedWall && deepGap) score -= 260;
          if (highLayer || tailBatch) {
            score += (1 - centerDist) * 140;
            score -= (1 - wallDist) * 90;
          }

          if (preferredDifferentTypeId) {
            score += carton.id === preferredDifferentTypeId ? -190 : 95;
          }

          if (currentLayerHeight > 0) {
            if (o.h > currentLayerHeight + 0.25) {
              score -= (o.h - currentLayerHeight) * (state.layerIndex > 1 ? 4.2 : 2.4);
            } else {
              score += 40;
            }
          }

          if (!best || score > best.score) {
            best = {
              carton,
              rect,
              orientation: o,
              score,
            };
          }
        }
      }
    }
  }

  return best;
}

function exhaustiveAxisPositions(span: number, item: number): number[] {
  if (item > span + EPS) return [];

  const max = span - item;
  const step = Math.max(10, Math.min(40, Math.floor(item / 4)));
  const values = new Set<number>([0, clampToZero(max / 2), clampToZero(max)]);

  for (let p = 0; p <= max + EPS; p += step) {
    values.add(clampToZero(Math.min(max, p)));
  }

  return Array.from(values)
    .filter((v) => v >= -EPS && v <= max + EPS)
    .map((v) => Math.max(0, Math.min(max, v)))
    .sort((a, b) => a - b);
}

function findGapPlacementExhaustive(
  pallet: PalletInput,
  rem: CartonInput[],
  state: LayerState,
  remainingWeight: number,
  blockedRects: Rect[],
  zBase: number,
  currentLayerHeight: number,
  allowUpright: boolean,
  preferredDifferentTypeId: string | null,
  usedTypeIds: Set<string>,
  heightCeil: number | null = null,
): GapPlacementCandidate | null {
  let best: GapPlacementCandidate | null = null;
  const supportBounds = boundsOfRects(state.prevPlacements);
  const packingStyle = resolvePackingStyle(pallet);
  const baseLayer = state.prevPlacements.length === 0;

  for (const carton of rem) {
    if (carton.quantity <= 0) continue;
    if (carton.weight <= 0 || remainingWeight + EPS < carton.weight) continue;

    const waitLayers = state.typeWaitById.get(carton.id) ?? 0;
    const options = orientationOptions(carton, canUseUprightNow(carton, allowUpright));

    for (const o of options) {
      if (zBase + o.h > pallet.maxHeight + EPS) continue;
      if (heightCeil !== null && o.h > heightCeil + 0.25) continue;
      const xs = exhaustiveAxisPositions(pallet.width, o.w);
      const ys = exhaustiveAxisPositions(pallet.length, o.l);

      for (const x of xs) {
        for (const y of ys) {
          const rect: Rect = { x, y, w: o.w, l: o.l };
          if (!noCollision(rect, blockedRects)) continue;
          if (supportBounds && !isWithinSupportEnvelope(rect, supportBounds)) continue;

          const support = analyzeSupport(rect, state.prevPlacements);
          const supportOk = state.prevPlacements.length === 0
            || (
              (
                support.ratio >= (o.upright ? 0.5 : 0.36)
                || (support.ratio >= 0.25 && support.touching >= 2)
              )
              && (
                support.centroidSupported
                || support.ratio >= (o.upright ? 0.72 : 0.6)
              )
            );
          if (!supportOk) continue;
          if (state.prevPlacements.length > 0 && !structuralSupportSafe(carton.weight, areaOf(rect), support)) {
            continue;
          }

          if (state.prevPlacements.length > 0) {
            const localPressure = support.touching <= 1
              ? (o.upright ? 1.85 : 2.1)
              : (o.upright ? 1.85 : 2.25);
            const pressure = pressureSafe(carton.weight, support, localPressure);
            if (!pressure.ok) continue;
          }

          const centerX = pallet.width / 2;
          const centerY = pallet.length / 2;
          const rx = rect.x + rect.w / 2;
          const ry = rect.y + rect.l / 2;
          const centerDist = Math.hypot(rx - centerX, ry - centerY)
            / Math.max(Math.hypot(centerX, centerY), EPS);
          const wallDist = distanceToNearestWall(rect, pallet.width, pallet.length)
            / Math.max(Math.min(pallet.width, pallet.length) / 2, EPS);
          const contactLen = lateralContactLength(rect, blockedRects);
          const gapDist = nearestGapDistance(rect, blockedRects);
          const maxPerimeter = Math.max(rect.w + rect.l, EPS);
          const edgeTouch = touchesWall(rect, pallet.width, pallet.length);
          const contactNeed = Math.min(rect.w, rect.l) * 0.3;
          const isolatedWall = edgeTouch && contactLen < contactNeed;
          const deepGap = gapDist > Math.max(rect.w, rect.l) * 0.9;
          const highLayer = state.layerIndex >= 3;
          const tailBatch = carton.quantity <= 4;

          let score = 0;
          score += 300;
          score += Math.min(8, waitLayers) * 90;
          score += support.ratio * 140;
          if (packingStyle === "centerCompact") {
            const centerBoost = baseLayer
              ? (state.centerGapStreak > 0 ? 235 : 185)
              : (highLayer || tailBatch ? 280 : 225);
            const wallPenalty = baseLayer ? 130 : (highLayer ? 165 : 125);
            score += (1 - centerDist) * centerBoost;
            score -= (1 - wallDist) * wallPenalty;
          } else {
            score += state.centerGapStreak > 0 ? (1 - centerDist) * 210 : (1 - wallDist) * 100;
          }
          score += (contactLen / maxPerimeter) * 230;
          score -= gapDist * 0.6;
          score += usedTypeIds.has(carton.id) ? -30 : 55;
          if (o.upright) {
            score += currentLayerHeight > 0 && o.h <= currentLayerHeight + 0.25 ? 65 : -35;
          } else {
            score += 20;
          }
          score -= o.h * (state.layerIndex > 2 ? 1.15 : 0.68);

          if (isolatedWall) {
            score -= 240;
          }
          if (highLayer && isolatedWall) score -= 210;
          if (highLayer && isolatedWall && deepGap) score -= 280;
          if (highLayer || tailBatch) {
            score += (1 - centerDist) * 150;
            score -= (1 - wallDist) * 100;
          }

          if (preferredDifferentTypeId) {
            score += carton.id === preferredDifferentTypeId ? -180 : 95;
          }

          if (currentLayerHeight > 0) {
            if (o.h > currentLayerHeight + 0.25) {
              score -= (o.h - currentLayerHeight) * (state.layerIndex > 1 ? 4.6 : 2.6);
            } else {
              score += 40;
            }
          }

          if (!best || score > best.score) {
            best = {
              carton,
              rect,
              orientation: o,
              score,
            };
          }
        }
      }
    }
  }

  return best;
}

function heightLevelsForGapPlacement(
  pallet: PalletInput,
  rem: CartonInput[],
  zBase: number,
  allowUpright: boolean,
  minHeightExclusive: number,
): number[] {
  const levels = new Set<number>();
  for (const carton of rem) {
    if (carton.quantity <= 0 || carton.weight <= 0) continue;
    for (const o of orientationOptions(carton, canUseUprightNow(carton, allowUpright))) {
      if (o.h <= minHeightExclusive + 0.25) continue;
      if (zBase + o.h > pallet.maxHeight + EPS) continue;
      levels.add(Number(o.h.toFixed(3)));
    }
  }
  return Array.from(levels).sort((a, b) => a - b);
}

function findLowestHeightGapPlacement(
  pallet: PalletInput,
  rem: CartonInput[],
  state: LayerState,
  remainingWeight: number,
  blockedRects: Rect[],
  zBase: number,
  currentLayerHeight: number,
  allowUpright: boolean,
  preferredDifferentTypeId: string | null,
  usedTypeIds: Set<string>,
  minHeightExclusive = Number.NEGATIVE_INFINITY,
): GapPlacementCandidate | null {
  const levels = heightLevelsForGapPlacement(
    pallet,
    rem,
    zBase,
    allowUpright,
    minHeightExclusive,
  );

  for (const h of levels) {
    const cand = findGapPlacementExhaustive(
      pallet,
      rem,
      state,
      remainingWeight,
      blockedRects,
      zBase,
      currentLayerHeight,
      allowUpright,
      preferredDifferentTypeId,
      usedTypeIds,
      h,
    );
    if (cand && cand.orientation.h > minHeightExclusive + 0.25) {
      return cand;
    }
  }

  return null;
}

function mirrorHashes(rects: Rect[], pw: number, pl: number): Set<string> {
  return new Set<string>([
    hashRects(transformRects(rects, pw, pl, "mx")),
    hashRects(transformRects(rects, pw, pl, "my")),
    hashRects(transformRects(rects, pw, pl, "r180")),
  ]);
}

function evaluateCandidate(
  pallet: PalletInput,
  carton: CartonInput,
  rects: Rect[],
  fullCapacity: number,
  mode: SelectionMode,
  state: LayerState,
  profile: EvaluationProfile,
  remainingSameType: number,
  remainingTotalAfterPlacement: number,
  uniformStackMode: boolean,
): Evaluation {
  if (rects.length === 0) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash: "" };

  const isPartial = rects.length < fullCapacity;
  const layoutHash = hashRects(rects);
  const layerBounds = boundsOfRects(rects);
  if (!layerBounds) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
  const supportBounds = boundsOfRects(state.prevPlacements);
  if (supportBounds && !isWithinSupportEnvelope(layerBounds, supportBounds)) {
    return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
  }
  if (hasWrapBlockingEdgeProtrusion(rects, pallet.width, pallet.length)) {
    return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
  }

  const density = carton.weight / Math.max(carton.width * carton.length, EPS);
  const packingStyle = resolvePackingStyle(pallet);
  const center = centerStats(rects, pallet.width, pallet.length);
  const fillRatio = layerFillRatio(rects);
  const componentCount = connectedComponentCount(rects);
  const uniqueX = new Set(rects.map((r) => r.x.toFixed(2))).size;
  const uniqueY = new Set(rects.map((r) => r.y.toFixed(2))).size;
  const lineComplexity = uniqueX + uniqueY;
  const footprintVariants = new Set(rects.map((r) => `${r.w.toFixed(2)}x${r.l.toFixed(2)}`)).size;
  const boundsAreaRatio = areaOf(layerBounds) / Math.max(pallet.width * pallet.length, EPS);
  const insets = insetsFromBounds(layerBounds, pallet.width, pallet.length);
  const hasControlledSetback = insets.min >= PREFERRED_MIN_EDGE_SETBACK_MM
    && insets.max <= MAX_RECOMMENDED_EDGE_SETBACK_MM;
  const nearTail = remainingSameType <= fullCapacity;
  const baseLayer = state.prevPlacements.length === 0;
  const finalBatchAtBase = state.prevPlacements.length === 0
    && remainingTotalAfterPlacement <= 0
    && isPartial;
  const finalBatchFragmentPenalty = finalBatchAtBase ? Math.max(0, componentCount - 1) * 950 : 0;
  const countShrink = state.prevPlacements.length > 0 && rects.length <= state.prevPlacements.length * 0.9;
  const taperAllowed = state.layerIndex >= 2
    && (isPartial || mode !== "edge" || state.centerGapStreak >= 1 || nearTail || countShrink);

  const strict = profile === "strict";
  const rescue = profile === "rescue";
  const minSupport = strict ? 0.58 : (rescue ? 0.34 : 0.46);
  const bridgeSupport = strict ? 0.44 : (rescue ? 0.22 : 0.35);
  const pressureFactor = strict ? 1.45 : (rescue ? 2.25 : 1.75);

  let supportSum = 0;
  let lowSupportCount = 0;
  let pressureMarginSum = 0;
  let crossBondCount = 0;
  let exactAlignedCount = 0;
  let towerPenalty = 0;

  for (const r of rects) {
    const support = analyzeSupport(r, state.prevPlacements);
    const supportOk = state.prevPlacements.length === 0
      || (
        (
          support.ratio >= minSupport
          || (support.ratio >= bridgeSupport && support.touching >= 2)
        )
        && (
          support.centroidSupported
          || support.ratio >= (rescue ? 0.62 : 0.82)
          || (rescue && support.touching >= 2 && support.ratio >= 0.4)
        )
      );

    if (!supportOk) {
      return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
    }

    if (state.prevPlacements.length > 0) {
      if (!structuralSupportSafe(carton.weight, areaOf(r), support)) {
        return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
      }
      const localPressureFactor = support.touching <= 1
        ? Math.min(pressureFactor, rescue ? 2.1 : 2.0)
        : pressureFactor;
      const pressure = pressureSafe(carton.weight, support, localPressureFactor);
      if (!pressure.ok) {
        return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
      }
      pressureMarginSum += pressure.marginScore;

      if (support.maxOverlapRatio >= 0.28 && support.maxOverlapRatio <= 0.82 && support.touching >= 2) {
        crossBondCount++;
      }
    }

    supportSum += support.ratio;
    if (support.ratio < minSupport + 0.08) lowSupportCount++;
  }

  exactAlignedCount = exactAlignmentCount(rects, state.prevPlacements);

  for (const r of rects) {
    const fKey = footprintKey(r);
    const tKey = typedFootprintKey(r, carton.id);
    const nextFoot = (state.streakByFootprint.get(fKey) ?? 0) + 1;
    const nextType = (state.streakByType.get(tKey) ?? 0) + 1;
    towerPenalty += Math.max(0, nextFoot - 2) * 1.2;
    towerPenalty += Math.max(0, nextType - 1) * 1.7;
  }

  const cornerCount = cornerCoverage(rects, pallet.width, pallet.length);
  if (!isPartial) {
    const minCorners = packingStyle === "centerCompact"
      ? 0
      : (taperAllowed || rescue ? 0 : (strict ? 4 : 2));
    if (cornerCount < minCorners) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
  }

  const walls = wallStats(rects, pallet.width, pallet.length);
  const gaps = estimateGapStats(rects, pallet.width, pallet.length);
  const relaxBaseGapLimits = packingStyle === "centerCompact" && baseLayer;
  const wallCoverageWeight = packingStyle === "centerCompact" && baseLayer
    ? (taperAllowed || rescue ? 70 : 110)
    : (taperAllowed || rescue ? 170 : 320);
  const gapEmptyPenalty = packingStyle === "centerCompact" && baseLayer ? 80 : 220;
  const largestGapPenalty = packingStyle === "centerCompact" && baseLayer
    ? (taperAllowed || rescue ? 90 : 130)
    : (taperAllowed || rescue ? 280 : 760);
  if (!isPartial) {
    if (!taperAllowed && !rescue) {
      if (!relaxBaseGapLimits) {
        if (strict && gaps.largestGapRatio > 0.24) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
        if (!strict && gaps.largestGapRatio > 0.35) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
      } else {
        if (strict && gaps.largestGapRatio > 0.7) return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
      }
    }

    if (!relaxBaseGapLimits && !rescue && strict && state.centerGapStreak >= 2 && center.hasCentralGap) {
      return { valid: false, score: Number.NEGATIVE_INFINITY, layoutHash };
    }
  }

  const avgSupport = supportSum / rects.length;
  const shapeCompactness = compactness(rects, pallet.width, pallet.length, mode);

  let score = 0;
  score += rects.length * 1000;
  score += cornerCount * (taperAllowed || rescue ? 45 : 140);
  score += walls.coverage * wallCoverageWeight;
  score += walls.balance * 180;
  score -= walls.segments * 16;
  score -= gaps.emptyRatio * gapEmptyPenalty;
  score -= gaps.largestGapRatio * largestGapPenalty;
  score += avgSupport * 220;
  score -= lowSupportCount * 80;
  score += crossBondCount * 90;
  score -= exactAlignedCount * (uniformStackMode ? 8 : 150);
  score -= towerPenalty * (uniformStackMode ? 0 : 130);
  score += pressureMarginSum * 60;
  score += shapeCompactness * 220;
  score += fillRatio * (packingStyle === "centerCompact" && baseLayer ? 450 : 180);
  score -= Math.max(0, 0.6 - fillRatio) * 380;
  score -= boundsAreaRatio * (packingStyle === "centerCompact" && baseLayer ? 520 : 110);
  if (isPartial) {
    score -= Math.max(0, componentCount - 1) * (state.prevPlacements.length === 0 ? 220 : 90);
  }
  score -= finalBatchFragmentPenalty;
  score += center.occupancy * (state.centerGapStreak > 0 ? 520 : 220);
  score += center.axisCoverage * (state.centerGapStreak > 0 ? 340 : 120);

  if (packingStyle === "centerCompact") {
    score += center.occupancy * (baseLayer ? 190 : 150);
    score += center.axisCoverage * (baseLayer ? 130 : 85);
    score += (1 - walls.coverage) * (baseLayer ? 210 : 170);
    if (mode === "center") score += baseLayer ? 280 : 170;
    if (mode === "pin") score -= 140;
    if (mode === "edge") score -= baseLayer ? (isPartial ? 360 : 220) : (isPartial ? 180 : 120);
    if (baseLayer && isPartial) {
      score += Math.min(60, Math.max(0, insets.min)) * 18;
      if (insets.min < 8) score -= (8 - insets.min) * 120;
    }
    if (isPartial && insets.min < 8) score -= (8 - insets.min) * 42;
    score -= Math.max(0, lineComplexity - 4) * 55;
    if (baseLayer) {
      score -= Math.max(0, footprintVariants - 1) * 320;
    }
  } else {
    score += walls.coverage * 140;
    score += walls.balance * 70;
    if (mode === "edge") score += 190;
    if (mode === "center" && isPartial) score -= 90;
    if (baseLayer) {
      score -= Math.max(0, footprintVariants - 1) * 90;
      score += fillRatio * 180;
      score -= boundsAreaRatio * 320;
      score -= Math.max(0, 0.9 - fillRatio) * 1800;
      score -= Math.max(0, boundsAreaRatio - 0.8) * 700;
      if (isPartial && center.hasCentralGap && fillRatio < 0.9) score -= 520;
    }
  }

  if (state.layerIndex >= 1 && hasControlledSetback) {
    score += 140;
  }
  if (state.layerIndex >= 1 && !nearTail && !rescue && insets.max > MAX_RECOMMENDED_EDGE_SETBACK_MM) {
    score -= (insets.max - MAX_RECOMMENDED_EDGE_SETBACK_MM) * 2.1;
  }

  if (center.hasCentralGap) {
    score -= state.centerGapStreak > 0
      ? (320 + state.centerGapStreak * 130)
      : 120;
  } else if (state.centerGapStreak > 0) {
    score += 220;
  }

  if (center.occupancy > state.prevCenterOccupancy + 0.08) score += 140;
  if (state.centerGapStreak > 0 && center.occupancy < state.prevCenterOccupancy - 0.05) score -= 160;

  if (state.prevLayerTypeId === carton.id) {
    if (!uniformStackMode && layoutHash === state.prevHash) score -= 360;
    if (state.prevMirrorHashes.has(layoutHash)) score += uniformStackMode ? 160 : 240;
  }

  if (!isPartial && (taperAllowed || rescue) && mode !== "edge") {
    score += 130;
  }

  if (uniformStackMode && isPartial && !nearTail) {
    score -= 1000;
  }

  if (isPartial) {
    if (mode === "pin") {
      score += state.centerGapStreak > 0 ? 260 : 140;
    } else if (mode === "center") {
      score += nearTail ? 180 : (rescue ? 150 : 120);
    } else {
      score += state.prevWallCoverage < 0.58 ? 120 : (rescue ? 80 : 35);
    }
  }

  if (rescue) {
    score += rects.length * 220;
    if (mode === "pin" && rects.length <= 6) score += 180;
    if (mode === "edge" && state.prevWallCoverage < 0.45) score += 110;
  }

  if (state.layerIndex >= 3 && nearTail && remainingTotalAfterPlacement <= 18) {
    score -= gaps.largestGapRatio * 220;
    if (center.hasCentralGap) score -= 80;
    score += center.occupancy * 80;
  }

  if (uniformStackMode && !nearTail && mode !== "edge") {
    score -= 260;
  }

  // Shipping preference: keep resulting pallet as low as feasible.
  score -= carton.height * (state.layerIndex > 2 ? 2.6 : 1.1);

  // Slight preference for heavier areal density at the base.
  score += density * 4_000_000;

  return {
    valid: Number.isFinite(score),
    score,
    layoutHash,
  };
}

function tryFindBestCandidate(
  pallet: PalletInput,
  rem: CartonInput[],
  state: LayerState,
  remainingWeight: number,
  patternCache: Map<string, Pattern[]>,
  profile: EvaluationProfile,
  zBase: number,
  blockedRects: Rect[] = [],
  preferredDifferentTypeId: string | null = null,
  heightCeil: number | null = null,
  enforceCriticalFirst = true,
  allowCrossStyleFallback = true,
): BestCandidate | null {
  let best: BestCandidate | null = null;
  const uniformStackMode = isUniformActiveCartons(rem, pallet, zBase, heightCeil);
  const packingStyle = resolvePackingStyle(pallet);
  const preferCenterMode = packingStyle === "centerCompact";
  const activeTypeIds = new Set(
    rem
      .filter((c) =>
        c.quantity > 0
        && c.weight > 0
        && zBase + c.height <= pallet.maxHeight + EPS
        && (heightCeil === null || c.height <= heightCeil + 0.25)
        && c.weight <= remainingWeight + EPS)
      .map((c) => c.id),
  );
  const singleActiveType = activeTypeIds.size <= 1;
  let criticalTypeIds: Set<string> | null = null;
  if (enforceCriticalFirst) {
    const supportTypesAtZ = new Set(state.prevPlacements.map((p) => p.typeId));
    const criticalIds = rem
      .filter((c) =>
        c.quantity > 0
        && c.weight > 0
        && zBase + c.height <= pallet.maxHeight + EPS
        && (heightCeil === null || c.height <= heightCeil + 0.25)
        && c.weight <= remainingWeight + EPS
        && !canBeSafelySupportedByOtherTypes(c, rem, 2.25)
        && (state.prevPlacements.length === 0 || supportTypesAtZ.has(c.id)))
      .map((c) => c.id);
    if (criticalIds.length > 0) {
      criticalTypeIds = new Set<string>(criticalIds);
    }
  }

  for (const carton of rem) {
    if (carton.quantity <= 0) continue;
    if (criticalTypeIds && !criticalTypeIds.has(carton.id)) continue;
    if (zBase + carton.height > pallet.maxHeight + EPS) continue;
    if (heightCeil !== null && carton.height > heightCeil + 0.25) continue;
    if (carton.weight <= 0) continue;

    const hasSameTypeSupportBelow = state.prevPlacements.some((p) => p.typeId === carton.id);
    const supportableByOthers = canBeSafelySupportedByOtherTypes(carton, rem, 2.25);
    const baseCritical = !supportableByOthers && !hasSameTypeSupportBelow;

    const maxByWeight = Math.floor((remainingWeight + EPS) / carton.weight);
    if (maxByWeight <= 0) continue;

    const patterns = getPatternCandidates(
      pallet.width,
      pallet.length,
      carton.width,
      carton.length,
      patternCache,
    );

    for (const pattern of patterns) {
      const availableRects = blockedRects.length === 0
        ? pattern.rects
        : pattern.rects.filter((r) => blockedRects.every((b) => overlapArea(r, b) <= EPS));

      const capacity = availableRects.length;
      if (capacity <= 0) continue;

      const maxCount = Math.min(capacity, carton.quantity, maxByWeight);
      if (maxCount <= 0) continue;

      const nearTailForCarton = carton.quantity <= maxCount;
      const allowShapeDeviation = !uniformStackMode || nearTailForCarton || profile === "rescue";
      const mustKeepFullCountAtBase = profile !== "rescue" && (
        singleActiveType
        || (preferCenterMode && nearTailForCarton)
      );
      const countOptions = new Set<number>([maxCount]);
      if (!mustKeepFullCountAtBase) {
        if (allowShapeDeviation) {
          if (maxCount > 2) countOptions.add(maxCount - 1);
          if (maxCount > 4) countOptions.add(maxCount - 2);
          if (maxCount > 6 && (state.centerGapStreak > 0 || state.layerIndex >= 2)) {
            countOptions.add(Math.max(2, Math.floor(maxCount * 0.85)));
          }
        }
        if (profile === "rescue" && allowShapeDeviation) {
          for (let n = 1; n <= Math.min(8, maxCount); n++) countOptions.add(n);
          if (maxCount > 8) countOptions.add(Math.max(2, Math.floor(maxCount * 0.65)));
        }
      }

      const sortedCounts = Array.from(countOptions)
        .filter((c) => c > 0 && c <= maxCount)
        .sort((a, b) => b - a);

      for (const count of sortedCounts) {
        const hasSpareSlots = count < capacity;
        const likelyTaper = state.layerIndex >= 2
          && (
            state.centerGapStreak > 0
            || hasSpareSlots
            || (state.prevPlacements.length > 0 && count <= state.prevPlacements.length)
            || (carton.quantity - count <= capacity)
          );

        const modeSet = new Set<SelectionMode>([
          preferCenterMode ? "center" : "edge",
        ]);
        if (preferCenterMode && singleActiveType) {
          modeSet.add("edge");
        }
        if ((hasSpareSlots || likelyTaper) && allowShapeDeviation) {
          if (preferCenterMode) {
            if (profile === "rescue") {
              modeSet.add("pin");
            }
            if (nearTailForCarton || state.layerIndex >= 3 || profile === "rescue") {
              modeSet.add("edge");
            }
          } else {
            modeSet.add("center");
            modeSet.add("pin");
          }
        }
        if (profile === "rescue" && allowShapeDeviation) {
          modeSet.add("center");
          modeSet.add("pin");
          modeSet.add("edge");
        }

        for (const mode of modeSet) {
          if (
            mode === "pin"
            && profile !== "rescue"
            && count > Math.max(6, Math.floor(capacity * 0.6))
            && state.centerGapStreak === 0
          ) {
            continue;
          }

          const selectedRaw = selectRects(availableRects, count, mode, pallet.width, pallet.length);
          const canRecenter = preferCenterMode && blockedRects.length === 0;
          const selected = canRecenter
            ? sortRects(recenterRects(selectedRaw, pallet.width, pallet.length))
            : selectedRaw;
          if (selected.length === 0) continue;
          if (!isRectSetPlacementSafe(selected, blockedRects, pallet.width, pallet.length)) continue;

          const remainingSameType = carton.quantity - selected.length;
          const remainingTotalAfterPlacement = rem.reduce((sum, c) => {
            const q = c.id === carton.id ? c.quantity - selected.length : c.quantity;
            return sum + Math.max(0, q);
          }, 0);
          const evaluation = evaluateCandidate(
            pallet,
            carton,
            selected,
            capacity,
            mode,
            state,
            profile,
            remainingSameType,
            remainingTotalAfterPlacement,
            uniformStackMode,
          );
          if (!evaluation.valid) continue;

          let scored = evaluation.score;
          if (singleActiveType && profile !== "rescue") {
            scored += selected.length * 4000;
          }
          const waitLayers = state.typeWaitById.get(carton.id) ?? 0;
          scored += Math.min(8, waitLayers) * 95;
          if (state.prevLayerTypeId === carton.id) scored -= 120;
          if (preferredDifferentTypeId) {
            scored += carton.id === preferredDifferentTypeId ? -260 : 90;
          }

          if (baseCritical) {
            if (state.prevPlacements.length === 0) {
              // If this type cannot sit safely on any other type, force it into low layers.
              scored += 14_000;
            } else if (state.layerIndex <= 2) {
              scored += 4_200;
            }
          }

          if (!best || scored > best.score) {
            best = {
              carton,
              rects: selected,
              score: scored,
              layoutHash: evaluation.layoutHash,
            };
          }
        }
      }
    }
  }

  if (!best && criticalTypeIds && enforceCriticalFirst) {
    return tryFindBestCandidate(
      pallet,
      rem,
      state,
      remainingWeight,
      patternCache,
      profile,
      zBase,
      blockedRects,
      preferredDifferentTypeId,
      heightCeil,
      false,
      allowCrossStyleFallback,
    );
  }

  if (
    allowCrossStyleFallback
    && packingStyle === "centerCompact"
    && singleActiveType
    && profile !== "rescue"
  ) {
    const edgeBest = tryFindBestCandidate(
      { ...pallet, packingStyle: "edgeAligned" },
      rem,
      state,
      remainingWeight,
      patternCache,
      profile,
      zBase,
      blockedRects,
      preferredDifferentTypeId,
      heightCeil,
      enforceCriticalFirst,
      false,
    );
    if (edgeBest && (!best || edgeBest.rects.length > best.rects.length)) {
      const canRecenter = blockedRects.length === 0;
      const recentered = canRecenter
        ? sortRects(recenterRects(edgeBest.rects, pallet.width, pallet.length))
        : edgeBest.rects;
      const safeRects = isRectSetPlacementSafe(recentered, blockedRects, pallet.width, pallet.length)
        ? recentered
        : edgeBest.rects;
      return {
        ...edgeBest,
        rects: safeRects,
      };
    }
  }

  return best;
}

function updateStreakMaps(
  placements: PlacementRect[],
  prevFootprint: Map<string, number>,
  prevType: Map<string, number>,
): { footprint: Map<string, number>; typed: Map<string, number> } {
  const footprint = new Map<string, number>();
  const typed = new Map<string, number>();

  for (const r of placements) {
    const fKey = footprintKey(r);
    const tKey = typedFootprintKey(r, r.typeId);
    footprint.set(fKey, (prevFootprint.get(fKey) ?? 0) + 1);
    typed.set(tKey, (prevType.get(tKey) ?? 0) + 1);
  }

  return { footprint, typed };
}

function sanitizeCarton(c: CartonInput): CartonInput {
  const uprightPolicy = resolveUprightPolicy(c);
  return {
    ...c,
    width: Math.max(1, c.width),
    length: Math.max(1, c.length),
    height: Math.max(1, c.height),
    weight: Math.max(0.01, c.weight),
    quantity: Math.max(0, Math.floor(c.quantity)),
    uprightPolicy,
    allowUpright: uprightPolicy !== "never",
  };
}

function findNextZBase(placed: PackedCarton[], currentZ: number): number | null {
  let next = Number.POSITIVE_INFINITY;
  for (const c of placed) {
    const top = c.z + c.h;
    if (top > currentZ + EPS && top < next) next = top;
  }
  return Number.isFinite(next) ? next : null;
}

function computeTotalPackedHeight(placed: PackedCarton[]): number {
  let maxTop = 0;
  for (const c of placed) {
    maxTop = Math.max(maxTop, c.z + c.h);
  }
  return maxTop;
}

function countUnpackedUnits(unpacked: CartonInput[]): number {
  return unpacked.reduce((sum, c) => sum + Math.max(0, c.quantity), 0);
}

function centerShiftScore(bounds: Rect, pallet: PalletInput): number {
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.l / 2;
  const dx = cx - pallet.width / 2;
  const dy = cy - pallet.length / 2;
  const distNorm = Math.hypot(dx, dy) / Math.max(Math.hypot(pallet.width / 2, pallet.length / 2), EPS);
  const insets = insetsFromBounds(bounds, pallet.width, pallet.length);
  return (1 - distNorm) * 1100 + Math.max(0, insets.min) * 4 - Math.max(0, insets.max) * 0.2;
}

function tryCenterShiftLayer(
  placements: PlacementRect[],
  cartons: PackedCarton[],
  below: PlacementRect[],
  pallet: PalletInput,
): void {
  if (placements.length === 0 || cartons.length !== placements.length) return;
  const bounds = boundsOfRects(placements);
  if (!bounds) return;

  const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
  const maxDx = pallet.width - (bounds.x + bounds.w);
  const minDx = -bounds.x;
  const maxDy = pallet.length - (bounds.y + bounds.l);
  const minDy = -bounds.y;

  const targetDx = (pallet.width - bounds.w) / 2 - bounds.x;
  const targetDy = (pallet.length - bounds.l) / 2 - bounds.y;

  const belowBounds = below.length > 0 ? boundsOfRects(below) : null;
  const xCandidates = new Set<number>([
    0,
    clamp(targetDx, minDx, maxDx),
    clamp(targetDx * 0.5, minDx, maxDx),
    clamp(minDx, minDx, maxDx),
    clamp(maxDx, minDx, maxDx),
  ]);
  const yCandidates = new Set<number>([
    0,
    clamp(targetDy, minDy, maxDy),
    clamp(targetDy * 0.5, minDy, maxDy),
    clamp(minDy, minDy, maxDy),
    clamp(maxDy, minDy, maxDy),
  ]);

  if (belowBounds) {
    const belowTargetDx = (belowBounds.x + belowBounds.w / 2) - (bounds.x + bounds.w / 2);
    const belowTargetDy = (belowBounds.y + belowBounds.l / 2) - (bounds.y + bounds.l / 2);
    xCandidates.add(clamp(belowTargetDx, minDx, maxDx));
    xCandidates.add(clamp((belowBounds.x + belowBounds.w) - (bounds.x + bounds.w), minDx, maxDx));
    xCandidates.add(clamp(belowBounds.x - bounds.x, minDx, maxDx));
    yCandidates.add(clamp(belowTargetDy, minDy, maxDy));
    yCandidates.add(clamp((belowBounds.y + belowBounds.l) - (bounds.y + bounds.l), minDy, maxDy));
    yCandidates.add(clamp(belowBounds.y - bounds.y, minDy, maxDy));
  }

  const validTranslation = (dx: number, dy: number): boolean => {
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i];
      const moved: Rect = {
        x: p.x + dx,
        y: p.y + dy,
        w: p.w,
        l: p.l,
      };
      if (moved.x < -EPS || moved.y < -EPS) return false;
      if (moved.x + moved.w > pallet.width + EPS || moved.y + moved.l > pallet.length + EPS) return false;
      if (below.length === 0) continue;

      const support = analyzeSupport(moved, below);
      const supportOk = (
        support.ratio >= 0.38
        || (support.ratio >= 0.28 && support.touching >= 2)
      ) && (
        support.centroidSupported
        || support.ratio >= 0.62
      );
      if (!supportOk) return false;

      const carton = cartons[i];
      if (!structuralSupportSafe(carton.weight, areaOf(moved), support)) return false;
      const pressure = pressureSafe(carton.weight, support, support.touching <= 1 ? 2.1 : 2.25);
      if (!pressure.ok) return false;
    }
    return true;
  };

  let bestDx = 0;
  let bestDy = 0;
  let bestScore = centerShiftScore(bounds, pallet);

  for (const dxRaw of xCandidates) {
    for (const dyRaw of yCandidates) {
      const dx = Math.abs(dxRaw) < 0.25 ? 0 : dxRaw;
      const dy = Math.abs(dyRaw) < 0.25 ? 0 : dyRaw;
      if (!validTranslation(dx, dy)) continue;
      const movedBounds: Rect = {
        x: bounds.x + dx,
        y: bounds.y + dy,
        w: bounds.w,
        l: bounds.l,
      };
      const score = centerShiftScore(movedBounds, pallet);
      if (score > bestScore + 0.5) {
        bestScore = score;
        bestDx = dx;
        bestDy = dy;
      }
    }
  }

  if (Math.abs(bestDx) < 0.25 && Math.abs(bestDy) < 0.25) return;

  for (const p of placements) {
    p.x += bestDx;
    p.y += bestDy;
  }
  for (const c of cartons) {
    c.x += bestDx;
    c.y += bestDy;
  }
}

function cumulativeStackLoadSafe(cartons: PackedCarton[]): boolean {
  if (cartons.length <= 1) return true;

  const carried = new Map<string, number>();
  const loadAbove = new Map<string, number>();
  const heavierLoadAbove = new Map<string, number>();
  for (const c of cartons) {
    carried.set(c.id, c.weight);
    loadAbove.set(c.id, 0);
    heavierLoadAbove.set(c.id, 0);
  }

  const sortedTopDown = cartons
    .slice()
    .sort((a, b) => (b.z + b.h) - (a.z + a.h));

  for (const top of sortedTopDown) {
    if (top.z <= 0.25) continue;

    const supports: Array<{ below: PackedCarton; overlap: number }> = [];
    let totalOverlap = 0;
    const topRect: Rect = { x: top.x, y: top.y, w: top.w, l: top.l };
    for (const below of cartons) {
      if (below.id === top.id) continue;
      const belowTop = below.z + below.h;
      if (Math.abs(belowTop - top.z) > 0.25) continue;
      const belowRect: Rect = { x: below.x, y: below.y, w: below.w, l: below.l };
      const overlap = overlapArea(topRect, belowRect);
      if (overlap <= EPS) continue;
      supports.push({ below, overlap });
      totalOverlap += overlap;
    }

    if (supports.length === 0 || totalOverlap <= EPS) return false;

    const transfer = carried.get(top.id) ?? top.weight;
    for (const s of supports) {
      const share = transfer * (s.overlap / totalOverlap);
      loadAbove.set(s.below.id, (loadAbove.get(s.below.id) ?? 0) + share);
      carried.set(s.below.id, (carried.get(s.below.id) ?? s.below.weight) + share);
      if (top.weight > s.below.weight * 1.2) {
        heavierLoadAbove.set(s.below.id, (heavierLoadAbove.get(s.below.id) ?? 0) + share);
      }
    }
  }

  for (const c of cartons) {
    const above = loadAbove.get(c.id) ?? 0;
    if (above <= EPS) continue;

    const ratio = above / Math.max(c.weight, EPS);
    const slender = c.h > Math.max(c.w, c.l) * 0.9;
    const maxRatio = slender ? 4.2 : 6.0;
    if (ratio > maxRatio + EPS) return false;

    const heavyAbove = heavierLoadAbove.get(c.id) ?? 0;
    if (heavyAbove > EPS) {
      const heavyRatio = heavyAbove / Math.max(c.weight, EPS);
      const maxHeavyRatio = c.weight <= 6 ? 3.5 : 4.5;
      if (heavyRatio > maxHeavyRatio + EPS) return false;
    }
  }

  return true;
}

function isUniformActiveCartons(
  rem: CartonInput[],
  pallet: PalletInput,
  zBase: number,
  heightCeil: number | null = null,
): boolean {
  const active = rem.filter((c) =>
    c.quantity > 0
    && c.weight > 0
    && zBase + c.height <= pallet.maxHeight + EPS
    && (heightCeil === null || c.height <= heightCeil + 0.25));

  if (active.length <= 1) return active.length === 1;

  const first = active[0];
  const firstMin = Math.min(first.width, first.length);
  const firstMax = Math.max(first.width, first.length);

  return active.every((c) => {
    const cMin = Math.min(c.width, c.length);
    const cMax = Math.max(c.width, c.length);
    return Math.abs(cMin - firstMin) <= 0.25
      && Math.abs(cMax - firstMax) <= 0.25
      && Math.abs(c.height - first.height) <= 0.25
      && Math.abs(c.weight - first.weight) <= 0.01;
  });
}

function areInterchangeableCartons(a: CartonInput, b: CartonInput): boolean {
  const aMin = Math.min(a.width, a.length);
  const aMax = Math.max(a.width, a.length);
  const bMin = Math.min(b.width, b.length);
  const bMax = Math.max(b.width, b.length);

  return Math.abs(aMin - bMin) <= 0.25
    && Math.abs(aMax - bMax) <= 0.25
    && Math.abs(a.height - b.height) <= 0.25
    && Math.abs(a.weight - b.weight) <= 0.01
    && resolveUprightPolicy(a) === resolveUprightPolicy(b);
}

function packInterchangeableTypesAsUnified(
  pallet: PalletInput,
  activeCartons: CartonInput[],
): PackResult | null {
  if (activeCartons.length <= 1) return null;

  const first = activeCartons[0];
  if (!activeCartons.every((c) => areInterchangeableCartons(first, c))) return null;

  const totalQuantity = activeCartons.reduce((sum, c) => sum + Math.max(0, c.quantity), 0);
  if (totalQuantity <= 0) return null;

  const merged: CartonInput = {
    ...first,
    id: "__uniform_merged__",
    quantity: totalQuantity,
  };

  const mergedResult = packPallet(pallet, [merged]);
  const queue = activeCartons.map((c) => ({ carton: { ...c }, remaining: c.quantity }));
  const pickQueueItem = (): { carton: CartonInput; remaining: number } | null =>
    queue.find((q) => q.remaining > 0) ?? null;

  const mappedLayers: Layer[] = mergedResult.layers.map((layer) => {
    const mappedCartons: PackedCarton[] = layer.cartons.map((packed) => {
      const q = pickQueueItem();
      if (!q) {
        return {
          ...packed,
          typeId: first.id,
          title: first.title,
          weight: first.weight,
          color: first.color,
        };
      }
      q.remaining -= 1;
      return {
        ...packed,
        typeId: q.carton.id,
        title: q.carton.title,
        weight: q.carton.weight,
        color: q.carton.color,
      };
    });

    return {
      ...layer,
      cartons: mappedCartons,
    };
  });

  const unpacked = queue
    .filter((q) => q.remaining > 0)
    .map((q) => ({
      ...q.carton,
      quantity: q.remaining,
    }));

  return {
    layers: mappedLayers,
    totalWeight: mergedResult.totalWeight,
    totalHeight: mergedResult.totalHeight,
    unpacked,
  };
}

function packSingleTypeDeterministic(pallet: PalletInput, carton: CartonInput): PackResult | null {
  if (carton.quantity <= 0 || carton.weight <= 0) return null;

  type SingleTypePlan = {
    orientation: OrientationOption;
    patternRects: Rect[];
    capacity: number;
    fitUnits: number;
    layerCount: number;
    totalHeight: number;
    styleScore: number;
  };

  const maxByWeight = Math.floor((pallet.maxWeight + EPS) / carton.weight);
  if (maxByWeight <= 0) {
    return {
      layers: [],
      totalWeight: 0,
      totalHeight: 0,
      unpacked: [{ ...carton }],
    };
  }

  const style = resolvePackingStyle(pallet);
  const allowUpright = resolveUprightPolicy(carton) === "prefer";
  const patternCache = new Map<string, Pattern[]>();
  let best: SingleTypePlan | null = null;

  for (const option of orientationOptions(carton, allowUpright)) {
    if (option.h > pallet.maxHeight + EPS) continue;

    const maxLayersByHeight = Math.floor((pallet.maxHeight + EPS) / option.h);
    if (maxLayersByHeight <= 0) continue;

    const patterns = getPatternCandidates(
      pallet.width,
      pallet.length,
      option.w,
      option.l,
      patternCache,
    );

    for (const pattern of patterns) {
      const rects = sortRects(pattern.rects);
      if (rects.length === 0) continue;
      if (!isWrapFriendlyLayerShape(rects, [], pallet)) continue;

      const capacity = rects.length;
      const fitUnits = Math.min(carton.quantity, maxByWeight, capacity * maxLayersByHeight);
      if (fitUnits <= 0) continue;

      const layerCount = Math.ceil(fitUnits / capacity);
      const totalHeight = layerCount * option.h;
      const walls = wallStats(rects, pallet.width, pallet.length);
      const center = centerStats(rects, pallet.width, pallet.length);
      const gaps = estimateGapStats(rects, pallet.width, pallet.length);
      const fill = layerFillRatio(rects);

      let styleScore = fill * 500 - gaps.largestGapRatio * 220 - gaps.emptyRatio * 120;
      if (style === "centerCompact") {
        styleScore += center.occupancy * 420 + center.axisCoverage * 260 + (1 - walls.coverage) * 120;
      } else {
        styleScore += walls.coverage * 430 + walls.balance * 160 + center.occupancy * 90;
      }

      if (
        !best
        || fitUnits > best.fitUnits
        || (fitUnits === best.fitUnits && totalHeight < best.totalHeight)
        || (
          fitUnits === best.fitUnits
          && Math.abs(totalHeight - best.totalHeight) <= EPS
          && capacity > best.capacity
        )
        || (
          fitUnits === best.fitUnits
          && Math.abs(totalHeight - best.totalHeight) <= EPS
          && capacity === best.capacity
          && styleScore > best.styleScore
        )
      ) {
        best = {
          orientation: option,
          patternRects: rects,
          capacity,
          fitUnits,
          layerCount,
          totalHeight,
          styleScore,
        };
      }
    }
  }

  if (!best) return null;

  const layers: Layer[] = [];
  const placedAll: PackedCarton[] = [];
  let packed = 0;

  for (let layerIndex = 0; layerIndex < best.layerCount; layerIndex++) {
    const remaining = best.fitUnits - packed;
    if (remaining <= 0) break;

    const take = Math.min(best.capacity, remaining);
    const mode: SelectionMode = take === best.capacity
      ? "edge"
      : (style === "centerCompact" ? "center" : "edge");
    const selectedRaw = take === best.capacity
      ? best.patternRects
      : selectRects(best.patternRects, take, mode, pallet.width, pallet.length);
    const selected = style === "centerCompact" && take < best.capacity
      ? sortRects(recenterRects(selectedRaw, pallet.width, pallet.length))
      : sortRects(selectedRaw);

    if (selected.length === 0) break;
    if (!isRectSetPlacementSafe(selected, [], pallet.width, pallet.length)) break;

    const zBase = layerIndex * best.orientation.h;
    const layer: Layer = {
      zBase,
      height: best.orientation.h,
      cartons: [],
    };

    for (const r of selected) {
      const packedCarton: PackedCarton = {
        id: uuidv4(),
        typeId: carton.id,
        title: carton.title,
        x: r.x,
        y: r.y,
        z: zBase,
        w: r.w,
        l: r.l,
        h: best.orientation.h,
        weight: carton.weight,
        color: carton.color,
      };
      layer.cartons.push(packedCarton);
      placedAll.push(packedCarton);
    }

    packed += selected.length;
    layers.push(layer);
  }

  const remainingQty = Math.max(0, carton.quantity - packed);
  return {
    layers,
    totalWeight: packed * carton.weight,
    totalHeight: computeTotalPackedHeight(placedAll),
    unpacked: remainingQty > 0 ? [{ ...carton, quantity: remainingQty }] : [],
  };
}

export function packPallet(pallet: PalletInput, cartons: CartonInput[]): PackResult {
  const safePallet: PalletInput = {
    width: Math.max(1, pallet.width),
    length: Math.max(1, pallet.length),
    maxHeight: Math.max(1, pallet.maxHeight),
    maxWeight: Math.max(0, pallet.maxWeight),
    packingStyle: resolvePackingStyle(pallet),
  };

  const rem = cartons.map((c) => sanitizeCarton({ ...c }));
  rem.sort((a, b) => {
    const densityA = a.weight / (a.width * a.length);
    const densityB = b.weight / (b.width * b.length);
    if (Math.abs(densityB - densityA) > EPS) return densityB - densityA;
    if (Math.abs(b.weight - a.weight) > EPS) return b.weight - a.weight;
    return (b.width * b.length) - (a.width * a.length);
  });

  const initiallyActive = rem.filter((c) => c.quantity > 0);
  const unifiedEquivalentResult = packInterchangeableTypesAsUnified(safePallet, initiallyActive);
  if (unifiedEquivalentResult) return unifiedEquivalentResult;
  if (initiallyActive.length === 1 && resolveUprightPolicy(initiallyActive[0]) === "prefer") {
    const deterministicSingle = packSingleTypeDeterministic(safePallet, initiallyActive[0]);
    if (deterministicSingle) return deterministicSingle;
  }

  const layers: Layer[] = [];
  const placed: PackedCarton[] = [];
  let totalWeight = 0;
  let zBase = 0;
  let safety = 0;

  const state: LayerState = {
    prevPlacements: [],
    prevLayerTypeId: null,
    prevHash: "",
    prevMirrorHashes: new Set<string>(),
    streakByFootprint: new Map<string, number>(),
    streakByType: new Map<string, number>(),
    typeWaitById: new Map<string, number>(),
    prevWallCoverage: 1,
    prevCenterOccupancy: 1,
    centerGapStreak: 0,
    layerIndex: 0,
  };
  const patternCache = new Map<string, Pattern[]>();

  while (rem.some((c) => c.quantity > 0) && safety < 800) {
    safety++;
    if (zBase > safePallet.maxHeight + EPS) break;

    const remainingWeight = safePallet.maxWeight - totalWeight;
    if (remainingWeight <= EPS) break;

    const supportAtZ: PlacementRect[] = [];
    const blockedAtZ: Rect[] = [];
    for (const p of placed) {
      const top = p.z + p.h;
      if (Math.abs(top - zBase) <= 0.25) {
        supportAtZ.push({
          x: p.x,
          y: p.y,
          w: p.w,
          l: p.l,
          typeId: p.typeId,
          weight: p.weight,
          density: p.weight / Math.max(p.w * p.l, EPS),
          h: p.h,
        });
      }
      if (p.z < zBase - EPS && top > zBase + EPS) {
        blockedAtZ.push({ x: p.x, y: p.y, w: p.w, l: p.l });
      }
    }
    state.prevPlacements = supportAtZ;
    let allowUprightNow = hasAnyPreferredUprightCandidates(rem);

    const bestStrict = tryFindBestCandidate(
      safePallet,
      rem,
      state,
      remainingWeight,
      patternCache,
      "strict",
      zBase,
      blockedAtZ,
    );
    const bestNormal = bestStrict ?? tryFindBestCandidate(
      safePallet,
      rem,
      state,
      remainingWeight,
      patternCache,
      "normal",
      zBase,
      blockedAtZ,
    );
    const best = bestNormal ?? tryFindBestCandidate(
      safePallet,
      rem,
      state,
      remainingWeight,
      patternCache,
      "rescue",
      zBase,
      blockedAtZ,
    );

    const layer: Layer = {
      zBase,
      height: 0,
      cartons: [],
    };
    const layerPlacements: PlacementRect[] = [];
    const blockedRects: Rect[] = blockedAtZ.map((r) => ({ ...r }));
    const usedTypeIds = new Set<string>();

    const applyCandidate = (cand: BestCandidate): boolean => {
      if (cand.rects.length === 0) return false;

      const fitByWeight = Math.floor((safePallet.maxWeight - totalWeight + EPS) / cand.carton.weight);
      const take = Math.min(cand.rects.length, fitByWeight);
      if (take <= 0) return false;

      const picked = cand.rects.slice(0, take);
      if (
        !isRectSetPlacementSafe(
          picked,
          blockedRects,
          safePallet.width,
          safePallet.length,
        )
      ) {
        return false;
      }
      const density = cand.carton.weight / Math.max(cand.carton.width * cand.carton.length, EPS);
      const stagedCartons: PackedCarton[] = picked.map((r) => ({
        id: uuidv4(),
        typeId: cand.carton.id,
        title: cand.carton.title,
        x: r.x,
        y: r.y,
        z: zBase,
        w: r.w,
        l: r.l,
        h: cand.carton.height,
        weight: cand.carton.weight,
        color: cand.carton.color,
      }));
      const prospectiveRects: Rect[] = [
        ...layerPlacements.map((p) => ({ x: p.x, y: p.y, w: p.w, l: p.l })),
        ...picked.map((r) => ({ x: r.x, y: r.y, w: r.w, l: r.l })),
      ];
      if (!isWrapFriendlyLayerShape(prospectiveRects, state.prevPlacements, safePallet)) {
        return false;
      }

      const prospectivePacked: PackedCarton[] = [
        ...placed,
        ...layer.cartons,
        ...stagedCartons,
      ];
      if (!cumulativeStackLoadSafe(prospectivePacked)) {
        return false;
      }

      for (let i = 0; i < picked.length; i++) {
        const r = picked[i];
        layer.cartons.push(stagedCartons[i]);
        layerPlacements.push({
          ...r,
          typeId: cand.carton.id,
          weight: cand.carton.weight,
          density,
          h: cand.carton.height,
        });
        blockedRects.push(r);
      }

      cand.carton.quantity -= picked.length;
      totalWeight += picked.length * cand.carton.weight;
      layer.height = Math.max(layer.height, cand.carton.height);
      usedTypeIds.add(cand.carton.id);
      return true;
    };

    const applySinglePlacement = (cand: GapPlacementCandidate): boolean => {
      if (cand.carton.quantity <= 0) return false;
      if (totalWeight + cand.carton.weight > safePallet.maxWeight + EPS) return false;
      if (zBase + cand.orientation.h > safePallet.maxHeight + EPS) return false;
      if (!noCollision(cand.rect, blockedRects)) return false;
      const prospectiveRects: Rect[] = [
        ...layerPlacements.map((p) => ({ x: p.x, y: p.y, w: p.w, l: p.l })),
        { x: cand.rect.x, y: cand.rect.y, w: cand.rect.w, l: cand.rect.l },
      ];
      if (!isWrapFriendlyLayerShape(prospectiveRects, state.prevPlacements, safePallet)) {
        return false;
      }

      const density = cand.carton.weight / Math.max(cand.orientation.w * cand.orientation.l, EPS);
      const stagedCarton: PackedCarton = {
        id: uuidv4(),
        typeId: cand.carton.id,
        title: cand.carton.title,
        x: cand.rect.x,
        y: cand.rect.y,
        z: zBase,
        w: cand.orientation.w,
        l: cand.orientation.l,
        h: cand.orientation.h,
        weight: cand.carton.weight,
        color: cand.carton.color,
      };
      const prospectivePacked: PackedCarton[] = [
        ...placed,
        ...layer.cartons,
        stagedCarton,
      ];
      if (!cumulativeStackLoadSafe(prospectivePacked)) {
        return false;
      }

      layer.cartons.push(stagedCarton);
      layerPlacements.push({
        ...cand.rect,
        typeId: cand.carton.id,
        weight: cand.carton.weight,
        density,
        h: cand.orientation.h,
      });
      blockedRects.push(cand.rect);

      cand.carton.quantity -= 1;
      totalWeight += cand.carton.weight;
      layer.height = Math.max(layer.height, cand.orientation.h);
      usedTypeIds.add(cand.carton.id);
      return true;
    };

    let seeded = false;
    if (best && best.rects.length > 0) {
      seeded = applyCandidate(best);
    }
    if (!seeded) {
      const seedPreferType = state.prevLayerTypeId;
      const lowestSeed = findLowestHeightGapPlacement(
        safePallet,
        rem,
        state,
        safePallet.maxWeight - totalWeight,
        blockedRects,
        zBase,
        0,
        allowUprightNow,
        seedPreferType,
        usedTypeIds,
      );
      if (lowestSeed) seeded = applySinglePlacement(lowestSeed);
    }
    if (!seeded) {
      const seedPreferType = state.prevLayerTypeId;
      const seedFlat = findGapPlacementExhaustive(
        safePallet,
        rem,
        state,
        safePallet.maxWeight - totalWeight,
        blockedRects,
        zBase,
        0,
        false,
        seedPreferType,
        usedTypeIds,
      );
      if (seedFlat) seeded = applySinglePlacement(seedFlat);

      if (!seeded && allowUprightNow) {
        const seedUpright = findGapPlacementExhaustive(
          safePallet,
          rem,
          state,
          safePallet.maxWeight - totalWeight,
          blockedRects,
          zBase,
          0,
          true,
          seedPreferType,
          usedTypeIds,
        );
        if (seedUpright) seeded = applySinglePlacement(seedUpright);
      }
    }
    if (!seeded) {
      const nextZ = findNextZBase(placed, zBase);
      if (nextZ === null || nextZ > safePallet.maxHeight + EPS) break;
      zBase = nextZ;
      continue;
    }

    let topOffSafety = 0;
    while (topOffSafety < 8) {
      topOffSafety++;
      const remainingWeightNow = safePallet.maxWeight - totalWeight;
      if (remainingWeightNow <= EPS) break;

      const preferDifferentFrom = layer.cartons[0]?.typeId ?? null;
      const extraNormal = tryFindBestCandidate(
        safePallet,
        rem,
        state,
        remainingWeightNow,
        patternCache,
        "normal",
        zBase,
        blockedRects,
        preferDifferentFrom,
      );
      const extra = extraNormal ?? tryFindBestCandidate(
        safePallet,
        rem,
        state,
        remainingWeightNow,
        patternCache,
        "rescue",
        zBase,
        blockedRects,
        preferDifferentFrom,
      );

      if (!extra || extra.rects.length === 0) break;
      if (layer.height > 0 && extra.carton.height > layer.height + 0.25) break;
      if (!applyCandidate(extra)) break;
    }

    // Saturate the current z-level before moving up: no "tower first" if something still fits below.
    let gapFillSafety = 0;
    while (gapFillSafety < 180) {
      gapFillSafety++;
      const remainingWeightNow = safePallet.maxWeight - totalWeight;
      if (remainingWeightNow <= EPS) break;
      allowUprightNow = hasAnyNonNeverUprightCandidates(rem);

      const preferDifferentFrom = layer.cartons[0]?.typeId ?? null;
      const flatFill = findGapPlacement(
        safePallet,
        rem,
        state,
        remainingWeightNow,
        blockedRects,
        zBase,
        layer.height,
        false,
        preferDifferentFrom,
        usedTypeIds,
        layer.height,
      );
      if (flatFill && applySinglePlacement(flatFill)) continue;

      const flatFallback = findGapPlacementExhaustive(
        safePallet,
        rem,
        state,
        remainingWeightNow,
        blockedRects,
        zBase,
        layer.height,
        false,
        preferDifferentFrom,
        usedTypeIds,
        layer.height,
      );
      if (flatFallback && applySinglePlacement(flatFallback)) continue;

      const uprightFill = findGapPlacement(
        safePallet,
        rem,
        state,
        remainingWeightNow,
        blockedRects,
        zBase,
        layer.height,
        allowUprightNow,
        preferDifferentFrom,
        usedTypeIds,
        layer.height,
      );
      if (uprightFill && applySinglePlacement(uprightFill)) continue;

      const uprightFallback = findGapPlacementExhaustive(
        safePallet,
        rem,
        state,
        remainingWeightNow,
        blockedRects,
        zBase,
        layer.height,
        allowUprightNow,
        preferDifferentFrom,
        usedTypeIds,
        layer.height,
      );
      if (uprightFallback && applySinglePlacement(uprightFallback)) continue;

      // Only if nothing fits within current layer height, allow layer growth.
      const growLowest = findLowestHeightGapPlacement(
        safePallet,
        rem,
        state,
        remainingWeightNow,
        blockedRects,
        zBase,
        layer.height,
        allowUprightNow,
        preferDifferentFrom,
        usedTypeIds,
        layer.height,
      );
      if (!growLowest || !applySinglePlacement(growLowest)) break;
    }

    if (safePallet.packingStyle === "centerCompact" && layer.cartons.length > 0) {
      tryCenterShiftLayer(layerPlacements, layer.cartons, state.prevPlacements, safePallet);
    }

    if (layer.cartons.length === 0 || layer.height <= 0) break;
    layers.push(layer);
    placed.push(...layer.cartons);

    const layerRects = layerPlacements.map((p) => ({
      x: p.x,
      y: p.y,
      w: p.w,
      l: p.l,
    }));

    const countByType = new Map<string, number>();
    for (const c of layer.cartons) {
      countByType.set(c.typeId, (countByType.get(c.typeId) ?? 0) + 1);
    }
    let dominantTypeId: string | null = null;
    let dominantCount = -1;
    for (const [typeId, cnt] of countByType.entries()) {
      if (cnt > dominantCount) {
        dominantCount = cnt;
        dominantTypeId = typeId;
      }
    }

    state.prevLayerTypeId = dominantTypeId;
    state.prevHash = hashRects(layerRects);
    state.prevMirrorHashes = mirrorHashes(layerRects, safePallet.width, safePallet.length);

    const walls = wallStats(layerRects, safePallet.width, safePallet.length);
    const center = centerStats(layerRects, safePallet.width, safePallet.length);
    state.prevWallCoverage = walls.coverage;
    state.prevCenterOccupancy = center.occupancy;
    const countAsGapLayer = center.hasCentralGap && layerRects.length >= 4;
    state.centerGapStreak = countAsGapLayer ? state.centerGapStreak + 1 : 0;
    state.layerIndex += 1;

    const streaks = updateStreakMaps(
      layerPlacements,
      state.streakByFootprint,
      state.streakByType,
    );
    state.streakByFootprint = streaks.footprint;
    state.streakByType = streaks.typed;

    for (const c of rem) {
      if (c.quantity <= 0) {
        state.typeWaitById.delete(c.id);
        continue;
      }
      const prevWait = state.typeWaitById.get(c.id) ?? 0;
      state.typeWaitById.set(c.id, usedTypeIds.has(c.id) ? 0 : prevWait + 1);
    }

    const nextZ = findNextZBase(placed, zBase);
    if (nextZ === null || nextZ > safePallet.maxHeight + EPS) break;
    zBase = nextZ;
  }

  const result: PackResult = {
    layers,
    totalWeight,
    totalHeight: computeTotalPackedHeight(placed),
    unpacked: rem.filter((c) => c.quantity > 0),
  };

  if (safePallet.packingStyle === "centerCompact") {
    const edgeResult = packPallet(
      { ...safePallet, packingStyle: "edgeAligned" },
      cartons.map((c) => ({ ...c })),
    );

    const centerUnpacked = countUnpackedUnits(result.unpacked);
    const edgeUnpacked = countUnpackedUnits(edgeResult.unpacked);
    // Preserve style identity: center mode should stay center-first.
    // Only accept edge fallback when center is objectively worse for feasibility.
    const edgeBetter = edgeUnpacked < centerUnpacked
      || (edgeUnpacked === centerUnpacked && edgeResult.layers.length < result.layers.length);

    if (edgeBetter) {
      return edgeResult;
    }
  }

  return result;
}
