import type { PlacementRect, Rect } from "./packerCoreTypes";

const MIN_SINGLE_SUPPORT_RATIO = 0.84;
const MIN_BRIDGED_SUPPORT_RATIO = 0.8;
const MAX_SUPPORT_CENTROID_OFFSET_RATIO = 0.18;

export interface SupportInfo {
  ratio: number;
  touching: number;
  centroidSupported: boolean;
  maxOverlapRatio: number;
  supportCentroidOffsetX: number;
  supportCentroidOffsetY: number;
  balancedSupport: boolean;
  overlaps: Array<{ below: PlacementRect; area: number }>;
}

export interface SupportModelDeps {
  EPS: number;
  MIN_FULL_SUPPORT_RATIO: number;
  overlapArea: (a: Rect, b: Rect) => number;
  areaOf: (rect: Rect) => number;
  coversPoint: (rect: Rect, px: number, py: number) => boolean;
}

export function analyzeSupport(rect: Rect, below: PlacementRect[], deps: SupportModelDeps): SupportInfo {
  const overlaps: Array<{ below: PlacementRect; area: number }> = [];
  if (below.length === 0) {
    return {
      ratio: 1,
      touching: 1,
      centroidSupported: true,
      maxOverlapRatio: 1,
      supportCentroidOffsetX: 0,
      supportCentroidOffsetY: 0,
      balancedSupport: true,
      overlaps,
    };
  }

  const topArea = deps.areaOf(rect);
  let supportedArea = 0;
  let maxOverlapRatio = 0;
  let weightedSupportCenterX = 0;
  let weightedSupportCenterY = 0;
  for (const b of below) {
    const overlap = deps.overlapArea(rect, b);
    if (overlap <= deps.EPS) continue;
    overlaps.push({ below: b, area: overlap });
    supportedArea += overlap;
    maxOverlapRatio = Math.max(maxOverlapRatio, overlap / topArea);

    const x1 = Math.max(rect.x, b.x);
    const y1 = Math.max(rect.y, b.y);
    const x2 = Math.min(rect.x + rect.w, b.x + b.w);
    const y2 = Math.min(rect.y + rect.l, b.y + b.l);
    if (x2 > x1 + deps.EPS && y2 > y1 + deps.EPS) {
      weightedSupportCenterX += overlap * ((x1 + x2) / 2);
      weightedSupportCenterY += overlap * ((y1 + y2) / 2);
    }
  }

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.l / 2;
  const centroidSupported = below.some((b) => deps.coversPoint(b, cx, cy));
  const supportCenterX = supportedArea > deps.EPS ? (weightedSupportCenterX / supportedArea) : cx;
  const supportCenterY = supportedArea > deps.EPS ? (weightedSupportCenterY / supportedArea) : cy;
  const supportCentroidOffsetX = Math.abs(supportCenterX - cx) / Math.max(rect.w, deps.EPS);
  const supportCentroidOffsetY = Math.abs(supportCenterY - cy) / Math.max(rect.l, deps.EPS);
  const balancedSupport = supportCentroidOffsetX <= MAX_SUPPORT_CENTROID_OFFSET_RATIO
    && supportCentroidOffsetY <= MAX_SUPPORT_CENTROID_OFFSET_RATIO;

  return {
    ratio: Math.min(1, supportedArea / Math.max(topArea, deps.EPS)),
    touching: overlaps.length,
    centroidSupported,
    maxOverlapRatio,
    supportCentroidOffsetX,
    supportCentroidOffsetY,
    balancedSupport,
    overlaps,
  };
}

export function hasFullSupport(support: SupportInfo, deps: SupportModelDeps): boolean {
  if (support.overlaps.length === 0) return false;

  const minRatio = support.touching <= 1
    ? MIN_SINGLE_SUPPORT_RATIO
    : deps.MIN_FULL_SUPPORT_RATIO;
  if (support.ratio + deps.EPS < minRatio) return false;
  if (support.centroidSupported) return true;

  return support.touching >= 2
    && support.ratio + deps.EPS >= MIN_BRIDGED_SUPPORT_RATIO
    && support.balancedSupport;
}

export function pressureSafe(
  cartonWeight: number,
  support: SupportInfo,
  pressureLimitFactor: number,
  deps: SupportModelDeps,
): { ok: boolean; marginScore: number } {
  if (support.overlaps.length === 0) return { ok: false, marginScore: 0 };

  const totalOverlap = support.overlaps.reduce((acc, overlap) => acc + overlap.area, 0);
  if (totalOverlap <= deps.EPS) return { ok: false, marginScore: 0 };

  let marginScore = 0;
  for (const overlap of support.overlaps) {
    const sharedWeight = cartonWeight * (overlap.area / totalOverlap);
    const pressure = sharedWeight / Math.max(overlap.area, deps.EPS);
    const ratio = pressure / Math.max(overlap.below.density, deps.EPS);
    if (ratio > pressureLimitFactor) return { ok: false, marginScore: 0 };
    marginScore += Math.max(0, pressureLimitFactor - ratio);
  }

  return {
    ok: true,
    marginScore: marginScore / support.overlaps.length,
  };
}

export function structuralSupportSafe(
  topWeight: number,
  topArea: number,
  support: SupportInfo,
  deps: SupportModelDeps,
): boolean {
  if (support.overlaps.length === 0) return false;

  let dominant = support.overlaps[0];
  for (const overlap of support.overlaps) {
    if (overlap.area > dominant.area) dominant = overlap;
  }

  const totalOverlap = support.overlaps.reduce((sum, overlap) => sum + overlap.area, 0);
  if (totalOverlap <= deps.EPS) return false;

  for (const overlap of support.overlaps) {
    const share = topWeight * (overlap.area / totalOverlap);
    const shareRatio = share / Math.max(overlap.below.weight, deps.EPS);
    const supportShareRatio = overlap.area / Math.max(topArea, deps.EPS);
    const topMuchHeavier = topWeight > overlap.below.weight * 1.35;

    if (topMuchHeavier && shareRatio > 0.95 && (supportShareRatio >= 0.45 || support.touching <= 2)) {
      return false;
    }
  }

  const dominantRatio = dominant.area / Math.max(topArea, deps.EPS);
  const belowArea = deps.areaOf(dominant.below);
  const topDensity = topWeight / Math.max(topArea, deps.EPS);
  const densityRatio = topDensity / Math.max(dominant.below.density, deps.EPS);
  const weightRatio = topWeight / Math.max(dominant.below.weight, deps.EPS);
  if (support.touching <= 1) {
    const belowSmaller = belowArea + deps.EPS < topArea * 0.98;
    const heavyOnLight = weightRatio > 1.25 || densityRatio > 1.15;

    if (belowSmaller && heavyOnLight) {
      if (support.ratio < 0.96) return false;
      if (dominantRatio < 0.88) return false;
    }
  }

  return true;
}
