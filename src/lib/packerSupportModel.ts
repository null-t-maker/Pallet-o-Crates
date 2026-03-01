import type { PlacementRect, Rect } from "./packerCoreTypes";

export interface SupportInfo {
  ratio: number;
  touching: number;
  centroidSupported: boolean;
  maxOverlapRatio: number;
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
      overlaps,
    };
  }

  const topArea = deps.areaOf(rect);
  let supportedArea = 0;
  let maxOverlapRatio = 0;
  for (const b of below) {
    const overlap = deps.overlapArea(rect, b);
    if (overlap <= deps.EPS) continue;
    overlaps.push({ below: b, area: overlap });
    supportedArea += overlap;
    maxOverlapRatio = Math.max(maxOverlapRatio, overlap / topArea);
  }

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.l / 2;
  const centroidSupported = below.some((b) => deps.coversPoint(b, cx, cy));

  return {
    ratio: Math.min(1, supportedArea / Math.max(topArea, deps.EPS)),
    touching: overlaps.length,
    centroidSupported,
    maxOverlapRatio,
    overlaps,
  };
}

export function hasFullSupport(support: SupportInfo, deps: SupportModelDeps): boolean {
  return support.overlaps.length > 0 && support.ratio + deps.EPS >= deps.MIN_FULL_SUPPORT_RATIO;
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
