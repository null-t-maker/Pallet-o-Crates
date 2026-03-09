import {
  insetsFromBounds,
} from "./packerLayerBounds";
import {
  areaOf,
  boundsOfRects,
  overlapArea,
} from "./packerGeometryCore";
import {
  createEvaluateDeps,
  createGapPlacementDeps,
  createLayerFillRatio,
  createNoCollisionOnPallet,
  createPatternGeneratorDeps,
  createRectSelectionDeps,
  createRectSetPlacementSafeOnPallet,
} from "./packerPackPalletSharedDepsFactories";
import type { PackerRuntimeWrappers } from "./packerRuntimeWrappers";
import type { PackPalletSharedDeps } from "./packerPackPalletSharedDepsTypes";

interface CreateSharedCoreDepsArgs {
  EPS: number;
  minFullSupportRatio: number;
  preferredMinEdgeSetbackMm: number;
  maxRecommendedEdgeSetbackMm: number;
  runtime: PackerRuntimeWrappers;
}

type PackPalletSharedCoreDeps = Pick<
  PackPalletSharedDeps,
  | "stackLoadDeps"
  | "centerShiftDeps"
  | "noCollisionOnPallet"
  | "rectSetPlacementSafeOnPallet"
  | "layerFillRatio"
  | "gapPlacementDeps"
  | "evaluateDeps"
  | "patternGeneratorDeps"
  | "rectSelectionDeps"
>;

export function createPackPalletSharedCoreDeps({
  EPS,
  minFullSupportRatio,
  preferredMinEdgeSetbackMm,
  maxRecommendedEdgeSetbackMm,
  runtime,
}: CreateSharedCoreDepsArgs): PackPalletSharedCoreDeps {
  const stackLoadDeps = {
    EPS,
    MIN_FULL_SUPPORT_RATIO: minFullSupportRatio,
    overlapArea,
  };
  const centerShiftDeps = {
    EPS,
    boundsOfRects,
    insetsFromBounds,
    analyzeSupport: runtime.analyzeSupport,
    hasFullSupport: runtime.hasFullSupport,
    structuralSupportSafe: runtime.structuralSupportSafe,
    areaOf,
    pressureSafe: runtime.pressureSafe,
  };
  const noCollisionOnPallet = createNoCollisionOnPallet(EPS);
  const rectSetPlacementSafeOnPallet = createRectSetPlacementSafeOnPallet(EPS);
  const layerFillRatio = createLayerFillRatio();
  const gapPlacementDeps = createGapPlacementDeps({
    EPS,
    runtime,
    noCollisionOnPallet,
  });
  const evaluateDeps = createEvaluateDeps({
    EPS,
    minFullSupportRatio,
    preferredMinEdgeSetbackMm,
    maxRecommendedEdgeSetbackMm,
    runtime,
    layerFillRatio,
  });
  const patternGeneratorDeps = createPatternGeneratorDeps(EPS);
  const rectSelectionDeps = createRectSelectionDeps(EPS);

  return {
    stackLoadDeps,
    centerShiftDeps,
    noCollisionOnPallet,
    rectSetPlacementSafeOnPallet,
    layerFillRatio,
    gapPlacementDeps,
    evaluateDeps,
    patternGeneratorDeps,
    rectSelectionDeps,
  };
}
