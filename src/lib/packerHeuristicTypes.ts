import type { CartonInput, PackedCarton, PalletInput } from "./packerTypes";
import type {
  BestCandidate,
  EvaluationProfile,
  GapPlacementCandidate,
  LayerState,
  Pattern,
  PlacementRect,
  Rect,
} from "./packerCoreTypes";

export interface HeuristicRunnerDeps {
  hasAnyPreferredUprightCandidates: (rem: CartonInput[]) => boolean;
  hasAnyNonNeverUprightCandidates: (rem: CartonInput[]) => boolean;
  tryFindBestCandidate: (
    pallet: PalletInput,
    rem: CartonInput[],
    state: LayerState,
    remainingWeight: number,
    patternCache: Map<string, Pattern[]>,
    profile: EvaluationProfile,
    zBase: number,
    blockedRects: Rect[],
    avoidTypeId?: string | null,
  ) => BestCandidate | null;
  findLowestHeightGapPlacement: (
    pallet: PalletInput,
    rem: CartonInput[],
    state: LayerState,
    remainingWeight: number,
    blockedRects: Rect[],
    zBase: number,
    currentLayerHeight: number,
    allowUpright: boolean,
    preferTypeId: string | null,
    usedTypeIds: Set<string>,
    maxAllowedHeight?: number,
  ) => GapPlacementCandidate | null;
  findGapPlacementExhaustive: (
    pallet: PalletInput,
    rem: CartonInput[],
    state: LayerState,
    remainingWeight: number,
    blockedRects: Rect[],
    zBase: number,
    currentLayerHeight: number,
    allowUpright: boolean,
    preferTypeId: string | null,
    usedTypeIds: Set<string>,
    maxAllowedHeight?: number,
  ) => GapPlacementCandidate | null;
  findGapPlacement: (
    pallet: PalletInput,
    rem: CartonInput[],
    state: LayerState,
    remainingWeight: number,
    blockedRects: Rect[],
    zBase: number,
    currentLayerHeight: number,
    allowUpright: boolean,
    preferTypeId: string | null,
    usedTypeIds: Set<string>,
    maxAllowedHeight?: number,
  ) => GapPlacementCandidate | null;
  isRectSetPlacementSafe: (
    rects: Rect[],
    blockedRects: Rect[],
    palletWidth: number,
    palletLength: number,
  ) => boolean;
  isWrapFriendlyLayerShape: (
    rects: Rect[],
    below: PlacementRect[],
    pallet: PalletInput,
  ) => boolean;
  cumulativeStackLoadSafe: (cartons: PackedCarton[]) => boolean;
  noCollision: (rect: Rect, blockedRects: Rect[]) => boolean;
  tryCenterShiftLayer: (
    placements: PlacementRect[],
    cartons: PackedCarton[],
    below: PlacementRect[],
    pallet: PalletInput,
  ) => void;
  hashRects: (rects: Rect[]) => string;
  mirrorHashes: (rects: Rect[], palletWidth: number, palletLength: number) => Set<string>;
  wallStats: (
    rects: Rect[],
    palletWidth: number,
    palletLength: number,
  ) => { coverage: number; balance: number; segments: number };
  centerStats: (
    rects: Rect[],
    palletWidth: number,
    palletLength: number,
  ) => { occupancy: number; axisCoverage: number; hasCentralGap: boolean };
  updateStreakMaps: (
    placements: PlacementRect[],
    prevFootprint: Map<string, number>,
    prevType: Map<string, number>,
  ) => { footprint: Map<string, number>; typed: Map<string, number> };
  findNextZBase: (placed: PackedCarton[], currentZ: number) => number | null;
}
