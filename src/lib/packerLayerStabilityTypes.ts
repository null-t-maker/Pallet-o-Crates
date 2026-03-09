import type { PackedCarton } from "./packerTypes";
import type { PlacementRect, Rect } from "./packerCoreTypes";

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

export interface BoundsInsets {
  min: number;
  max: number;
}

export interface TryCenterShiftLayerDeps {
  EPS: number;
  boundsOfRects: (rects: Rect[]) => Rect | null;
  insetsFromBounds: (bounds: Rect, palletWidth: number, palletLength: number) => BoundsInsets;
  analyzeSupport: (rect: Rect, below: PlacementRect[]) => SupportInfo;
  hasFullSupport: (support: SupportInfo) => boolean;
  structuralSupportSafe: (weightKg: number, footprintArea: number, support: SupportInfo) => boolean;
  areaOf: (rect: Rect) => number;
  pressureSafe: (weightKg: number, support: SupportInfo, pressureFactor: number) => { ok: boolean; marginScore: number };
}

export interface CumulativeStackLoadDeps {
  EPS: number;
  MIN_FULL_SUPPORT_RATIO: number;
  overlapArea: (a: Rect, b: Rect) => number;
}

export interface CartonSupportShare {
  below: PackedCarton;
  overlap: number;
}
