import type {
  PackedCarton,
  PalletInput,
} from "./packerTypes";
import {
  hasFullVerticalSupport,
  overlapArea2D,
  overlapVolume3D,
  type ParsedTemplatePlacement,
} from "./templateLockParsing";
import type { TemplateCycleTransform } from "./templateLockSelectionTypes";

export interface TemplateCycleBuildResult {
  placements: ParsedTemplatePlacement[];
  score: number;
  weightAdded: number;
}

function transformCartonForCycle(
  carton: PackedCarton,
  mode: TemplateCycleTransform,
  pallet: PalletInput,
): PackedCarton {
  let x = carton.x;
  let y = carton.y;
  if (mode === "mirrorX" || mode === "rotate180") {
    x = pallet.width - (carton.x + carton.w);
  }
  if (mode === "mirrorY" || mode === "rotate180") {
    y = pallet.length - (carton.y + carton.l);
  }
  return {
    ...carton,
    x,
    y,
  };
}

function scoreCycleBonding(
  cyclePlacements: ParsedTemplatePlacement[],
  alreadyPlaced: ParsedTemplatePlacement[],
  mode: TemplateCycleTransform,
): number {
  let crossBondCount = 0;
  let exactAlignedCount = 0;
  const allPlaced = [...alreadyPlaced, ...cyclePlacements].map((placement) => placement.carton);

  for (const placement of cyclePlacements) {
    const top = placement.carton;
    if (top.z <= 0.25) continue;
    const topArea = top.w * top.l;
    if (topArea <= 1e-6) continue;

    let touching = 0;
    let maxShare = 0;
    let supportedArea = 0;
    let exactAligned = false;

    for (const below of allPlaced) {
      if (below.id === top.id) continue;
      const belowTop = below.z + below.h;
      if (Math.abs(belowTop - top.z) > 0.25) continue;
      const overlap = overlapArea2D(top, below);
      if (overlap <= 1e-6) continue;
      touching += 1;
      supportedArea += overlap;
      maxShare = Math.max(maxShare, overlap / Math.max(topArea, 1e-6));
      if (
        Math.abs(top.x - below.x) <= 0.25
        && Math.abs(top.y - below.y) <= 0.25
        && Math.abs(top.w - below.w) <= 0.25
        && Math.abs(top.l - below.l) <= 0.25
      ) {
        exactAligned = true;
      }
    }

    const fullySupported = supportedArea + 1e-6 >= topArea * 0.985;
    if (fullySupported && touching >= 2 && maxShare >= 0.26 && maxShare <= 0.84) {
      crossBondCount += 1;
    }
    if (exactAligned) exactAlignedCount += 1;
  }

  return (crossBondCount * 120) - (exactAlignedCount * 90) + (mode === "identity" ? 0 : 8);
}

export function tryBuildTemplateCycle(
  cycle: number,
  maxItemsInCycle: number,
  mode: TemplateCycleTransform,
  templateSlots: ParsedTemplatePlacement[],
  cycleHeight: number,
  alreadyPlaced: ParsedTemplatePlacement[],
  runningWeight: number,
  pallet: PalletInput,
): TemplateCycleBuildResult | null {
  const eps = 1e-6;
  const cyclePlacements: ParsedTemplatePlacement[] = [];
  let localWeight = 0;
  const occupied: PackedCarton[] = alreadyPlaced.map((placement) => placement.carton);

  for (let slotIndex = 0; slotIndex < templateSlots.length; slotIndex++) {
    if (cyclePlacements.length >= maxItemsInCycle) break;
    const source = templateSlots[slotIndex];
    const transformed = transformCartonForCycle(source.carton, mode, pallet);
    const shiftedZ = transformed.z + cycle * cycleHeight;
    const nextCarton: PackedCarton = {
      ...transformed,
      id: (cycle === 0 && mode === "identity")
        ? source.carton.id
        : `${source.carton.id}-cycle-${cycle}-${slotIndex}`,
      z: shiftedZ,
    };

    if (nextCarton.z + nextCarton.h > pallet.maxHeight + eps) return null;
    if (runningWeight + localWeight + nextCarton.weight > pallet.maxWeight + eps) return null;

    const hasOverlap = occupied.some((existing) => overlapVolume3D(existing, nextCarton) > 1e-6);
    if (hasOverlap) return null;

    const supported = hasFullVerticalSupport(nextCarton, [...occupied, nextCarton]);
    if (!supported) return null;

    cyclePlacements.push({
      ...source,
      carton: nextCarton,
    });
    occupied.push(nextCarton);
    localWeight += nextCarton.weight;
  }

  if (cyclePlacements.length === 0) return null;
  return {
    placements: cyclePlacements,
    score: scoreCycleBonding(cyclePlacements, alreadyPlaced, mode),
    weightAdded: localWeight,
  };
}
