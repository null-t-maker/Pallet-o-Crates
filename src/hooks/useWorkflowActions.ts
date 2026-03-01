import { useCallback } from "react";
import type { WorkflowMode } from "../components/Visualizer";
import { calculatePacking } from "../lib/packingWorkflow";
import {
  generateManualCartons,
  generateMoreManualCartons,
  updateManualCartonsById,
} from "../lib/manualLayout";
import type { ManualCartonUpdatePatch, UseWorkflowActionsArgs, UseWorkflowActionsResult } from "./workflowActionsTypes";
import { applyWorkflowModeTransition } from "./workflowModeTransition";

export function useWorkflowActions({
  workflowMode,
  setWorkflowMode,
  result,
  setResult,
  pallet,
  cartons,
  manualCartons,
  applyManualCartons,
  clearManualLayout,
  setVisibleLayers,
  closeWorkflowPanel,
  sampleGuidance,
  sampleTemplateLockEnabled,
  templateLockCandidate,
  setSampleTemplateLockStatus,
}: UseWorkflowActionsArgs): UseWorkflowActionsResult {
  const switchWorkflowMode = useCallback((nextMode: WorkflowMode) => {
    applyWorkflowModeTransition({
      workflowMode,
      nextMode,
      closeWorkflowPanel,
      setVisibleLayers,
      result,
      applyManualCartons,
      clearManualLayout,
      setResult,
      setWorkflowMode,
    });
  }, [
    applyManualCartons,
    clearManualLayout,
    closeWorkflowPanel,
    result,
    setResult,
    setVisibleLayers,
    setWorkflowMode,
    workflowMode,
  ]);

  const handleCalculate = useCallback(() => {
    void (async () => {
      const { result: packedResult, templateStatus } = await calculatePacking({
        pallet,
        cartons,
        sampleGuidance,
        sampleTemplateLockEnabled,
        templateLockCandidate,
      });
      setSampleTemplateLockStatus(templateStatus);
      setResult(packedResult);
      setVisibleLayers(0);
    })();
  }, [
    cartons,
    pallet,
    sampleGuidance,
    sampleTemplateLockEnabled,
    setResult,
    setSampleTemplateLockStatus,
    setVisibleLayers,
    templateLockCandidate,
  ]);

  const handleGenerateManualAgain = useCallback(() => {
    const generated = generateManualCartons({ ...pallet }, cartons.map((carton) => ({ ...carton })));
    applyManualCartons(generated, { resetHistory: true });
    setVisibleLayers(0);
  }, [applyManualCartons, cartons, pallet, setVisibleLayers]);

  const handleGenerateManualMore = useCallback(() => {
    const next = generateMoreManualCartons(
      { ...pallet },
      cartons.map((carton) => ({ ...carton })),
      manualCartons,
    );
    applyManualCartons(next, { recordHistory: true });
    setVisibleLayers(0);
  }, [applyManualCartons, cartons, manualCartons, pallet, setVisibleLayers]);

  const handleManualCartonUpdate = useCallback((id: string, next: ManualCartonUpdatePatch) => {
    const nextCartons = updateManualCartonsById(manualCartons, id, next);
    applyManualCartons(nextCartons, { recordHistory: true });
  }, [applyManualCartons, manualCartons]);

  return {
    switchWorkflowMode,
    handleCalculate,
    handleGenerateManualAgain,
    handleGenerateManualMore,
    handleManualCartonUpdate,
  };
}
