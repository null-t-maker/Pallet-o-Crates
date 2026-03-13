import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ViewerStage } from "./components/ViewerStage";
import { AppTopbar } from "./components/AppTopbar";
import { WorkflowProgressModal } from "./components/WorkflowProgressModal";
import { useLayoutSampleLoad } from "./hooks/useLayoutSampleLoad";
import { useLayoutSampleSave } from "./hooks/useLayoutSampleSave";
import { UI_SCALE_MAX, UI_SCALE_MIN, UI_ZOOM_MAX, UI_ZOOM_MIN } from "./hooks/useUiScale";
import { useAppLabels } from "./hooks/useAppLabels";
import { useWorkflowActions } from "./hooks/useWorkflowActions";
import { useAppSampleDatabaseBindings } from "./hooks/useAppSampleDatabaseBindings";
import { useAppLayoutBindings } from "./hooks/useAppLayoutBindings";
import { useAppBootstrap } from "./hooks/useAppBootstrap";
import { filterGenerationEnabledCartons } from "./lib/cartonActivation";
import { normalizeManualCartonsForSampleSave } from "./lib/layoutSampleSaveNormalization";
import { buildManualGenerationSeedResult } from "./lib/manualGenerationSeed";
import { hasAnyManualCartonOverlap } from "./lib/manualCartonOverlap";
import type { PackingProgressSnapshot } from "./lib/packingProgress";
import type { WorkflowBusyKind } from "./hooks/workflowActionsTypes";
import "./App.css";

const RELEASES_PAGE_URL = (import.meta.env.VITE_RELEASES_PAGE_URL as string | undefined)?.trim()
  || "https://github.com/null-t-maker/Pallet-o-Crates/releases";

