import { useCallback, useEffect, useRef } from "react";
import type { WorkflowMode } from "../components/Visualizer";
import { calculatePacking } from "../lib/packingWorkflow";
import { calculateMissingCartonsFromGenerationSeedAsync } from "../lib/packingWorkflowLockedSeed";
import { createPackingProgressReporter, isPackingCancelledError } from "../lib/packingProgress";
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
  generationSeedResult,
  setGenerationSeedResult,
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
  workflowBusyKind,
  setWorkflowBusyKind,
  setWorkflowProgress,
}: UseWorkflowActionsArgs): UseWorkflowActionsResult {
  const workflowAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      workflowAbortControllerRef.current?.abort();
    };
  }, []);

  const switchWorkflowMode = useCallback((nextMode: WorkflowMode) => {
    applyWorkflowModeTransition({
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
    });
  }, [
    applyManualCartons,
    cartons,
    clearManualLayout,
    closeWorkflowPanel,
    generationSeedResult,
    manualCartons,
    pallet,
    result,
    setGenerationSeedResult,
    setResult,
    setVisibleLayers,
    setWorkflowMode,
    workflowMode,
  ]);

  const handleCalculate = useCallback(() => {
    if (workflowBusyKind) return;
    void (async () => {
      const abortController = new AbortController();
      workflowAbortControllerRef.current = abortController;
      setWorkflowBusyKind("calculate");
      try {
        const requestedUnits = cartons.reduce((sum, carton) => sum + Math.max(0, Math.floor(carton.quantity)), 0);
        const progressReporter = createPackingProgressReporter({
          kind: "calculate",
          requestedUnits,
          onProgress: setWorkflowProgress,
          signal: abortController.signal,
        });
        await progressReporter.report({
          stage: "preparing",
          packedUnits: 0,
        }, { force: true, yieldToUi: true });
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0);
        });
        const { result: packedResult, templateStatus } = await calculatePacking({
          pallet,
          cartons,
          sampleGuidance,
          sampleTemplateLockEnabled,
          templateLockCandidate,
          progressReporter,
        });
        setSampleTemplateLockStatus(templateStatus);
        setGenerationSeedResult(null);
        setResult(packedResult);
        setVisibleLayers(0);
      } catch (error) {
        if (!isPackingCancelledError(error)) {
          console.error("Calculate full layout failed", error);
        }
      } finally {
        if (workflowAbortControllerRef.current === abortController) {
          workflowAbortControllerRef.current = null;
        }
        setWorkflowProgress(null);
        setWorkflowBusyKind(null);
      }
    })();
  }, [
    cartons,
    pallet,
    sampleGuidance,
    sampleTemplateLockEnabled,
    setGenerationSeedResult,
    setResult,
    setSampleTemplateLockStatus,
    setVisibleLayers,
    setWorkflowBusyKind,
    setWorkflowProgress,
    templateLockCandidate,
    workflowBusyKind,
  ]);

  const handleCalculateMissing = useCallback(() => {
    if (workflowBusyKind) return;
    void (async () => {
      const abortController = new AbortController();
      workflowAbortControllerRef.current = abortController;
      setWorkflowBusyKind("calculateMissing");
      try {
        const requestedUnits = cartons.reduce((sum, carton) => sum + Math.max(0, Math.floor(carton.quantity)), 0);
        const progressReporter = createPackingProgressReporter({
          kind: "calculateMissing",
          requestedUnits,
          onProgress: setWorkflowProgress,
          signal: abortController.signal,
        });
        await progressReporter.report({
          stage: "preparing",
          packedUnits: 0,
        }, { force: true, yieldToUi: true });
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0);
        });
        const { result: packedResult, lockedStatus } = await calculateMissingCartonsFromGenerationSeedAsync({
          pallet,
          cartons,
          generationResult: result ?? generationSeedResult,
          sampleGuidance,
          progressReporter,
        });
        setSampleTemplateLockStatus(lockedStatus);
        setGenerationSeedResult(null);
        setResult(packedResult);
        setVisibleLayers(0);
      } catch (error) {
        if (!isPackingCancelledError(error)) {
          console.error("Calculate missing cartons failed", error);
        }
      } finally {
        if (workflowAbortControllerRef.current === abortController) {
          workflowAbortControllerRef.current = null;
        }
        setWorkflowProgress(null);
        setWorkflowBusyKind(null);
      }
    })();
  }, [
    cartons,
    generationSeedResult,
    pallet,
    result,
    sampleGuidance,
    setGenerationSeedResult,
    setResult,
    setSampleTemplateLockStatus,
    setVisibleLayers,
    setWorkflowBusyKind,
    setWorkflowProgress,
    workflowBusyKind,
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

  const cancelWorkflow = useCallback(() => {
    workflowAbortControllerRef.current?.abort();
  }, []);

  return {
    cancelWorkflow,
    switchWorkflowMode,
    handleCalculate,
    handleCalculateMissing,
    handleGenerateManualAgain,
    handleGenerateManualMore,
    handleManualCartonUpdate,
  };
}
