import type { Rect } from "./packerCoreTypes";
import type { PackedCarton } from "./packerTypes";
import type { HeuristicPlacementContext } from "./packerHeuristicPlacementTypes";

interface PlacementCommitEntry {
  rect: Rect;
  carton: PackedCarton;
  typeId: string;
  weight: number;
  density: number;
  height: number;
}

export function computePlacementDensity(
  weight: number,
  width: number,
  length: number,
  eps: number,
): number {
  return weight / Math.max(width * length, eps);
}

export function commitPlacementEntries(
  context: HeuristicPlacementContext,
  entries: PlacementCommitEntry[],
): void {
  for (const entry of entries) {
    context.layer.cartons.push(entry.carton);
    context.layerPlacements.push({
      ...entry.rect,
      typeId: entry.typeId,
      weight: entry.weight,
      density: entry.density,
      h: entry.height,
    });
    context.blockedRects.push(entry.rect);
  }
}

export function finalizePlacementCounters(
  context: HeuristicPlacementContext,
  typeId: string,
  quantity: number,
  unitWeight: number,
  height: number,
): void {
  context.totalWeightRef.value += quantity * unitWeight;
  context.layer.height = Math.max(context.layer.height, height);
  context.usedTypeIds.add(typeId);
}
