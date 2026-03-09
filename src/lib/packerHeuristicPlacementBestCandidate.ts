import type { BestCandidate } from "./packerCoreTypes";
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

export function applyBestCandidate(
  candidate: BestCandidate,
  context: HeuristicPlacementContext,
): boolean {
  if (candidate.rects.length === 0) return false;
  const fitByWeight = Math.floor(
    (context.safePallet.maxWeight - context.totalWeightRef.value + context.EPS) / candidate.carton.weight,
  );
  const take = Math.min(candidate.rects.length, fitByWeight);
  if (take <= 0) return false;

  const picked = candidate.rects.slice(0, take);
  if (
    !context.isRectSetPlacementSafe(
      picked,
      context.blockedRects,
      context.safePallet.width,
      context.safePallet.length,
    )
  ) {
    return false;
  }

  const density = computePlacementDensity(
    candidate.carton.weight,
    candidate.carton.width,
    candidate.carton.length,
    context.EPS,
  );
  const stagedCartons: PackedCarton[] = picked.map((rect) => ({
    id: context.createId(),
    typeId: candidate.carton.id,
    title: candidate.carton.title,
    x: rect.x,
    y: rect.y,
    z: context.zBase,
    w: rect.w,
    l: rect.l,
    h: candidate.carton.height,
    weight: candidate.carton.weight,
    color: candidate.carton.color,
  }));

  if (!isPlacementWrapSafe(context, picked.map((rect) => ({ x: rect.x, y: rect.y, w: rect.w, l: rect.l })))) {
    return false;
  }
  if (!isPlacementStackLoadSafe(context, stagedCartons)) {
    return false;
  }

  commitPlacementEntries(context, picked.map((rect, index) => ({
    rect,
    carton: stagedCartons[index],
    typeId: candidate.carton.id,
    weight: candidate.carton.weight,
    density,
    height: candidate.carton.height,
  })));

  candidate.carton.quantity -= picked.length;
  finalizePlacementCounters(
    context,
    candidate.carton.id,
    picked.length,
    candidate.carton.weight,
    candidate.carton.height,
  );
  return true;
}
