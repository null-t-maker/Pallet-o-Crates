import {
  layerFillRatio as computeLayerFillRatio,
} from "./packerLayerBounds";
import {
  areaOf,
  boundsOfRects,
  distanceToNearestCorner,
  distanceToNearestWall,
  hashRects,
  isNear,
  overlapArea,
  sortRects,
  touchesWall,
} from "./packerGeometryCore";
import {
  isRectSetPlacementSafe,
  noCollision,
} from "./packerPlacementUtils";
import type { Rect } from "./packerCoreTypes";
import type { PackPalletSharedDeps } from "./packerPackPalletSharedDepsTypes";

export function createNoCollisionOnPallet(
  eps: number,
): PackPalletSharedDeps["noCollisionOnPallet"] {
  return (rect: Rect, blockedRects: Rect[]): boolean => (
    noCollision(rect, blockedRects, overlapArea, eps)
  );
}

export function createRectSetPlacementSafeOnPallet(
  eps: number,
): PackPalletSharedDeps["rectSetPlacementSafeOnPallet"] {
  return (
    rects: Rect[],
    blockedRects: Rect[],
    palletWidth: number,
    palletLength: number,
  ): boolean => (
    isRectSetPlacementSafe(rects, blockedRects, palletWidth, palletLength, overlapArea, eps)
  );
}

export function createLayerFillRatio(): PackPalletSharedDeps["layerFillRatio"] {
  return (rects: Rect[]): number => (
    computeLayerFillRatio(rects, boundsOfRects, areaOf)
  );
}

export function createPatternGeneratorDeps(
  eps: number,
): PackPalletSharedDeps["patternGeneratorDeps"] {
  return {
    EPS: eps,
    hashRects,
    sortRects,
    isNear,
  };
}

export function createRectSelectionDeps(
  eps: number,
): PackPalletSharedDeps["rectSelectionDeps"] {
  return {
    EPS: eps,
    sortRects,
    touchesWall,
    distanceToNearestWall,
    distanceToNearestCorner,
  };
}
