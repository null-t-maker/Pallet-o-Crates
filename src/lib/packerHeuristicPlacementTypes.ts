import type { LayerState, PlacementRect, Rect } from "./packerCoreTypes";
import type { Layer, PackedCarton, PalletInput } from "./packerTypes";

export interface HeuristicPlacementContext {
  safePallet: PalletInput;
  state: LayerState;
  placed: PackedCarton[];
  layer: Layer;
  layerPlacements: PlacementRect[];
  blockedRects: Rect[];
  usedTypeIds: Set<string>;
  zBase: number;
  totalWeightRef: { value: number };
  EPS: number;
  createId: () => string;
  isRectSetPlacementSafe: (
    rects: Rect[],
    blockedRects: Rect[],
    palletWidth: number,
    palletLength: number,
  ) => boolean;
  isWrapFriendlyLayerShape: (rects: Rect[], below: PlacementRect[], pallet: PalletInput) => boolean;
  cumulativeStackLoadSafe: (cartons: PackedCarton[]) => boolean;
  noCollision: (rect: Rect, blockedRects: Rect[]) => boolean;
}
