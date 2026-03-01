import type { NormalizedSampleGuidance } from "./packerConfig";
import type { EvaluationResult } from "./packerCandidateEvaluation";
import type { CartonInput, PalletInput, PalletPackingStyle } from "./packerTypes";
import type {
  EvaluationProfile,
  LayerState,
  Pattern,
  Rect,
  SelectionMode,
} from "./packerCoreTypes";

export interface TryFindBestCandidateDeps {
  EPS: number;
  resolvePackingStyle: (pallet: PalletInput) => PalletPackingStyle;
  resolveSampleGuidance: (pallet: PalletInput) => NormalizedSampleGuidance | null;
  getPatternCandidates: (
    palletWidth: number,
    palletLength: number,
    cartonWidth: number,
    cartonLength: number,
    patternCache: Map<string, Pattern[]>,
  ) => Pattern[];
  overlapArea: (a: Rect, b: Rect) => number;
  selectRects: (
    rects: Rect[],
    count: number,
    mode: SelectionMode,
    palletWidth: number,
    palletLength: number,
  ) => Rect[];
  sortRects: (rects: Rect[]) => Rect[];
  recenterRects: (rects: Rect[], palletWidth: number, palletLength: number) => Rect[];
  isRectSetPlacementSafe: (rects: Rect[], blockedRects: Rect[], palletWidth: number, palletLength: number) => boolean;
  evaluateCandidate: (
    pallet: PalletInput,
    carton: CartonInput,
    rects: Rect[],
    fullCapacity: number,
    mode: SelectionMode,
    state: LayerState,
    profile: EvaluationProfile,
    remainingSameType: number,
    remainingTotalAfterPlacement: number,
    uniformStackMode: boolean,
    packingStyle: PalletPackingStyle,
  ) => EvaluationResult;
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
  guidanceTrialNoise: (guidance: NormalizedSampleGuidance | null, token: string) => number;
}
