import { v4 as uuidv4 } from "uuid";
import { getPatternCandidates, selectRects } from "./packerPatternLibrary";
import {
  recenterRects,
  sortRects,
} from "./packerGeometryCore";
import {
  resolveUprightPolicy,
} from "./packerPolicy";
import type {
  Pattern,
  Rect,
  SelectionMode,
} from "./packerCoreTypes";
import type {
  CartonInput,
  PackResult,
  PalletInput,
} from "./packerTypes";
import { computeTotalPackedHeight } from "./packerShared";
import {
  resolvePackingStyle,
} from "./packerConfig";
import type { DeterministicPackDeps } from "./packerDeterministic";
import type { PackPalletSharedDeps } from "./packerPackPalletSharedDeps";

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
