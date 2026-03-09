import type {
  CartonInput,
  Layer,
  PackedCarton,
  PackResult,
  PalletInput,
} from "./packerTypes";
import type { Pattern, SelectionMode } from "./packerCoreTypes";
import type { DeterministicPackDeps } from "./packerDeterministicTypes";
import {
  computeSingleTypeStyleScore,
  isBetterSingleTypePlan,
  type SingleTypePlan,
} from "./packerDeterministicSingleTypePlan";

export function packSingleTypeDeterministic(
  pallet: PalletInput,
  carton: CartonInput,
  deps: DeterministicPackDeps,
): PackResult | null {
  if (carton.quantity <= 0 || carton.weight <= 0) return null;

  const maxByWeight = Math.floor((pallet.maxWeight + deps.EPS) / carton.weight);
  if (maxByWeight <= 0) {
    return {
      layers: [],
      totalWeight: 0,
      totalHeight: 0,
      unpacked: [{ ...carton }],
    };
  }

  const style = deps.resolvePackingStyle(pallet);
  const allowUpright = deps.resolveUprightPolicy(carton) === "prefer";
  const patternCache = new Map<string, Pattern[]>();
  let best: SingleTypePlan | null = null;

  for (const option of deps.orientationOptions(carton, allowUpright)) {
    if (option.h > pallet.maxHeight + deps.EPS) continue;

    const maxLayersByHeight = Math.floor((pallet.maxHeight + deps.EPS) / option.h);
    if (maxLayersByHeight <= 0) continue;

    const patterns = deps.getPatternCandidates(
      pallet.width,
      pallet.length,
      option.w,
      option.l,
      patternCache,
    );

    for (const pattern of patterns) {
      const rects = deps.sortRects(pattern.rects);
      if (rects.length === 0) continue;
      if (!deps.isWrapFriendlyLayerShape(rects, [], pallet)) continue;

      const capacity = rects.length;
      const fitUnits = Math.min(carton.quantity, maxByWeight, capacity * maxLayersByHeight);
      if (fitUnits <= 0) continue;

      const layerCount = Math.ceil(fitUnits / capacity);
      const totalHeight = layerCount * option.h;
      const styleScore = computeSingleTypeStyleScore(style, rects, pallet, deps);
      const plan: SingleTypePlan = {
        orientation: option,
        patternRects: rects,
        capacity,
        fitUnits,
        layerCount,
        totalHeight,
        styleScore,
      };

      if (isBetterSingleTypePlan(plan, best, deps.EPS)) {
        best = plan;
      }
    }
  }

  if (!best) return null;

  const layers: Layer[] = [];
  const placedAll: PackedCarton[] = [];
  let packed = 0;

  for (let layerIndex = 0; layerIndex < best.layerCount; layerIndex++) {
    const remaining = best.fitUnits - packed;
    if (remaining <= 0) break;

    const take = Math.min(best.capacity, remaining);
    const mode: SelectionMode = take === best.capacity
      ? "edge"
      : (style === "centerCompact" ? "center" : "edge");
    const selectedRaw = take === best.capacity
      ? best.patternRects
      : deps.selectRects(best.patternRects, take, mode, pallet.width, pallet.length);
    const selected = style === "centerCompact" && take < best.capacity
      ? deps.sortRects(deps.recenterRects(selectedRaw, pallet.width, pallet.length))
      : deps.sortRects(selectedRaw);

    if (selected.length === 0) break;
    if (!deps.isRectSetPlacementSafe(selected, [], pallet.width, pallet.length)) break;

    const zBase = layerIndex * best.orientation.h;
    const layer: Layer = {
      zBase,
      height: best.orientation.h,
      cartons: [],
    };

    for (const rect of selected) {
      const packedCarton: PackedCarton = {
        id: deps.createId(),
        typeId: carton.id,
        title: carton.title,
        x: rect.x,
        y: rect.y,
        z: zBase,
        w: rect.w,
        l: rect.l,
        h: best.orientation.h,
        weight: carton.weight,
        color: carton.color,
      };
      layer.cartons.push(packedCarton);
      placedAll.push(packedCarton);
    }

    packed += selected.length;
    layers.push(layer);
  }

  const remainingQty = Math.max(0, carton.quantity - packed);
  return {
    layers,
    totalWeight: packed * carton.weight,
    totalHeight: deps.computeTotalPackedHeight(placedAll),
    unpacked: remainingQty > 0 ? [{ ...carton, quantity: remainingQty }] : [],
  };
}
