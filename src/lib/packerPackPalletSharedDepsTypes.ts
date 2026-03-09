import type {
  CumulativeStackLoadDeps,
  TryCenterShiftLayerDeps,
} from "./packerLayerStability";
import type {
  PatternGeneratorDeps,
  RectSelectionDeps,
} from "./packerPatternLibrary";
import type { Rect } from "./packerCoreTypes";
import type { PalletInput } from "./packerTypes";
import type { EvaluateCandidateDeps } from "./packerCandidateEvaluation";
import type { GapPlacementDeps } from "./packerGapTypes";

export const PACKER_EPS = 1e-6;
export const PACKER_PREFERRED_MIN_EDGE_SETBACK_MM = 12;
export const PACKER_MAX_RECOMMENDED_EDGE_SETBACK_MM = 80;
export const PACKER_MIN_FULL_SUPPORT_RATIO = 0.76;

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
