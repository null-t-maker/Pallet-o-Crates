import type { NormalizedSampleGuidance } from "./packerConfig";
import type { CartonInput, PalletInput, PalletPackingStyle } from "./packerTypes";
import type {
  OrientationOption,
  PlacementRect,
  Rect,
} from "./packerCoreTypes";

export interface SupportInfo {
  ratio: number;
  touching: number;
  centroidSupported: boolean;
  maxOverlapRatio: number;
  supportCentroidOffsetX: number;
  supportCentroidOffsetY: number;
  balancedSupport: boolean;
  overlaps: Array<{ below: PlacementRect; area: number }>;
}

export interface GapPlacementDeps {
  EPS: number;
  clampToZero: (value: number) => number;
  isNear: (a: number, b: number, tol?: number) => boolean;
  orientationOptions: (carton: CartonInput, allowUpright: boolean) => OrientationOption[];
  canUseUprightNow: (carton: CartonInput, allowUpright: boolean) => boolean;
  resolvePackingStyle: (pallet: PalletInput) => PalletPackingStyle;
  resolveSampleGuidance: (pallet: PalletInput) => NormalizedSampleGuidance | null;
  guidanceTrialNoise: (guidance: NormalizedSampleGuidance | null, token: string) => number;
  boundsOfRects: (rects: Rect[]) => Rect | null;
  noCollision: (rect: Rect, blockedRects: Rect[]) => boolean;
  isWithinSupportEnvelope: (layerRect: Rect, supportBounds: Rect) => boolean;
  analyzeSupport: (rect: Rect, below: PlacementRect[]) => SupportInfo;
  hasFullSupport: (support: SupportInfo) => boolean;
  structuralSupportSafe: (topWeight: number, topArea: number, support: SupportInfo) => boolean;
  areaOf: (rect: Rect) => number;
  pressureSafe: (
    cartonWeight: number,
    support: SupportInfo,
    pressureLimitFactor: number,
  ) => { ok: boolean; marginScore: number };
  distanceToNearestWall: (rect: Rect, palletWidth: number, palletLength: number) => number;
  touchesWall: (rect: Rect, palletWidth: number, palletLength: number) => boolean;
}
