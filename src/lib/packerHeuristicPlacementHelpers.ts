import type { PlacementRect, Rect } from "./packerCoreTypes";
import type { PackedCarton } from "./packerTypes";

export function buildProspectiveRects(
  layerPlacements: PlacementRect[],
  extraRects: Rect[],
): Rect[] {
  return [
    ...layerPlacements.map((placement) => ({
      x: placement.x,
      y: placement.y,
      w: placement.w,
      l: placement.l,
    })),
    ...extraRects,
  ];
}

export function buildProspectivePacked(
  placed: PackedCarton[],
  layerCartons: PackedCarton[],
  staged: PackedCarton[],
): PackedCarton[] {
  return [
    ...placed,
    ...layerCartons,
    ...staged,
  ];
}
