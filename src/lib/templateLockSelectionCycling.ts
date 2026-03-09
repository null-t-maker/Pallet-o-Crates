import type {
  PalletInput,
} from "./packerTypes";
import {
  comparePlacementBySpatialOrder,
  type ParsedTemplatePlacement,
} from "./templateLockParsing";
import {
  tryBuildTemplateCycle,
  type TemplateCycleBuildResult,
} from "./templateLockSelectionCycleEngine";
import type { TemplateCycleTransform } from "./templateLockSelectionTypes";

export function buildSingleShapeTemplatePlacements(
  parsedPlacements: ParsedTemplatePlacement[],
  shapeKey: string,
  requestedQty: number,
  pallet: PalletInput,
): ParsedTemplatePlacement[] | null {
  const templateSlots = parsedPlacements
    .filter((placement) => placement.matchedShapeKey === shapeKey)
    .sort(comparePlacementBySpatialOrder);
  if (templateSlots.length === 0) return null;

  const cycleHeight = Math.max(1, ...templateSlots.map((slot) => slot.carton.z + slot.carton.h));
  const selectedPlacements: ParsedTemplatePlacement[] = [];
  let runningWeight = 0;
  let selectedCount = 0;

  for (let cycle = 0; selectedCount < requestedQty; cycle++) {
    const remainingItems = requestedQty - selectedCount;
    const maxItemsInCycle = Math.min(templateSlots.length, remainingItems);
    const modeOrder: TemplateCycleTransform[] = cycle === 0
      ? ["identity"]
      : (cycle % 2 === 1
        ? ["rotate180", "mirrorX", "mirrorY", "identity"]
        : ["identity", "mirrorX", "mirrorY", "rotate180"]);

    let bestCycle: TemplateCycleBuildResult | null = null;
    for (const mode of modeOrder) {
      const built = tryBuildTemplateCycle(
        cycle,
        maxItemsInCycle,
        mode,
        templateSlots,
        cycleHeight,
        selectedPlacements,
        runningWeight,
        pallet,
      );
      if (!built) continue;
      if (!bestCycle || built.score > bestCycle.score) {
        bestCycle = built;
      }
    }

    if (!bestCycle) break;
    selectedPlacements.push(...bestCycle.placements);
    runningWeight += bestCycle.weightAdded;
    selectedCount += bestCycle.placements.length;
    if (bestCycle.placements.length < maxItemsInCycle) break;
  }

  return selectedPlacements.length > 0 ? selectedPlacements : null;
}
