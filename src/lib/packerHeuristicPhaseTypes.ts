import type { CartonInput, Layer, PalletInput } from "./packerTypes";
import type {
  BestCandidate,
  GapPlacementCandidate,
  LayerState,
  Pattern,
  Rect,
} from "./packerCoreTypes";

export interface HeuristicPhaseDeps {
  hasAnyNonNeverUprightCandidates: (rem: CartonInput[]) => boolean;
  tryFindBestCandidate: (
    pallet: PalletInput,
    rem: CartonInput[],
    state: LayerState,
    remainingWeight: number,
    patternCache: Map<string, Pattern[]>,
    profile: "strict" | "normal" | "rescue",
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
}

interface WeightTracker {
  currentWeight: () => number;
}

export interface SeedLayerParams extends WeightTracker {
  safePallet: PalletInput;
  rem: CartonInput[];
  state: LayerState;
  blockedRects: Rect[];
  zBase: number;
  usedTypeIds: Set<string>;
  best: BestCandidate | null;
  allowUprightNow: boolean;
  applyCandidate: (candidate: BestCandidate) => boolean;
  applySinglePlacement: (candidate: GapPlacementCandidate) => boolean;
  deps: HeuristicPhaseDeps;
}

export interface TopOffParams extends WeightTracker {
  safePallet: PalletInput;
  rem: CartonInput[];
  state: LayerState;
  patternCache: Map<string, Pattern[]>;
  blockedRects: Rect[];
  zBase: number;
  layer: Layer;
  applyCandidate: (candidate: BestCandidate) => boolean;
  deps: HeuristicPhaseDeps;
  EPS: number;
}

export interface GapFillParams extends WeightTracker {
  safePallet: PalletInput;
  rem: CartonInput[];
  state: LayerState;
  blockedRects: Rect[];
  zBase: number;
  layer: Layer;
  usedTypeIds: Set<string>;
  applySinglePlacement: (candidate: GapPlacementCandidate) => boolean;
  deps: HeuristicPhaseDeps;
  EPS: number;
}
