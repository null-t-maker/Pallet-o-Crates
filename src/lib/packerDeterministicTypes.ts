import type {
  CartonInput,
  CartonUprightPolicy,
  PackedCarton,
  PackResult,
  PalletInput,
  PalletPackingStyle,
} from "./packerTypes";
import type { CenterStats, OrientationOption, Pattern, Rect, SelectionMode, WallStats } from "./packerCoreTypes";

export interface DeterministicPackDeps {
  EPS: number;
  resolvePackingStyle: (pallet: PalletInput) => PalletPackingStyle;
  resolveUprightPolicy: (carton: CartonInput) => CartonUprightPolicy;
  orientationOptions: (carton: CartonInput, allowUpright: boolean) => OrientationOption[];
  getPatternCandidates: (
    palletWidth: number,
    palletLength: number,
    cartonWidth: number,
    cartonLength: number,
    patternCache: Map<string, Pattern[]>,
  ) => Pattern[];
  sortRects: (rects: Rect[]) => Rect[];
  selectRects: (
    rects: Rect[],
    count: number,
    mode: SelectionMode,
    palletWidth: number,
    palletLength: number,
  ) => Rect[];
  recenterRects: (rects: Rect[], palletWidth: number, palletLength: number) => Rect[];
  isWrapFriendlyLayerShape: (
    rects: Rect[],
    supportRects: Rect[],
    pallet: PalletInput,
  ) => boolean;
  wallStats: (rects: Rect[], palletWidth: number, palletLength: number) => WallStats;
  centerStats: (rects: Rect[], palletWidth: number, palletLength: number) => CenterStats;
  estimateGapStats: (rects: Rect[], palletWidth: number, palletLength: number) => { largestGapRatio: number; emptyRatio: number };
  layerFillRatio: (rects: Rect[]) => number;
  isRectSetPlacementSafe: (
    rects: Rect[],
    blockedRects: Rect[],
    palletWidth: number,
    palletLength: number,
  ) => boolean;
  computeTotalPackedHeight: (cartons: PackedCarton[]) => number;
  createId: () => string;
  packPallet: (pallet: PalletInput, cartons: CartonInput[]) => PackResult;
}
