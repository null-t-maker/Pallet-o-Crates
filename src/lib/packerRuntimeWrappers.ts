import type { PalletInput } from "./packerTypes";
import type {
  CenterStats,
  PlacementRect,
  Rect,
  SelectionMode,
  WallStats,
} from "./packerCoreTypes";
import { transformRects } from "./packerPatternLibrary";
import { isWithinSupportEnvelope } from "./packerLayerBounds";
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
import {
  centerStats as computeCenterStats,
  estimateGapStats as computeEstimateGapStats,
  wallStats as computeWallStats,
} from "./packerLayerMetrics";
import {
  analyzeSupport as computeAnalyzeSupport,
  hasFullSupport as computeHasFullSupport,
  pressureSafe as computePressureSafe,
  structuralSupportSafe as computeStructuralSupportSafe,
  type SupportInfo,
} from "./packerSupportModel";
import {
  compactness as computeCompactness,
  connectedComponentCount as computeConnectedComponentCount,
  cornerCoverage as computeCornerCoverage,
  hasWrapBlockingEdgeProtrusion as computeHasWrapBlockingEdgeProtrusion,
  isWrapFriendlyLayerShape as computeIsWrapFriendlyLayerShape,
} from "./packerShapeAnalysis";

export interface GapStats {
  largestGapRatio: number;
  emptyRatio: number;
}

export interface PackerRuntimeWrappers {
  hasWrapBlockingEdgeProtrusion: (rects: Rect[], palletWidth: number, palletLength: number) => boolean;
  isWrapFriendlyLayerShape: (rects: Rect[], supportRects: Rect[], pallet: PalletInput) => boolean;
  compactness: (rects: Rect[], palletWidth: number, palletLength: number, mode: SelectionMode) => number;
  cornerCoverage: (rects: Rect[], palletWidth: number, palletLength: number) => number;
  wallStats: (rects: Rect[], palletWidth: number, palletLength: number) => WallStats;
  estimateGapStats: (rects: Rect[], palletWidth: number, palletLength: number) => GapStats;
  centerStats: (rects: Rect[], palletWidth: number, palletLength: number) => CenterStats;
  connectedComponentCount: (rects: Rect[]) => number;
  analyzeSupport: (rect: Rect, below: PlacementRect[]) => SupportInfo;
  hasFullSupport: (support: SupportInfo) => boolean;
  pressureSafe: (
    cartonWeight: number,
    support: SupportInfo,
    pressureLimitFactor: number,
  ) => { ok: boolean; marginScore: number };
  structuralSupportSafe: (topWeight: number, topArea: number, support: SupportInfo) => boolean;
  mirrorHashes: (rects: Rect[], palletWidth: number, palletLength: number) => Set<string>;
}

export function buildPackerRuntimeWrappers(
  EPS: number,
  minFullSupportRatio: number,
): PackerRuntimeWrappers {
  const hasWrapBlockingEdgeProtrusion = (rects: Rect[], pw: number, pl: number): boolean => (
    computeHasWrapBlockingEdgeProtrusion(rects, pw, pl, {
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
    })
  );

  const isWrapFriendlyLayerShape = (
    rects: Rect[],
    supportRects: Rect[],
    pallet: PalletInput,
  ): boolean => (
    computeIsWrapFriendlyLayerShape(rects, supportRects, pallet, {
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
    })
  );

  const compactness = (rects: Rect[], pw: number, pl: number, mode: SelectionMode): number => (
    computeCompactness(rects, pw, pl, mode, {
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
    })
  );

  const cornerCoverage = (rects: Rect[], pw: number, pl: number): number => (
    computeCornerCoverage(rects, pw, pl, {
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
    })
  );

  const wallStats = (rects: Rect[], pw: number, pl: number): WallStats => (
    computeWallStats(rects, pw, pl, {
      EPS,
      isNear,
      coversPoint,
    })
  );

  const estimateGapStats = (rects: Rect[], pw: number, pl: number): GapStats => (
    computeEstimateGapStats(rects, pw, pl, {
      EPS,
      isNear,
      coversPoint,
    })
  );

  const centerStats = (rects: Rect[], pw: number, pl: number): CenterStats => (
    computeCenterStats(rects, pw, pl, {
      EPS,
      isNear,
      coversPoint,
    })
  );

  const connectedComponentCount = (rects: Rect[]): number => (
    computeConnectedComponentCount(rects, {
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
    })
  );

  const analyzeSupport = (rect: Rect, below: PlacementRect[]): SupportInfo => (
    computeAnalyzeSupport(rect, below, {
      EPS,
      MIN_FULL_SUPPORT_RATIO: minFullSupportRatio,
      overlapArea,
      areaOf,
      coversPoint,
    })
  );

  const hasFullSupport = (support: SupportInfo): boolean => (
    computeHasFullSupport(support, {
      EPS,
      MIN_FULL_SUPPORT_RATIO: minFullSupportRatio,
      overlapArea,
      areaOf,
      coversPoint,
    })
  );

  const pressureSafe = (
    cartonWeight: number,
    support: SupportInfo,
    pressureLimitFactor: number,
  ): { ok: boolean; marginScore: number } => (
    computePressureSafe(cartonWeight, support, pressureLimitFactor, {
      EPS,
      MIN_FULL_SUPPORT_RATIO: minFullSupportRatio,
      overlapArea,
      areaOf,
      coversPoint,
    })
  );

  const structuralSupportSafe = (
    topWeight: number,
    topArea: number,
    support: SupportInfo,
  ): boolean => (
    computeStructuralSupportSafe(topWeight, topArea, support, {
      EPS,
      MIN_FULL_SUPPORT_RATIO: minFullSupportRatio,
      overlapArea,
      areaOf,
      coversPoint,
    })
  );

  const mirrorHashes = (rects: Rect[], pw: number, pl: number): Set<string> => (
    new Set<string>([
      hashRects(transformRects(rects, pw, pl, "mx", EPS)),
      hashRects(transformRects(rects, pw, pl, "my", EPS)),
      hashRects(transformRects(rects, pw, pl, "r180", EPS)),
    ])
  );

  return {
    hasWrapBlockingEdgeProtrusion,
    isWrapFriendlyLayerShape,
    compactness,
    cornerCoverage,
    wallStats,
    estimateGapStats,
    centerStats,
    connectedComponentCount,
    analyzeSupport,
    hasFullSupport,
    pressureSafe,
    structuralSupportSafe,
    mirrorHashes,
  };
}

