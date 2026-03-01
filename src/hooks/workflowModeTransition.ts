import type { Dispatch, SetStateAction } from "react";
import type { WorkflowMode } from "../components/Visualizer";
import type { MultiPackResult, PackedCarton } from "../lib/packer";
import { importGenerationToManual } from "../lib/manualLayout";

interface ApplyWorkflowModeTransitionArgs {
  workflowMode: WorkflowMode;
  nextMode: WorkflowMode;
  closeWorkflowPanel: () => void;
  setVisibleLayers: Dispatch<SetStateAction<number>>;
  result: MultiPackResult | null;
  applyManualCartons: (
    cartons: PackedCarton[],
    options?: { recordHistory?: boolean; resetHistory?: boolean },
  ) => void;
  clearManualLayout: () => void;
  setResult: Dispatch<SetStateAction<MultiPackResult | null>>;
  setWorkflowMode: Dispatch<SetStateAction<WorkflowMode>>;
}

export function applyWorkflowModeTransition({
  workflowMode,
  nextMode,
  closeWorkflowPanel,
  setVisibleLayers,
  result,
  applyManualCartons,
  clearManualLayout,
  setResult,
  setWorkflowMode,
}: ApplyWorkflowModeTransitionArgs): void {
  if (nextMode === workflowMode) {
    closeWorkflowPanel();
    return;
  }

  closeWorkflowPanel();
  setVisibleLayers(0);

  if (workflowMode === "generation" && nextMode === "manual") {
    if (result && result.pallets.length > 0 && result.packedUnits > 0) {
      const imported = importGenerationToManual(result);
      applyManualCartons(imported, { resetHistory: true });
    } else {
      clearManualLayout();
    }
    setResult(null);
  } else if (workflowMode === "manual" && nextMode === "generation") {
    clearManualLayout();
  }

  setWorkflowMode(nextMode);
}
