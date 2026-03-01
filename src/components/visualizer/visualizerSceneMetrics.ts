import type {
  MultiPackResult,
  PackedCarton,
  PackedPalletPlacement,
  PalletInput,
} from "../../lib/packer";
import type { Translations } from "../../i18n";
import { isValidCartonGeometry } from "./visualizerHelpers";
import type { CartonBoxSceneEntry } from "./CartonBox";

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

export function computeResultCounters(
  result: MultiPackResult | null,
  pallet: PalletInput,
): {
  unpackedCount: number;
  limitsExceeded: boolean;
  layerCount: number;
  palletsUsed: number;
} {
  const unpackedCount = result ? result.unpacked.reduce((a, c) => a + c.quantity, 0) : 0;
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
