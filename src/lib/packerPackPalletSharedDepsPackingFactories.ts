import {
  insetsFromBounds,
  isWithinSupportEnvelope,
} from "./packerLayerBounds";
import {
  areaOf,
  boundsOfRects,
  clampToZero,
  distanceToNearestWall,
  hashRects,
  isNear,
  touchesWall,
} from "./packerGeometryCore";
import {
  exactAlignmentCount,
  footprintKey,
  typedFootprintKey,
} from "./packerFootprintTracking";
import {
  orientationOptions,
} from "./packerPlacementUtils";
import {
  canUseUprightNow,
  guidanceTrialNoise,
} from "./packerPolicy";
import {
  resolvePackingStyle,
  resolveSampleGuidance,
} from "./packerConfig";
import type { PackerRuntimeWrappers } from "./packerRuntimeWrappers";
import type { PackPalletSharedDeps } from "./packerPackPalletSharedDepsTypes";

interface CreateGapPlacementDepsArgs {
  EPS: number;
  runtime: PackerRuntimeWrappers;
  noCollisionOnPallet: PackPalletSharedDeps["noCollisionOnPallet"];
}

interface CreateEvaluateDepsArgs {
  EPS: number;
  minFullSupportRatio: number;
  preferredMinEdgeSetbackMm: number;
  maxRecommendedEdgeSetbackMm: number;
  runtime: PackerRuntimeWrappers;
  layerFillRatio: PackPalletSharedDeps["layerFillRatio"];
}

export function createGapPlacementDeps({
  EPS,
  runtime,
  noCollisionOnPallet,
}: CreateGapPlacementDepsArgs): PackPalletSharedDeps["gapPlacementDeps"] {
  return {
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
    analyzeSupport: runtime.analyzeSupport,
    hasFullSupport: runtime.hasFullSupport,
    structuralSupportSafe: runtime.structuralSupportSafe,
    areaOf,
    pressureSafe: runtime.pressureSafe,
    distanceToNearestWall,
    touchesWall,
  };
}

export function createEvaluateDeps({
  EPS,
  minFullSupportRatio,
  preferredMinEdgeSetbackMm,
  maxRecommendedEdgeSetbackMm,
  runtime,
  layerFillRatio,
}: CreateEvaluateDepsArgs): PackPalletSharedDeps["evaluateDeps"] {
  return {
    EPS,
    MIN_FULL_SUPPORT_RATIO: minFullSupportRatio,
    PREFERRED_MIN_EDGE_SETBACK_MM: preferredMinEdgeSetbackMm,
    MAX_RECOMMENDED_EDGE_SETBACK_MM: maxRecommendedEdgeSetbackMm,
    hashRects,
    boundsOfRects,
    isWithinSupportEnvelope,
    hasWrapBlockingEdgeProtrusion: runtime.hasWrapBlockingEdgeProtrusion,
    centerStats: runtime.centerStats,
    layerFillRatio,
    connectedComponentCount: runtime.connectedComponentCount,
    areaOf,
    insetsFromBounds,
    analyzeSupport: runtime.analyzeSupport,
    hasFullSupport: runtime.hasFullSupport,
    structuralSupportSafe: runtime.structuralSupportSafe,
    pressureSafe: runtime.pressureSafe,
    exactAlignmentCount,
    footprintKey,
    typedFootprintKey,
    cornerCoverage: runtime.cornerCoverage,
    wallStats: runtime.wallStats,
    estimateGapStats: runtime.estimateGapStats,
    compactness: runtime.compactness,
  };
}
