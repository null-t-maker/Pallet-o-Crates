import type { GapPlacementCandidate } from "./packerCoreTypes";
import type { PackedCarton } from "./packerTypes";
import {
  commitPlacementEntries,
  computePlacementDensity,
  finalizePlacementCounters,
} from "./packerHeuristicPlacementCommit";
import type { HeuristicPlacementContext } from "./packerHeuristicPlacementTypes";
import {
  isPlacementStackLoadSafe,
  isPlacementWrapSafe,
} from "./packerHeuristicPlacementValidation";

export function applyGapPlacementCandidate(
  candidate: GapPlacementCandidate,
  context: HeuristicPlacementContext,
): boolean {
  if (candidate.carton.quantity <= 0) return false;
  if (context.totalWeightRef.value + candidate.carton.weight > context.safePallet.maxWeight + context.EPS) return false;
  if (context.zBase + candidate.orientation.h > context.safePallet.maxHeight + context.EPS) return false;
  if (!context.noCollision(candidate.rect, context.blockedRects)) return false;
  if (!isPlacementWrapSafe(context, [{ x: candidate.rect.x, y: candidate.rect.y, w: candidate.rect.w, l: candidate.rect.l }])) {
    return false;
  }

  const density = computePlacementDensity(
    candidate.carton.weight,
    candidate.orientation.w,
    candidate.orientation.l,
    context.EPS,
  );
  const stagedCarton: PackedCarton = {
    id: context.createId(),
    typeId: candidate.carton.id,
    title: candidate.carton.title,
    x: candidate.rect.x,
    y: candidate.rect.y,
    z: context.zBase,
    w: candidate.orientation.w,
    l: candidate.orientation.l,
    h: candidate.orientation.h,
    weight: candidate.carton.weight,
    color: candidate.carton.color,
  };

  if (!isPlacementStackLoadSafe(context, [stagedCarton])) {
    return false;
  }

  commitPlacementEntries(context, [{
    rect: candidate.rect,
    carton: stagedCarton,
    typeId: candidate.carton.id,
    weight: candidate.carton.weight,
    density,
    height: candidate.orientation.h,
  }]);

  candidate.carton.quantity -= 1;
  finalizePlacementCounters(
    context,
    candidate.carton.id,
    1,
    candidate.carton.weight,
    candidate.orientation.h,
  );
  return true;
}
