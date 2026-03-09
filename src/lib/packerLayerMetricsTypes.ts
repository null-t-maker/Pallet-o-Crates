import type { Rect } from "./packerCoreTypes";

export interface LayerMetricsDeps {
  EPS: number;
  isNear: (a: number, b: number, tol?: number) => boolean;
  coversPoint: (rect: Rect, px: number, py: number) => boolean;
}
