import type { Rect } from "./packerCoreTypes";
import { isWithinSupportEnvelope } from "./packerLayerBounds";
import { transformRects } from "./packerPatternLibrary";
import {
  areaOf,
  boundsOfRects,
  coversPoint,
  distanceToNearestWall,
  hashRects,
  intervalOverlapLength,
  isNear,
  lateralContactLength,
  overlapArea,
  touchesWall,
} from "./packerGeometryCore";

export interface ShapeAnalysisDeps {
  EPS: number;
  boundsOfRects: typeof boundsOfRects;
  touchesWall: typeof touchesWall;
  lateralContactLength: typeof lateralContactLength;
  isWithinSupportEnvelope: typeof isWithinSupportEnvelope;
  distanceToNearestWall: typeof distanceToNearestWall;
  coversPoint: typeof coversPoint;
  overlapArea: typeof overlapArea;
  intervalOverlapLength: typeof intervalOverlapLength;
  isNear: typeof isNear;
}

export interface LayerMetricDeps {
  EPS: number;
  isNear: typeof isNear;
  coversPoint: typeof coversPoint;
}

export interface SupportModelDeps {
  EPS: number;
  MIN_FULL_SUPPORT_RATIO: number;
  overlapArea: typeof overlapArea;
  areaOf: typeof areaOf;
  coversPoint: typeof coversPoint;
}

export function createShapeAnalysisDeps(EPS: number): ShapeAnalysisDeps {
  return {
    EPS,
    boundsOfRects,
    touchesWall,
    lateralContactLength,
    isWithinSupportEnvelope,
    distanceToNearestWall,
    coversPoint,
    overlapArea,
    intervalOverlapLength,
    isNear,
  };
}

export function createLayerMetricDeps(EPS: number): LayerMetricDeps {
  return {
    EPS,
    isNear,
    coversPoint,
  };
}

export function createSupportModelDeps(EPS: number, minFullSupportRatio: number): SupportModelDeps {
  return {
    EPS,
    MIN_FULL_SUPPORT_RATIO: minFullSupportRatio,
    overlapArea,
    areaOf,
    coversPoint,
  };
}

export function buildMirrorHashes(
  rects: Rect[],
  palletWidth: number,
  palletLength: number,
  EPS: number,
): Set<string> {
  return new Set<string>([
    hashRects(transformRects(rects, palletWidth, palletLength, "mx", EPS)),
    hashRects(transformRects(rects, palletWidth, palletLength, "my", EPS)),
    hashRects(transformRects(rects, palletWidth, palletLength, "r180", EPS)),
  ]);
}