function App() {
  const {
    workflowState,
    manualHistory,
    uiScaleState,
    uiOverlays,
    topbarPanels,
    updateCheck,
    languageState,
    pickFolderPath,
  } = useAppBootstrap({
    releasesPageUrl: RELEASES_PAGE_URL,
  });
  const { closeWorkflowPanel } = topbarPanels;
  const { language, setLanguage, t } = languageState;
  const { uiScale, setUiScale, uiZoom, setUiZoom } = uiScaleState;
  const {
    pallet,
    setPallet,
    cartons,
    setCartons,
    result,
    setResult,
    generationSeedResult,
    setGenerationSeedResult,
    workflowMode,
    setWorkflowMode,
    visibleLayers,
    setVisibleLayers,
    palletGenerationOpen,
    setPalletGenerationOpen,
  } = workflowState;
  const { manualCartons, applyManualCartons, clearManualLayout } = manualHistory;
  const { updateCheckModalOpen, openUpdateCheckModal, closeUpdateCheckModal, handleConfirmUpdateCheck } = updateCheck;
  const [manualShadowModeEnabled, setManualShadowModeEnabled] = useState(false);
  const [workflowBusyKind, setWorkflowBusyKind] = useState<WorkflowBusyKind>(null);
  const [workflowProgress, setWorkflowProgress] = useState<PackingProgressSnapshot | null>(null);
  const activeCartons = useMemo(() => filterGenerationEnabledCartons(cartons), [cartons]);
  const effectiveGenerationResult = useMemo(
    () => result ?? generationSeedResult,
    [generationSeedResult, result],
  );
  const normalizedManualCartonsForSampleSave = useMemo(
    () => normalizeManualCartonsForSampleSave(manualCartons),
    [manualCartons],
  );
  const manualHasOverlap = useMemo(
    () => hasAnyManualCartonOverlap(normalizedManualCartonsForSampleSave),
    [normalizedManualCartonsForSampleSave],
  );
  const hasGenerationSeedPreview = workflowMode === "generation"
    && result === null
    && generationSeedResult !== null;
  const syncedGenerationSeedResult = useMemo(() => {
    if (!hasGenerationSeedPreview) return null;
    return buildManualGenerationSeedResult({
      pallet,
      cartons: activeCartons,
      manualCartons,
    }).seedResult;
  }, [
    activeCartons,
    hasGenerationSeedPreview,
    manualCartons,
    pallet,
  ]);

  useEffect(() => {
    if (workflowMode !== "manual" && manualShadowModeEnabled) {
      setManualShadowModeEnabled(false);
    }
  }, [manualShadowModeEnabled, workflowMode]);

  useEffect(() => {
    if (!hasGenerationSeedPreview) return;
    setGenerationSeedResult(syncedGenerationSeedResult);
  }, [
    hasGenerationSeedPreview,
    setGenerationSeedResult,
    syncedGenerationSeedResult,
  ]);

  const labels = useAppLabels({ t, workflowMode });
  const sampleDatabase = useAppSampleDatabaseBindings({
    pallet,
    cartons: activeCartons,
    sampleDatabasePanelVisible: uiOverlays.sampleDatabasePanelVisible,
    t,
    labels,
    pickFolderPath,
  });

  const sampleSave = useLayoutSampleSave({
    workflowMode,
    pallet,
    cartons: activeCartons,
    result: effectiveGenerationResult,
    manualCartons,
    pickFolderPath,
    sampleFolderNotSelectedLabel: labels.sampleFolderNotSelectedLabel,
    sampleSavedPrefix: labels.sampleSavedPrefix,
    sampleSaveFailedPrefix: labels.sampleSaveFailedPrefix,
    saveSampleBlockedReason: workflowMode !== "manual"
      ? null
      : manualShadowModeEnabled
        ? (t.sampleSaveBlockedByShadowMode ?? "Disable Ghost mode before saving a layout sample.")
        : manualHasOverlap
          ? (t.sampleSaveBlockedByManualOverlap ?? "Resolve manual carton overlaps before saving a layout sample.")
          : null,
  });

  const sampleLoad = useLayoutSampleLoad({
    sampleDatabaseFolderPath: sampleDatabase.sampleDatabaseFolderPath,
    sampleDatabaseData: sampleDatabase.sampleDatabaseData,
    sampleDatabaseLoading: sampleDatabase.sampleDatabaseLoading,
    sampleDatabaseError: sampleDatabase.sampleDatabaseError,
    handleChooseSampleDatabaseFolder: sampleDatabase.handleChooseSampleDatabaseFolder,
    handleReloadSampleDatabase: sampleDatabase.handleReloadSampleDatabase,
    setPallet,
    setCartons,
    setResult,
    setGenerationSeedResult,
    setWorkflowMode,
    applyManualCartons,
    clearManualLayout,
    setVisibleLayers,
    setManualShadowModeEnabled,
    sampleLoadNoSamplesLabel: labels.sampleLoadNoSamplesLabel,
    sampleLoadNoFileSelectedLabel: labels.sampleLoadNoFileSelectedLabel,
    sampleLoadedPrefix: labels.sampleLoadedPrefix,
    sampleLoadFailedPrefix: labels.sampleLoadFailedPrefix,
  });

  const {
    cancelWorkflow,
    switchWorkflowMode,
    handleCalculate,
    handleCalculateMissing,
    handleGenerateManualAgain,
    handleGenerateManualMore,
    handleManualCartonUpdate,
  } = useWorkflowActions({
    workflowMode,
    setWorkflowMode,
    result,
    setResult,
    generationSeedResult,
    setGenerationSeedResult,
    pallet,
    cartons: activeCartons,
    manualCartons,
    applyManualCartons,
    clearManualLayout,
    setVisibleLayers,
    closeWorkflowPanel,
    sampleGuidance: sampleDatabase.sampleGuidance,
    sampleTemplateLockEnabled: sampleDatabase.sampleTemplateLockEnabled,
    templateLockCandidate: sampleDatabase.templateLockCandidate,
    setSampleTemplateLockStatus: sampleDatabase.setSampleTemplateLockStatus,
    workflowBusyKind,
    setWorkflowBusyKind,
    setWorkflowProgress,
  });

  const { topbarProps, viewerStageProps, sidebarProps } = useAppLayoutBindings({
    t,
    labels,
    language,
    setLanguage,
    palletGenerationOpen,
    setPalletGenerationOpen,
    openUpdateCheckModal,
    workflowMode,
    switchWorkflowMode,
    topbarPanels,
    sampleSave,
    sampleLoad,
    uiOverlays,
    setUiScale,
    setUiZoom,
    pallet,
    setPallet,
    cartons,
    setCartons,
    result: effectiveGenerationResult,
    generationSeedResult,
    manualCartons,
    handleManualCartonUpdate,
    manualShadowModeEnabled,
    setManualShadowModeEnabled,
    visibleLayers,
    setVisibleLayers,
    uiScale,
    uiZoom,
    uiScaleMin: UI_SCALE_MIN,
    uiScaleMax: UI_SCALE_MAX,
    uiZoomMin: UI_ZOOM_MIN,
    uiZoomMax: UI_ZOOM_MAX,
    updateCheckModalOpen,
    handleConfirmUpdateCheck,
    closeUpdateCheckModal,
    handleCalculate,
    handleCalculateMissing,
    handleGenerateManualAgain,
    handleGenerateManualMore,
    workflowBusyKind,
    sampleDatabase,
  });

  return (
    <div className="app app-with-topbar">
      <AppTopbar {...topbarProps} />

      <div className="app-body">
        {palletGenerationOpen && (
          <Sidebar {...sidebarProps} />
        )}
        <ViewerStage {...viewerStageProps} />
      </div>

      {workflowProgress && (
        <WorkflowProgressModal
          progress={workflowProgress}
          title={workflowProgress.kind === "calculate"
            ? labels.workflowProgressTitleCalculate
            : labels.workflowProgressTitleCalculateMissing}
          cancelLabel={labels.cancelLabel}
          onCancel={cancelWorkflow}
          statusLabel={labels.workflowProgressStatusLabel}
          elapsedLabel={labels.workflowProgressElapsedLabel}
          packedLabel={labels.packedUnitsLabel}
          trialLabel={labels.workflowProgressTrialLabel}
          palletLabel={labels.workflowProgressPalletLabel}
          layerLabel={labels.workflowProgressLayerLabel}
          stagePreparingLabel={labels.workflowProgressPreparingLabel}
          stageAnalyzingManualSeedLabel={labels.workflowProgressAnalyzingManualSeedLabel}
          stageTryingTemplateLockLabel={labels.workflowProgressTryingTemplateLockLabel}
          stageTemplateContinuationLabel={labels.workflowProgressTemplateContinuationLabel}
          stagePackingLayoutLabel={labels.workflowProgressPackingLayoutLabel}
          stageComparingFallbackLabel={labels.workflowProgressComparingFallbackLabel}
          stagePackingSupplementaryLabel={labels.workflowProgressPackingSupplementaryLabel}
        />
      )}
    </div>
  );
}

export default App;
