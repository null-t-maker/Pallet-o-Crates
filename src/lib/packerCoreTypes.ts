import type { CartonInput } from "./packerTypes";

export type EvaluationProfile = "strict" | "normal" | "rescue";
export type SelectionMode = "edge" | "center" | "pin";

export interface Rect {
  x: number;
  y: number;
  w: number;
  l: number;
}

export interface PlacementRect extends Rect {
  typeId: string;
  weight: number;
  density: number;
  h: number;
}

export interface Pattern {
  id: string;
  rects: Rect[];
}

export interface LayerState {
  prevPlacements: PlacementRect[];
  prevLayerTypeId: string | null;
  prevHash: string;
  prevMirrorHashes: Set<string>;
  streakByFootprint: Map<string, number>;
  streakByType: Map<string, number>;
  typeWaitById: Map<string, number>;
  prevWallCoverage: number;
  prevCenterOccupancy: number;
  centerGapStreak: number;
  layerIndex: number;
}

export interface WallStats {
  coverage: number;
  balance: number;
  segments: number;
}

export interface CenterStats {
  occupancy: number;
  axisCoverage: number;
  hasCentralGap: boolean;
}

export interface BestCandidate {
  carton: CartonInput;
  rects: Rect[];
  score: number;
  layoutHash: string;
}

export interface OrientationOption {
  w: number;
  l: number;
  h: number;
  upright: boolean;
}

export interface GapPlacementCandidate {
  carton: CartonInput;
  rect: Rect;
  orientation: OrientationOption;
  score: number;
}

