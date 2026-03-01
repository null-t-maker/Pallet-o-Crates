import type { Rect } from "./packerCoreTypes";

export type TransformMode = "normal" | "mx" | "my" | "r180";

export interface PatternGeneratorDeps {
  EPS: number;
  hashRects: (rects: Rect[]) => string;
  sortRects: (rects: Rect[]) => Rect[];
  isNear: (a: number, b: number, tol?: number) => boolean;
}

export interface RectSelectionDeps {
  EPS: number;
  sortRects: (rects: Rect[]) => Rect[];
  touchesWall: (rect: Rect, palletWidth: number, palletLength: number) => boolean;
  distanceToNearestWall: (rect: Rect, palletWidth: number, palletLength: number) => number;
  distanceToNearestCorner: (rect: Rect, palletWidth: number, palletLength: number) => number;
}
