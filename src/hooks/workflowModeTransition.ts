import type { Dispatch, SetStateAction } from "react";
import type { WorkflowMode } from "../components/Visualizer";
import type { CartonInput, MultiPackResult, PackedCarton, PalletInput } from "../lib/packer";
import { buildManualGenerationSeedResult } from "../lib/manualGenerationSeed";
import { importGenerationToManual } from "../lib/manualLayout";

interface ApplyWorkflowModeTransitionArgs {
  workflowMode: WorkflowMode;
  nextMode: WorkflowMode;
  closeWorkflowPanel: () => void;
  setVisibleLayers: Dispatch<SetStateAction<number>>;
  pallet: PalletInput;
  cartons: CartonInput[];
  manualCartons: PackedCarton[];
  result: MultiPackResult | null;
  applyManualCartons: (
    cartons: PackedCarton[],
    options?: { recordHistory?: boolean; resetHistory?: boolean },
  ) => void;
  clearManualLayout: () => void;
  setResult: Dispatch<SetStateAction<MultiPackResult | null>>;
  generationSeedResult: MultiPackResult | null;
  setGenerationSeedResult: Dispatch<SetStateAction<MultiPackResult | null>>;
  setWorkflowMode: Dispatch<SetStateAction<WorkflowMode>>;
}

export function applyWorkflowModeTransition({
  workflowMode,
  nextMode,
  closeWorkflowPanel,
  setVisibleLayers,
  pallet,
  cartons,
  manualCartons,
  result,
  applyManualCartons,
  clearManualLayout,
  setResult,
  generationSeedResult,
  setGenerationSeedResult,
  setWorkflowMode,
}: ApplyWorkflowModeTransitionArgs): void {
  if (nextMode === workflowMode) {
    closeWorkflowPanel();
    return;
  }

  closeWorkflowPanel();
  setVisibleLayers(0);

  if (workflowMode === "generation" && nextMode === "manual") {
    setGenerationSeedResult(null);
    if (result && result.pallets.length > 0 && result.packedUnits > 0) {
      const imported = importGenerationToManual(result);
      applyManualCartons(imported, { resetHistory: true });
    } else if (!generationSeedResult) {
      clearManualLayout();
    }
    setResult(null);
  } else if (workflowMode === "manual" && nextMode === "generation") {
    const nextSeed = buildManualGenerationSeedResult({
      pallet,
      cartons,
      manualCartons,
    });
    setResult(null);
    setGenerationSeedResult(nextSeed.seedResult);
  }

  setWorkflowMode(nextMode);
}
