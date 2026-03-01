import { v4 as uuidv4 } from "uuid";
import { evaluateCandidate } from "./packerCandidateEvaluation";
import { getPatternCandidates, selectRects } from "./packerPatternLibrary";
import {
  recenterRects,
  sortRects,
  overlapArea,
} from "./packerGeometryCore";
import {
  guidanceTrialNoise,
  resolveUprightPolicy,
} from "./packerPolicy";
import type {
  EvaluationProfile,
  LayerState,
  Pattern,
  Rect,
  SelectionMode,
} from "./packerCoreTypes";
import type {
  CartonInput,
  PackResult,
  PalletInput,
  PalletPackingStyle,
} from "./packerTypes";
import { computeTotalPackedHeight } from "./packerShared";
import {
  resolvePackingStyle,
  resolveSampleGuidance,
} from "./packerConfig";
import type { DeterministicPackDeps } from "./packerDeterministic";
import { type TryFindBestCandidateDeps } from "./packerCandidateSearch";
import {
  createPackPalletSharedDeps,
  type PackPalletSharedDeps,
} from "./packerPackPalletSharedDeps";

export { createPackPalletSharedDeps };
export type { PackPalletSharedDeps };
export { createHeuristicRunnerDeps } from "./packerPackPalletHeuristicDeps";

export function createDeterministicDeps(
  shared: PackPalletSharedDeps,
  packPalletFn: (pallet: PalletInput, cartons: CartonInput[]) => PackResult,
): DeterministicPackDeps {
  return {
    EPS: shared.EPS,
    resolvePackingStyle,
    resolveUprightPolicy,
    orientationOptions: shared.gapPlacementDeps.orientationOptions,
    getPatternCandidates: (
      palletWidth: number,
      palletLength: number,
      cartonWidth: number,
      cartonLength: number,
      patternCache: Map<string, Pattern[]>,
    ) => getPatternCandidates(
      palletWidth,
      palletLength,
      cartonWidth,
      cartonLength,
      patternCache,
      shared.patternGeneratorDeps,
    ),
    sortRects,
    selectRects: (
      rects: Rect[],
      count: number,
      mode: SelectionMode,
      palletWidth: number,
      palletLength: number,
    ) => selectRects(rects, count, mode, palletWidth, palletLength, shared.rectSelectionDeps),
    recenterRects,
    isWrapFriendlyLayerShape: shared.isWrapFriendlyLayerShape,
    wallStats: shared.wallStats,
    centerStats: shared.centerStats,
    estimateGapStats: shared.evaluateDeps.estimateGapStats,
    layerFillRatio: shared.layerFillRatio,
    isRectSetPlacementSafe: shared.rectSetPlacementSafeOnPallet,
    computeTotalPackedHeight,
    createId: uuidv4,
    packPallet: packPalletFn,
  };
}

export function createCandidateSearchDeps(
  shared: PackPalletSharedDeps,
): TryFindBestCandidateDeps {
  return {
    EPS: shared.EPS,
    resolvePackingStyle,
    resolveSampleGuidance,
    getPatternCandidates: (
      palletWidth: number,
      palletLength: number,
      cartonWidth: number,
      cartonLength: number,
      patternCache: Map<string, Pattern[]>,
    ) => getPatternCandidates(
      palletWidth,
      palletLength,
      cartonWidth,
      cartonLength,
      patternCache,
      shared.patternGeneratorDeps,
    ),
    overlapArea,
    selectRects: (
      rects: Rect[],
      count: number,
      mode: SelectionMode,
      palletWidth: number,
      palletLength: number,
    ) => selectRects(rects, count, mode, palletWidth, palletLength, shared.rectSelectionDeps),
    sortRects,
    recenterRects,
    isRectSetPlacementSafe: shared.rectSetPlacementSafeOnPallet,
    evaluateCandidate: (
      palletInput: PalletInput,
      cartonInput: CartonInput,
      rects: Rect[],
      fullCapacity: number,
      mode: SelectionMode,
      state: LayerState,
      profile: EvaluationProfile,
      remainingSameType: number,
      remainingTotalAfterPlacement: number,
      uniformStackMode: boolean,
      packingStyle: PalletPackingStyle,
    ) => evaluateCandidate(
      palletInput,
      cartonInput,
      rects,
      fullCapacity,
      mode,
      state,
      profile,
      remainingSameType,
      remainingTotalAfterPlacement,
      uniformStackMode,
      packingStyle,
      shared.evaluateDeps,
    ),
    centerStats: shared.centerStats,
    wallStats: shared.wallStats,
    guidanceTrialNoise,
  };
}
