import type {
  PackedCarton,
  PackedPalletPlacement,
} from "../../lib/packer";
import type { Translations } from "../../i18n";
import { isValidCartonGeometry } from "./visualizerHelpers";
import type { CartonBoxSceneEntry } from "./CartonBox";

export { computeFootprintBounds } from "./visualizerFootprintBounds";
export { computeResultCounters } from "./visualizerResultCounters";

type WorkflowMode = "generation" | "manual";

export function buildBasePallets(
  mode: WorkflowMode,
  placedPallets: PackedPalletPlacement[],
): PackedPalletPlacement[] {
  if (mode === "generation" && placedPallets.length > 0) return placedPallets;
  return [{ index: 0, offsetX: 0, offsetY: 0, result: { layers: [], totalWeight: 0, totalHeight: 0, unpacked: [] } }];
}

export function buildSceneCartons(
  mode: WorkflowMode,
  manualCartons: PackedCarton[],
  placedPallets: PackedPalletPlacement[],
  visibleLayers: number,
): CartonBoxSceneEntry[] {
  if (mode === "manual") {
    return manualCartons
      .filter(isValidCartonGeometry)
      .map((carton) => ({
        carton,
        offsetX: 0,
        offsetY: 0,
      }));
  }

  const out: CartonBoxSceneEntry[] = [];
  for (const placed of placedPallets) {
    placed.result.layers.forEach((layer, i) => {
      if (visibleLayers === 0 || i < visibleLayers) {
        for (const carton of layer.cartons) {
          out.push({
            carton,
            offsetX: placed.offsetX,
            offsetY: placed.offsetY,
          });
        }
      }
    });
  }
  return out;
}

export function resolveVisualizerLabels(t: Translations): {
  palletCountLabel: string;
  manualMoveStepLabel: string;
  manualRotateLabel: string;
  manualRotateHorizontalLabel: string;
  manualRotateVerticalXLabel: string;
  manualRotateVerticalYLabel: string;
  manualCollisionHint: string;
  manualPalletAreaLabel: (width: number, length: number) => string;
  manualClearSelectedCartonAriaLabel: string;
  manualPlacedCartonsLabel: string;
} {
  return {
    palletCountLabel: t.palletCount ?? "Pallets",
    manualMoveStepLabel: t.manualMoveStepLabel ?? "Move step (mm)",
    manualRotateLabel: t.manualRotateLabel ?? "Rotate 90 deg",
    manualRotateHorizontalLabel: t.manualRotateHorizontal ?? "Horizontal",
    manualRotateVerticalXLabel: t.manualRotateVerticalX ?? "Vertical X",
    manualRotateVerticalYLabel: t.manualRotateVerticalY ?? "Vertical Y",
    manualCollisionHint: t.manualMoveBlockedCollision ?? "Move blocked: cartons cannot overlap.",
    manualPalletAreaLabel: t.manualPalletAreaLabel ?? ((width: number, length: number) => `Pallet area: X 0..${width} mm | Y 0..${length} mm`),
    manualClearSelectedCartonAriaLabel: t.manualClearSelectedCartonAriaLabel ?? "Clear selected carton",
    manualPlacedCartonsLabel: t.packedUnits,
  };
}
