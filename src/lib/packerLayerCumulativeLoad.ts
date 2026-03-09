import type { PackedCarton } from "./packerTypes";
import type { Rect } from "./packerCoreTypes";
import type { CartonSupportShare, CumulativeStackLoadDeps } from "./packerLayerStabilityTypes";

const MAX_SINGLE_SUPPORT_STAIRCASE_OFFSET_RATIO = 0.34;
const MIN_STAIRCASE_DEPTH = 4;

export function cumulativeStackLoadSafe(cartons: PackedCarton[], deps: CumulativeStackLoadDeps): boolean {
  if (cartons.length <= 1) return true;

  const carriedMass = new Map<string, number>();
  const loadAbove = new Map<string, number>();
  const heavierLoadAbove = new Map<string, number>();
  const staircaseOffsetX = new Map<string, number>();
  const staircaseOffsetY = new Map<string, number>();
  const staircaseDepth = new Map<string, number>();
  for (const carton of cartons) {
    carriedMass.set(carton.id, carton.weight);
    loadAbove.set(carton.id, 0);
    heavierLoadAbove.set(carton.id, 0);
    staircaseOffsetX.set(carton.id, 0);
    staircaseOffsetY.set(carton.id, 0);
    staircaseDepth.set(carton.id, 1);
  }

  const sortedTopDown = cartons
    .slice()
    .sort((a, b) => (b.z + b.h) - (a.z + a.h));

  for (const top of sortedTopDown) {
    if (top.z <= 0.25) continue;

    const supports: CartonSupportShare[] = [];
    let totalOverlap = 0;
    const topRect: Rect = { x: top.x, y: top.y, w: top.w, l: top.l };
    for (const below of cartons) {
      if (below.id === top.id) continue;
      const belowTop = below.z + below.h;
      if (Math.abs(belowTop - top.z) > 0.25) continue;
      const belowRect: Rect = { x: below.x, y: below.y, w: below.w, l: below.l };
      const overlap = deps.overlapArea(topRect, belowRect);
      if (overlap <= deps.EPS) continue;
      supports.push({ below, overlap });
      totalOverlap += overlap;
    }

    if (supports.length === 0 || totalOverlap <= deps.EPS) return false;
    if (totalOverlap + deps.EPS < (topRect.w * topRect.l) * deps.MIN_FULL_SUPPORT_RATIO) return false;

    const transfer = carriedMass.get(top.id) ?? top.weight;
    if (supports.length === 1) {
      const onlySupport = supports[0].below;
      const topCenterX = top.x + top.w / 2;
      const topCenterY = top.y + top.l / 2;
      const belowCenterX = onlySupport.x + onlySupport.w / 2;
      const belowCenterY = onlySupport.y + onlySupport.l / 2;
      const nextOffsetX = (staircaseOffsetX.get(top.id) ?? 0) + (topCenterX - belowCenterX);
      const nextOffsetY = (staircaseOffsetY.get(top.id) ?? 0) + (topCenterY - belowCenterY);
      const nextDepth = (staircaseDepth.get(top.id) ?? 1) + 1;
      const offsetRatioX = Math.abs(nextOffsetX) / Math.max(topRect.w, deps.EPS);
      const offsetRatioY = Math.abs(nextOffsetY) / Math.max(topRect.l, deps.EPS);

      if (
        nextDepth >= MIN_STAIRCASE_DEPTH
        && (offsetRatioX > MAX_SINGLE_SUPPORT_STAIRCASE_OFFSET_RATIO + deps.EPS
          || offsetRatioY > MAX_SINGLE_SUPPORT_STAIRCASE_OFFSET_RATIO + deps.EPS)
      ) {
        return false;
      }

      const currentDepth = staircaseDepth.get(onlySupport.id) ?? 1;
      const currentMagnitude = Math.max(
        Math.abs(staircaseOffsetX.get(onlySupport.id) ?? 0),
        Math.abs(staircaseOffsetY.get(onlySupport.id) ?? 0),
      );
      const nextMagnitude = Math.max(Math.abs(nextOffsetX), Math.abs(nextOffsetY));
      if (nextDepth > currentDepth || (nextDepth === currentDepth && nextMagnitude > currentMagnitude + deps.EPS)) {
        staircaseOffsetX.set(onlySupport.id, nextOffsetX);
        staircaseOffsetY.set(onlySupport.id, nextOffsetY);
        staircaseDepth.set(onlySupport.id, nextDepth);
      }
    }

    for (const support of supports) {
      const share = transfer * (support.overlap / totalOverlap);
      loadAbove.set(support.below.id, (loadAbove.get(support.below.id) ?? 0) + share);
      carriedMass.set(support.below.id, (carriedMass.get(support.below.id) ?? support.below.weight) + share);
      if (top.weight > support.below.weight * 1.2) {
        heavierLoadAbove.set(support.below.id, (heavierLoadAbove.get(support.below.id) ?? 0) + share);
      }
    }
  }

  for (const carton of cartons) {
    const above = loadAbove.get(carton.id) ?? 0;
    if (above <= deps.EPS) continue;

    const ratio = above / Math.max(carton.weight, deps.EPS);
    const slender = carton.h > Math.max(carton.w, carton.l) * 0.9;
    const maxRatio = slender ? 8.0 : 14.0;
    if (ratio > maxRatio + deps.EPS) return false;

    const heavyAbove = heavierLoadAbove.get(carton.id) ?? 0;
    if (heavyAbove > deps.EPS) {
      const heavyRatio = heavyAbove / Math.max(carton.weight, deps.EPS);
      const maxHeavyRatio = carton.weight <= 6 ? 3.5 : 4.5;
      if (heavyRatio > maxHeavyRatio + deps.EPS) return false;
    }
  }

  return true;
}
