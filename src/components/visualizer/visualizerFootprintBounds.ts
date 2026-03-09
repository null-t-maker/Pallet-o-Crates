import type { PackedPalletPlacement, PalletInput } from "../../lib/packer";
import type { CartonBoxSceneEntry } from "./CartonBox";
import { isValidCartonGeometry } from "./visualizerHelpers";

type WorkflowMode = "generation" | "manual";

export function computeFootprintBounds(
  basePallets: PackedPalletPlacement[],
  mode: WorkflowMode,
  pallet: PalletInput,
  sceneCartons: CartonBoxSceneEntry[],
): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const placed of basePallets) {
    const left = placed.offsetX - pallet.width / 2;
    const right = placed.offsetX + pallet.width / 2;
    const bottom = placed.offsetY - pallet.length / 2;
    const top = placed.offsetY + pallet.length / 2;
    minX = Math.min(minX, left);
    maxX = Math.max(maxX, right);
    minY = Math.min(minY, bottom);
    maxY = Math.max(maxY, top);
  }

  // In manual mode keep camera anchor stable on pallet footprint.
  // Including moving cartons in bounds causes target/position jumps while dragging.
  if (mode !== "manual") {
    for (const entry of sceneCartons) {
      const carton = entry.carton;
      if (!isValidCartonGeometry(carton)) continue;
      const left = carton.x - pallet.width / 2 + entry.offsetX;
      const right = carton.x + carton.w - pallet.width / 2 + entry.offsetX;
      const bottom = carton.y - pallet.length / 2 + entry.offsetY;
      const top = carton.y + carton.l - pallet.length / 2 + entry.offsetY;
      if (!Number.isFinite(left) || !Number.isFinite(right) || !Number.isFinite(bottom) || !Number.isFinite(top)) {
        continue;
      }
      minX = Math.min(minX, left);
      maxX = Math.max(maxX, right);
      minY = Math.min(minY, bottom);
      maxY = Math.max(maxY, top);
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
    return {
      minX: -pallet.width / 2,
      maxX: pallet.width / 2,
      minY: -pallet.length / 2,
      maxY: pallet.length / 2,
    };
  }

  return { minX, maxX, minY, maxY };
}
