import type {
  BestCandidate,
  GapPlacementCandidate,
  LayerState,
  PlacementRect,
  Rect,
} from "./packerCoreTypes";
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

  const density = candidate.carton.weight
    / Math.max(candidate.carton.width * candidate.carton.length, context.EPS);
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

  const prospectiveRects: Rect[] = [
    ...context.layerPlacements.map((placement) => ({
      x: placement.x,
      y: placement.y,
      w: placement.w,
      l: placement.l,
    })),
    ...picked.map((rect) => ({ x: rect.x, y: rect.y, w: rect.w, l: rect.l })),
  ];
  if (!context.isWrapFriendlyLayerShape(prospectiveRects, context.state.prevPlacements, context.safePallet)) {
    return false;
  }

  const prospectivePacked: PackedCarton[] = [
    ...context.placed,
    ...context.layer.cartons,
    ...stagedCartons,
  ];
  if (!context.cumulativeStackLoadSafe(prospectivePacked)) {
    return false;
  }

  for (let i = 0; i < picked.length; i++) {
    const rect = picked[i];
    context.layer.cartons.push(stagedCartons[i]);
    context.layerPlacements.push({
      ...rect,
      typeId: candidate.carton.id,
      weight: candidate.carton.weight,
      density,
      h: candidate.carton.height,
    });
    context.blockedRects.push(rect);
  }

  candidate.carton.quantity -= picked.length;
  context.totalWeightRef.value += picked.length * candidate.carton.weight;
  context.layer.height = Math.max(context.layer.height, candidate.carton.height);
  context.usedTypeIds.add(candidate.carton.id);
  return true;
}

export function applyGapPlacementCandidate(
  candidate: GapPlacementCandidate,
  context: HeuristicPlacementContext,
): boolean {
  if (candidate.carton.quantity <= 0) return false;
  if (context.totalWeightRef.value + candidate.carton.weight > context.safePallet.maxWeight + context.EPS) return false;
  if (context.zBase + candidate.orientation.h > context.safePallet.maxHeight + context.EPS) return false;
  if (!context.noCollision(candidate.rect, context.blockedRects)) return false;

  const prospectiveRects: Rect[] = [
    ...context.layerPlacements.map((placement) => ({
      x: placement.x,
      y: placement.y,
      w: placement.w,
      l: placement.l,
    })),
    { x: candidate.rect.x, y: candidate.rect.y, w: candidate.rect.w, l: candidate.rect.l },
  ];
  if (!context.isWrapFriendlyLayerShape(prospectiveRects, context.state.prevPlacements, context.safePallet)) {
    return false;
  }

  const density = candidate.carton.weight
    / Math.max(candidate.orientation.w * candidate.orientation.l, context.EPS);
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

  const prospectivePacked: PackedCarton[] = [
    ...context.placed,
    ...context.layer.cartons,
    stagedCarton,
  ];
  if (!context.cumulativeStackLoadSafe(prospectivePacked)) {
    return false;
  }

  context.layer.cartons.push(stagedCarton);
  context.layerPlacements.push({
    ...candidate.rect,
    typeId: candidate.carton.id,
    weight: candidate.carton.weight,
    density,
    h: candidate.orientation.h,
  });
  context.blockedRects.push(candidate.rect);

  candidate.carton.quantity -= 1;
  context.totalWeightRef.value += candidate.carton.weight;
  context.layer.height = Math.max(context.layer.height, candidate.orientation.h);
  context.usedTypeIds.add(candidate.carton.id);
  return true;
}

