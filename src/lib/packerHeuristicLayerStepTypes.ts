import type { CartonInput, Layer, PackedCarton, PalletInput } from "./packerTypes";
import type {
  LayerState,
  Pattern,
  PlacementRect,
  Rect,
} from "./packerCoreTypes";
import type { HeuristicRunnerDeps } from "./packerHeuristicTypes";

export interface RunHeuristicLayerStepArgs {
  safePallet: PalletInput;
  rem: CartonInput[];
  placed: PackedCarton[];
  state: LayerState;
  patternCache: Map<string, Pattern[]>;
  blockedAtZ: Rect[];
  zBase: number;
  totalWeight: number;
  EPS: number;
  deps: HeuristicRunnerDeps;
}

export interface RunHeuristicLayerStepResult {
  seeded: boolean;
  layer: Layer;
  layerPlacements: PlacementRect[];
  usedTypeIds: Set<string>;
  totalWeight: number;
}
