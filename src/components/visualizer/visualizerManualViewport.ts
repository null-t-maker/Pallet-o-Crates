import type { PackedCarton, PalletInput } from "../../lib/packer";
import { isValidCartonGeometry } from "./visualizerHelpers";

export function computeManualViewportMaxDim(
  pallet: PalletInput,
  manualCartons: PackedCarton[],
): number {
  const halfPalletWidth = pallet.width / 2;
  const halfPalletLength = pallet.length / 2;
  let maxDim = Math.max(pallet.width, pallet.length);

  for (const carton of manualCartons) {
    if (!isValidCartonGeometry(carton)) continue;

    const left = carton.x - halfPalletWidth;
    const right = carton.x + carton.w - halfPalletWidth;
    const bottom = carton.y - halfPalletLength;
    const top = carton.y + carton.l - halfPalletLength;
    const extent = Math.max(
      Math.abs(left),
      Math.abs(right),
      Math.abs(bottom),
      Math.abs(top),
    );
    if (!Number.isFinite(extent)) continue;
    maxDim = Math.max(maxDim, extent * 2);
  }

  return maxDim;
}
