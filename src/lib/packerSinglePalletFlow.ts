import type {
  CartonInput,
  Layer,
  PackedCarton,
  PackResult,
  PalletInput,
} from "./packerTypes";

const EPS = 1e-6;

export interface SinglePalletShortcutDeps {
  packInterchangeableTypesAsUnified: (pallet: PalletInput, cartons: CartonInput[]) => PackResult | null;
  packSingleTypeDeterministic: (pallet: PalletInput, carton: CartonInput) => PackResult | null;
}

export function prepareRemainingCartons(
  cartons: CartonInput[],
  sanitizeCarton: (carton: CartonInput) => CartonInput,
): CartonInput[] {
  const remaining = cartons.map((carton) => sanitizeCarton({ ...carton }));
  remaining.sort((a, b) => {
    const densityA = a.weight / (a.width * a.length);
    const densityB = b.weight / (b.width * b.length);
    if (Math.abs(densityB - densityA) > EPS) return densityB - densityA;
    if (Math.abs(b.weight - a.weight) > EPS) return b.weight - a.weight;
    return (b.width * b.length) - (a.width * a.length);
  });
  return remaining;
}

export function tryInitialShortcutPack(
  safePallet: PalletInput,
  remaining: CartonInput[],
  deps: SinglePalletShortcutDeps,
): PackResult | null {
  const initiallyActive = remaining.filter((carton) => carton.quantity > 0);
  const unifiedEquivalentResult = deps.packInterchangeableTypesAsUnified(safePallet, initiallyActive);
  if (unifiedEquivalentResult) return unifiedEquivalentResult;

  // Keep deterministic single-type shortcut only for trivial (effectively one-layer) cases.
  // Multi-layer single-type stacks should go through full heuristics to search interlocking layers.
  if (initiallyActive.length === 1) {
    const single = initiallyActive[0];
    const maxLayersByHeight = Math.floor((safePallet.maxHeight + EPS) / Math.max(single.height, EPS));
    const maxUnitsByWeight = Math.floor((safePallet.maxWeight + EPS) / Math.max(single.weight, EPS));
    const shouldUseDeterministic = maxLayersByHeight <= 1 || maxUnitsByWeight <= 1 || single.quantity <= 1;
    if (shouldUseDeterministic) {
      const deterministicSingle = deps.packSingleTypeDeterministic(safePallet, single);
      if (deterministicSingle) return deterministicSingle;
    }
  }

  return null;
}

export function buildPackResult(
  layers: Layer[],
  totalWeight: number,
  placed: PackedCarton[],
  remaining: CartonInput[],
  computeTotalPackedHeight: (placed: PackedCarton[]) => number,
): PackResult {
  return {
    layers,
    totalWeight,
    totalHeight: computeTotalPackedHeight(placed),
    unpacked: remaining.filter((carton) => carton.quantity > 0),
  };
}

export interface CenterFallbackDeps {
  countUnpackedUnits: (unpacked: CartonInput[]) => number;
  packSinglePallet: (pallet: PalletInput, cartons: CartonInput[]) => PackResult;
}

export function maybeUseEdgeFallbackForCenterStyle(
  safePallet: PalletInput,
  cartons: CartonInput[],
  centerResult: PackResult,
  deps: CenterFallbackDeps,
): PackResult {
  if (safePallet.packingStyle !== "centerCompact") {
    return centerResult;
  }

  const edgeResult = deps.packSinglePallet(
    { ...safePallet, packingStyle: "edgeAligned" },
    cartons.map((carton) => ({ ...carton })),
  );

  const centerUnpacked = deps.countUnpackedUnits(centerResult.unpacked);
  const edgeUnpacked = deps.countUnpackedUnits(edgeResult.unpacked);
  // Preserve style identity: center mode should stay center-first.
  // Only accept edge fallback when center is objectively worse for feasibility.
  const edgeBetter = edgeUnpacked < centerUnpacked
    || (edgeUnpacked === centerUnpacked && edgeResult.layers.length < centerResult.layers.length);

  return edgeBetter ? edgeResult : centerResult;
}

export function normalizeCartonsForPacking(
  cartons: CartonInput[],
  sanitizeCarton: (carton: CartonInput) => CartonInput,
): CartonInput[] {
  return cartons.map((carton) => sanitizeCarton({ ...carton }));
}
