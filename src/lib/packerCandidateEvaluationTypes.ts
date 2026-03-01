import type { CartonInput, PalletInput, PalletPackingStyle } from "./packerTypes";
import type {
  EvaluationProfile,
  LayerState,
  PlacementRect,
  Rect,
  SelectionMode,
} from "./packerCoreTypes";

export interface SupportInfo {
  ratio: number;
  touching: number;
  centroidSupported: boolean;
  maxOverlapRatio: number;
  overlaps: Array<{ below: PlacementRect; area: number }>;
}

interface GapStats {
  largestGapRatio: number;
  emptyRatio: number;
}

interface BoundsInsets {
  min: number;
  max: number;
}

export interface EvaluationResult {
  valid: boolean;
  score: number;
  layoutHash: string;
}

export interface EvaluateCandidateDeps {
  EPS: number;
  MIN_FULL_SUPPORT_RATIO: number;
  PREFERRED_MIN_EDGE_SETBACK_MM: number;
  MAX_RECOMMENDED_EDGE_SETBACK_MM: number;
  hashRects: (rects: Rect[]) => string;
  boundsOfRects: (rects: Rect[]) => Rect | null;
  isWithinSupportEnvelope: (layerBounds: Rect, supportBounds: Rect) => boolean;
  hasWrapBlockingEdgeProtrusion: (rects: Rect[], palletWidth: number, palletLength: number) => boolean;
  centerStats: (rects: Rect[], palletWidth: number, palletLength: number) => { occupancy: number; axisCoverage: number; hasCentralGap: boolean };
  layerFillRatio: (rects: Rect[]) => number;
  connectedComponentCount: (rects: Rect[]) => number;
  areaOf: (rect: Rect) => number;
  insetsFromBounds: (bounds: Rect, palletWidth: number, palletLength: number) => BoundsInsets;
  analyzeSupport: (rect: Rect, below: PlacementRect[]) => SupportInfo;
  hasFullSupport: (support: SupportInfo) => boolean;
  structuralSupportSafe: (weightKg: number, footprintArea: number, support: SupportInfo) => boolean;
  pressureSafe: (weightKg: number, support: SupportInfo, pressureFactor: number) => { ok: boolean; marginScore: number };
  exactAlignmentCount: (rects: Rect[], below: PlacementRect[]) => number;
  footprintKey: (rect: Rect) => string;
  typedFootprintKey: (rect: Rect, typeId: string) => string;
  cornerCoverage: (rects: Rect[], palletWidth: number, palletLength: number) => number;
  wallStats: (rects: Rect[], palletWidth: number, palletLength: number) => { coverage: number; balance: number; segments: number };
  estimateGapStats: (rects: Rect[], palletWidth: number, palletLength: number) => GapStats;
  compactness: (rects: Rect[], palletWidth: number, palletLength: number, mode: SelectionMode) => number;
}

export interface EvaluateCandidateInput {
  pallet: PalletInput;
  carton: CartonInput;
  rects: Rect[];
  fullCapacity: number;
  mode: SelectionMode;
  state: LayerState;
  profile: EvaluationProfile;
  remainingSameType: number;
  remainingTotalAfterPlacement: number;
  uniformStackMode: boolean;
  packingStyle: PalletPackingStyle;
  deps: EvaluateCandidateDeps;
}
