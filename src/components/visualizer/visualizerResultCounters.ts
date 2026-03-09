import type { MultiPackResult, PalletInput } from "../../lib/packer";

export function computeResultCounters(
  result: MultiPackResult | null,
  pallet: PalletInput,
): {
  unpackedCount: number;
  limitsExceeded: boolean;
  layerCount: number;
  palletsUsed: number;
} {
  const unpackedCount = result ? result.unpacked.reduce((acc, carton) => acc + carton.quantity, 0) : 0;
  const limitsExceeded = !!result
    && result.pallets.some((placed) =>
      placed.result.totalWeight > pallet.maxWeight + 1e-6
      || placed.result.totalHeight > pallet.maxHeight + 1e-6,
    );
  const layerCount = result
    ? result.pallets.reduce((max, placed) => Math.max(max, placed.result.layers.length), 0)
    : 0;
  const palletsUsed = result ? Math.max(1, result.pallets.length) : 1;
  return { unpackedCount, limitsExceeded, layerCount, palletsUsed };
}
