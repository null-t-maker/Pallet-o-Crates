import { evaluateCandidate } from "./packerCandidateEvaluation";
import { getPatternCandidates, selectRects } from "./packerPatternLibrary";
import {
  recenterRects,
  sortRects,
  overlapArea,
} from "./packerGeometryCore";
import {
  guidanceTrialNoise,
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
  PalletInput,
  PalletPackingStyle,
} from "./packerTypes";
import {
  resolvePackingStyle,
  resolveSampleGuidance,
} from "./packerConfig";
import { type TryFindBestCandidateDeps } from "./packerCandidateSearch";
import type { PackPalletSharedDeps } from "./packerPackPalletSharedDeps";

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
