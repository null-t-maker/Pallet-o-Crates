import type {
  CartonInput,
  Layer,
  PackedCarton,
  PalletInput,
} from "./packerTypes";
import type {
  CenterStats,
  LayerState,
  PlacementRect,
  Rect,
  WallStats,
} from "./packerCoreTypes";

export interface HeuristicStateDeps {
  hashRects: (rects: Rect[]) => string;
  mirrorHashes: (rects: Rect[], palletWidth: number, palletLength: number) => Set<string>;
  wallStats: (rects: Rect[], palletWidth: number, palletLength: number) => WallStats;
  centerStats: (rects: Rect[], palletWidth: number, palletLength: number) => CenterStats;
  updateStreakMaps: (
    placements: PlacementRect[],
    prevFootprint: Map<string, number>,
    prevType: Map<string, number>,
  ) => { footprint: Map<string, number>; typed: Map<string, number> };
}

export function createInitialLayerState(): LayerState {
  return {
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
}

export function collectSupportAndBlockedAtZ(
  placed: PackedCarton[],
  zBase: number,
  eps: number,
): { supportAtZ: PlacementRect[]; blockedAtZ: Rect[] } {
  const supportAtZ: PlacementRect[] = [];
  const blockedAtZ: Rect[] = [];

  for (const carton of placed) {
    const top = carton.z + carton.h;
    if (Math.abs(top - zBase) <= 0.25) {
      supportAtZ.push({
        x: carton.x,
        y: carton.y,
        w: carton.w,
        l: carton.l,
        typeId: carton.typeId,
        weight: carton.weight,
        density: carton.weight / Math.max(carton.w * carton.l, eps),
        h: carton.h,
      });
    }
    if (carton.z < zBase - eps && top > zBase + eps) {
      blockedAtZ.push({ x: carton.x, y: carton.y, w: carton.w, l: carton.l });
    }
  }

  return { supportAtZ, blockedAtZ };
}

function dominantTypeIdOfLayer(layer: Layer): string | null {
  const countByType = new Map<string, number>();
  for (const carton of layer.cartons) {
    countByType.set(carton.typeId, (countByType.get(carton.typeId) ?? 0) + 1);
  }

  let dominantTypeId: string | null = null;
  let dominantCount = -1;
  for (const [typeId, count] of countByType.entries()) {
    if (count > dominantCount) {
      dominantCount = count;
      dominantTypeId = typeId;
    }
  }
  return dominantTypeId;
}

export function updateStateAfterCommittedLayer(
  state: LayerState,
  layer: Layer,
  layerPlacements: PlacementRect[],
  safePallet: PalletInput,
  usedTypeIds: Set<string>,
  rem: CartonInput[],
  deps: HeuristicStateDeps,
): void {
  const layerRects = layerPlacements.map((placement) => ({
    x: placement.x,
    y: placement.y,
    w: placement.w,
    l: placement.l,
  }));

  state.prevLayerTypeId = dominantTypeIdOfLayer(layer);
  state.prevHash = deps.hashRects(layerRects);
  state.prevMirrorHashes = deps.mirrorHashes(layerRects, safePallet.width, safePallet.length);

  const walls = deps.wallStats(layerRects, safePallet.width, safePallet.length);
  const center = deps.centerStats(layerRects, safePallet.width, safePallet.length);
  state.prevWallCoverage = walls.coverage;
  state.prevCenterOccupancy = center.occupancy;
  const countAsGapLayer = center.hasCentralGap && layerRects.length >= 4;
  state.centerGapStreak = countAsGapLayer ? state.centerGapStreak + 1 : 0;
  state.layerIndex += 1;

  const streaks = deps.updateStreakMaps(
    layerPlacements,
    state.streakByFootprint,
    state.streakByType,
  );
  state.streakByFootprint = streaks.footprint;
  state.streakByType = streaks.typed;

  for (const carton of rem) {
    if (carton.quantity <= 0) {
      state.typeWaitById.delete(carton.id);
      continue;
    }
    const prevWait = state.typeWaitById.get(carton.id) ?? 0;
    state.typeWaitById.set(carton.id, usedTypeIds.has(carton.id) ? 0 : prevWait + 1);
  }
}
