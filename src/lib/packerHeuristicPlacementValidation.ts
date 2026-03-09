import type { Rect } from "./packerCoreTypes";
import type { PackedCarton } from "./packerTypes";
import {
  buildProspectivePacked,
  buildProspectiveRects,
} from "./packerHeuristicPlacementHelpers";
import type { HeuristicPlacementContext } from "./packerHeuristicPlacementTypes";

export function isPlacementWrapSafe(
  context: HeuristicPlacementContext,
  extraRects: Rect[],
): boolean {
  const prospectiveRects = buildProspectiveRects(
    context.layerPlacements,
    extraRects,
  );
  return context.isWrapFriendlyLayerShape(
    prospectiveRects,
    context.state.prevPlacements,
    context.safePallet,
  );
}

export function isPlacementStackLoadSafe(
  context: HeuristicPlacementContext,
  stagedCartons: PackedCarton[],
): boolean {
  const prospectivePacked = buildProspectivePacked(
    context.placed,
    context.layer.cartons,
    stagedCartons,
  );
  return context.cumulativeStackLoadSafe(prospectivePacked);
}
