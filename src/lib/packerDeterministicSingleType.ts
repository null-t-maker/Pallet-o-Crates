import type {
  CartonInput,
  Layer,
  PackedCarton,
  PackResult,
  PalletInput,
} from "./packerTypes";
import type { OrientationOption, Pattern, Rect, SelectionMode } from "./packerCoreTypes";
import type { DeterministicPackDeps } from "./packerDeterministicTypes";

export function packSingleTypeDeterministic(
  pallet: PalletInput,
  carton: CartonInput,
  deps: DeterministicPackDeps,
): PackResult | null {
  if (carton.quantity <= 0 || carton.weight <= 0) return null;

  type SingleTypePlan = {
    orientation: OrientationOption;
    patternRects: Rect[];
    capacity: number;
    fitUnits: number;
    layerCount: number;
    totalHeight: number;
    styleScore: number;
  };

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
      const walls = deps.wallStats(rects, pallet.width, pallet.length);
      const center = deps.centerStats(rects, pallet.width, pallet.length);
      const gaps = deps.estimateGapStats(rects, pallet.width, pallet.length);
      const fill = deps.layerFillRatio(rects);

      let styleScore = fill * 500 - gaps.largestGapRatio * 220 - gaps.emptyRatio * 120;
      if (style === "centerCompact") {
        styleScore += center.occupancy * 420 + center.axisCoverage * 260 + (1 - walls.coverage) * 120;
      } else {
        styleScore += walls.coverage * 430 + walls.balance * 160 + center.occupancy * 90;
      }

      if (
        !best
        || fitUnits > best.fitUnits
        || (fitUnits === best.fitUnits && totalHeight < best.totalHeight)
        || (
          fitUnits === best.fitUnits
          && Math.abs(totalHeight - best.totalHeight) <= deps.EPS
          && capacity > best.capacity
        )
        || (
          fitUnits === best.fitUnits
          && Math.abs(totalHeight - best.totalHeight) <= deps.EPS
          && capacity === best.capacity
          && styleScore > best.styleScore
        )
      ) {
        best = {
          orientation: option,
          patternRects: rects,
          capacity,
          fitUnits,
          layerCount,
          totalHeight,
          styleScore,
        };
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
