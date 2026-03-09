import type { OrientationOption, Rect } from "./packerCoreTypes";
import type { DeterministicPackDeps } from "./packerDeterministicTypes";
import type { PalletPackingStyle, PalletInput } from "./packerTypes";

export interface SingleTypePlan {
  orientation: OrientationOption;
  patternRects: Rect[];
  capacity: number;
  fitUnits: number;
  layerCount: number;
  totalHeight: number;
  styleScore: number;
}

export function computeSingleTypeStyleScore(
  style: PalletPackingStyle,
  rects: Rect[],
  pallet: PalletInput,
  deps: DeterministicPackDeps,
): number {
  const walls = deps.wallStats(rects, pallet.width, pallet.length);
  const center = deps.centerStats(rects, pallet.width, pallet.length);
  const gaps = deps.estimateGapStats(rects, pallet.width, pallet.length);
  const fill = deps.layerFillRatio(rects);

  let styleScore = fill * 500 - gaps.largestGapRatio * 220 - gaps.emptyRatio * 120;
  if (style === "centerCompact") {
    styleScore += center.occupancy * 420 + center.axisCoverage * 260 + (1 - walls.coverage) * 120;
  } else {
    styleScore += walls.coverage * 430 + walls.balance * 160 + center.occupancy * 90;
  }
  return styleScore;
}

export function isBetterSingleTypePlan(
  candidate: SingleTypePlan,
  best: SingleTypePlan | null,
  eps: number,
): boolean {
  if (!best) return true;

  return candidate.fitUnits > best.fitUnits
    || (candidate.fitUnits === best.fitUnits && candidate.totalHeight < best.totalHeight)
    || (
      candidate.fitUnits === best.fitUnits
      && Math.abs(candidate.totalHeight - best.totalHeight) <= eps
      && candidate.capacity > best.capacity
    )
    || (
      candidate.fitUnits === best.fitUnits
      && Math.abs(candidate.totalHeight - best.totalHeight) <= eps
      && candidate.capacity === best.capacity
      && candidate.styleScore > best.styleScore
    );
}
