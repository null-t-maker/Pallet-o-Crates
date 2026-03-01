import {
  type CumulativeStackLoadDeps,
  type TryCenterShiftLayerDeps,
} from "./packerLayerStability";
import {
  type PatternGeneratorDeps,
  type RectSelectionDeps,
} from "./packerPatternLibrary";
import {
  isRectSetPlacementSafe,
  noCollision,
  orientationOptions,
} from "./packerPlacementUtils";
import {
  insetsFromBounds,
  isWithinSupportEnvelope,
  layerFillRatio as computeLayerFillRatio,
} from "./packerLayerBounds";
import {
  areaOf,
  boundsOfRects,
  clampToZero,
  distanceToNearestCorner,
  distanceToNearestWall,
  hashRects,
  isNear,
  overlapArea,
  sortRects,
  touchesWall,
} from "./packerGeometryCore";
import {
  exactAlignmentCount,
  footprintKey,
  typedFootprintKey,
} from "./packerFootprintTracking";
import { buildPackerRuntimeWrappers } from "./packerRuntimeWrappers";
import {
  canUseUprightNow,
  guidanceTrialNoise,
} from "./packerPolicy";
import type { Rect } from "./packerCoreTypes";
import type { PalletInput } from "./packerTypes";
import type { EvaluateCandidateDeps } from "./packerCandidateEvaluation";
import type { GapPlacementDeps } from "./packerGapTypes";
import {
  resolvePackingStyle,
  resolveSampleGuidance,
} from "./packerConfig";

const EPS = 1e-6;
const PREFERRED_MIN_EDGE_SETBACK_MM = 12;
const MAX_RECOMMENDED_EDGE_SETBACK_MM = 80;
const MIN_FULL_SUPPORT_RATIO = 0.985;

const {
  analyzeSupport,
  centerStats,
  compactness,
  connectedComponentCount,
  cornerCoverage,
  estimateGapStats,
  hasFullSupport,
  hasWrapBlockingEdgeProtrusion,
  isWrapFriendlyLayerShape,
  mirrorHashes,
  pressureSafe,
  structuralSupportSafe,
  wallStats,
} = buildPackerRuntimeWrappers(EPS, MIN_FULL_SUPPORT_RATIO);

export interface PackPalletSharedDeps {
  EPS: number;
  stackLoadDeps: CumulativeStackLoadDeps;
  centerShiftDeps: TryCenterShiftLayerDeps;
  noCollisionOnPallet: (rect: Rect, blockedRects: Rect[]) => boolean;
  rectSetPlacementSafeOnPallet: (
    rects: Rect[],
    blockedRects: Rect[],
    palletWidth: number,
    palletLength: number,
  ) => boolean;
  layerFillRatio: (rects: Rect[]) => number;
  gapPlacementDeps: GapPlacementDeps;
  evaluateDeps: EvaluateCandidateDeps;
  patternGeneratorDeps: PatternGeneratorDeps;
  rectSelectionDeps: RectSelectionDeps;
  isWrapFriendlyLayerShape: (
    rects: Rect[],
    supportRects: Rect[],
    pallet: PalletInput,
  ) => boolean;
  mirrorHashes: (rects: Rect[], palletWidth: number, palletLength: number) => Set<string>;
  centerStats: (
    rects: Rect[],
    palletWidth: number,
    palletLength: number,
  ) => { occupancy: number; axisCoverage: number; hasCentralGap: boolean };
  wallStats: (
    rects: Rect[],
    palletWidth: number,
    palletLength: number,
  ) => { coverage: number; balance: number; segments: number };
}

export function createPackPalletSharedDeps(): PackPalletSharedDeps {
  const stackLoadDeps: CumulativeStackLoadDeps = {
    EPS,
    MIN_FULL_SUPPORT_RATIO,
    overlapArea,
  };
  const centerShiftDeps: TryCenterShiftLayerDeps = {
    EPS,
    boundsOfRects,
    insetsFromBounds,
    analyzeSupport,
    hasFullSupport,
    structuralSupportSafe,
    areaOf,
    pressureSafe,
  };
  const noCollisionOnPallet = (rect: Rect, blockedRects: Rect[]): boolean => (
    noCollision(rect, blockedRects, overlapArea, EPS)
  );
  const rectSetPlacementSafeOnPallet = (
    rects: Rect[],
    blockedRects: Rect[],
    palletWidth: number,
    palletLength: number,
  ): boolean => (
    isRectSetPlacementSafe(rects, blockedRects, palletWidth, palletLength, overlapArea, EPS)
  );
  const layerFillRatio = (rects: Rect[]): number => (
    computeLayerFillRatio(rects, boundsOfRects, areaOf)
  );

  const gapPlacementDeps: GapPlacementDeps = {
    EPS,
    clampToZero,
    isNear,
    orientationOptions,
    canUseUprightNow,
    resolvePackingStyle,
    resolveSampleGuidance,
    guidanceTrialNoise,
    boundsOfRects,
    noCollision: noCollisionOnPallet,
    isWithinSupportEnvelope,
    analyzeSupport,
    hasFullSupport,
    structuralSupportSafe,
    areaOf,
    pressureSafe,
    distanceToNearestWall,
    touchesWall,
  };

  const evaluateDeps: EvaluateCandidateDeps = {
    EPS,
    MIN_FULL_SUPPORT_RATIO,
    PREFERRED_MIN_EDGE_SETBACK_MM,
    MAX_RECOMMENDED_EDGE_SETBACK_MM,
    hashRects,
    boundsOfRects,
    isWithinSupportEnvelope,
    hasWrapBlockingEdgeProtrusion,
    centerStats,
    layerFillRatio,
    connectedComponentCount,
    areaOf,
    insetsFromBounds,
    analyzeSupport,
    hasFullSupport,
    structuralSupportSafe,
    pressureSafe,
    exactAlignmentCount,
    footprintKey,
    typedFootprintKey,
    cornerCoverage,
    wallStats,
    estimateGapStats,
    compactness,
  };

  const patternGeneratorDeps: PatternGeneratorDeps = {
    EPS,
    hashRects,
    sortRects,
    isNear,
  };

  const rectSelectionDeps: RectSelectionDeps = {
    EPS,
    sortRects,
    touchesWall,
    distanceToNearestWall,
    distanceToNearestCorner,
  };

  return {
    EPS,
    stackLoadDeps,
    centerShiftDeps,
    noCollisionOnPallet,
    rectSetPlacementSafeOnPallet,
    layerFillRatio,
    gapPlacementDeps,
    evaluateDeps,
    patternGeneratorDeps,
    rectSelectionDeps,
    isWrapFriendlyLayerShape,
    mirrorHashes,
    centerStats,
    wallStats,
  };
}


