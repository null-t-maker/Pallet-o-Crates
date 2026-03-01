import { useMemo } from "react";
import type { MultiPackResult, PackedCarton, PackedPalletPlacement, PalletInput } from "../../lib/packer";
import type { Translations } from "../../i18n";
import type { CartonBoxSceneEntry } from "./CartonBox";
import {
  buildBasePallets,
  buildSceneCartons,
  computeFootprintBounds,
  computeResultCounters,
  resolveVisualizerLabels,
} from "./visualizerSceneMetrics";
import { BASE_H, isValidCartonGeometry } from "./visualizerHelpers";

type WorkflowMode = "generation" | "manual";

interface UseVisualizerSceneStateArgs {
  mode: WorkflowMode;
  result: MultiPackResult | null;
  visibleLayers: number;
  pallet: PalletInput;
  manualCartons: PackedCarton[];
  selectedId: string | null;
  t: Translations;
}

interface UseVisualizerSceneStateResult {
  basePallets: PackedPalletPlacement[];
  sceneCartons: CartonBoxSceneEntry[];
  selectedCarton: PackedCarton | null;
  selectedManualCarton: PackedCarton | null;
  manualTotalWeight: number;
  manualMaxHeight: number;
  sceneCenterX: number;
  sceneCenterZ: number;
  maxDim: number;
  dynamicOrbitTargetY: number;
  unpackedCount: number;
  limitsExceeded: boolean;
  layerCount: number;
  palletsUsed: number;
  unpackedMessage: string;
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
}

export function useVisualizerSceneState({
  mode,
  result,
  visibleLayers,
  pallet,
  manualCartons,
  selectedId,
  t,
}: UseVisualizerSceneStateArgs): UseVisualizerSceneStateResult {
  const placedPallets = useMemo<PackedPalletPlacement[]>(
    () => result?.pallets ?? [],
    [result],
  );
  const basePallets = useMemo(
    () => buildBasePallets(mode, placedPallets),
    [mode, placedPallets],
  );
  const sceneCartons = useMemo<CartonBoxSceneEntry[]>(
    () => buildSceneCartons(mode, manualCartons, placedPallets, visibleLayers),
    [manualCartons, mode, placedPallets, visibleLayers],
  );
  const selectedCarton = useMemo(
    () => sceneCartons.find((entry) => entry.carton.id === selectedId)?.carton ?? null,
    [sceneCartons, selectedId],
  );

  const selectedManualCarton = useMemo(
    () => (mode === "manual" && selectedId
      ? manualCartons.find((carton) => carton.id === selectedId && isValidCartonGeometry(carton)) ?? null
      : null),
    [manualCartons, mode, selectedId],
  );

  const manualTotalWeight = useMemo(
    () => manualCartons.filter(isValidCartonGeometry).reduce((sum, carton) => sum + carton.weight, 0),
    [manualCartons],
  );
  const manualMaxHeight = useMemo(
    () => manualCartons.filter(isValidCartonGeometry).reduce((maxHeight, carton) => Math.max(maxHeight, carton.z + carton.h), 0),
    [manualCartons],
  );

  const footprintBounds = useMemo(
    () => computeFootprintBounds(basePallets, mode, pallet, sceneCartons),
    [basePallets, mode, pallet, sceneCartons],
  );
  const footprintWidth = footprintBounds.maxX - footprintBounds.minX;
  const footprintLength = footprintBounds.maxY - footprintBounds.minY;
  const sceneCenterX = (footprintBounds.minX + footprintBounds.maxX) / 2;
  const sceneCenterZ = (footprintBounds.minY + footprintBounds.maxY) / 2;

  const packedHeight = (mode === "manual" ? manualMaxHeight : result?.maxHeight ?? 0) + BASE_H;
  const fallbackHeight = Math.max(pallet.width, pallet.length) * 0.75;
  const maxDim = Math.max(
    footprintWidth,
    footprintLength,
    mode === "generation" && !result ? fallbackHeight : packedHeight,
  );
  const dynamicOrbitTargetY = BASE_H + (mode === "manual" ? manualMaxHeight / 2 : (result ? result.maxHeight / 2 : 100));

  const { unpackedCount, limitsExceeded, layerCount, palletsUsed } = useMemo(
    () => computeResultCounters(result, pallet),
    [pallet, result],
  );
  const unpackedMessage = limitsExceeded && t.unpackedLimitExceeded
    ? t.unpackedLimitExceeded(unpackedCount)
    : t.unpacked(unpackedCount);

  const labels = useMemo(() => resolveVisualizerLabels(t), [t]);

  return {
    basePallets,
    sceneCartons,
    selectedCarton,
    selectedManualCarton,
    manualTotalWeight,
    manualMaxHeight,
    sceneCenterX,
    sceneCenterZ,
    maxDim,
    dynamicOrbitTargetY,
    unpackedCount,
    limitsExceeded,
    layerCount,
    palletsUsed,
    unpackedMessage,
    ...labels,
  };
}
