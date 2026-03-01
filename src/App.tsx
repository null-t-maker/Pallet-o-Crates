import { Sidebar } from "./components/Sidebar";
import { ViewerStage } from "./components/ViewerStage";
import { AppTopbar } from "./components/AppTopbar";
import { useManualLayoutHistory } from "./hooks/useManualLayoutHistory";
import { useUiOverlays } from "./hooks/useUiOverlays";
import { useTopbarPanels } from "./hooks/useTopbarPanels";
import { useLayoutSampleSave } from "./hooks/useLayoutSampleSave";
import { UI_SCALE_MAX, UI_SCALE_MIN, UI_ZOOM_MAX, UI_ZOOM_MIN, useUiScale } from "./hooks/useUiScale";
import { useAppLabels } from "./hooks/useAppLabels";
import { useUpdateCheck } from "./hooks/useUpdateCheck";
import { useWorkflowActions } from "./hooks/useWorkflowActions";
import { useAppLanguage } from "./hooks/useAppLanguage";
import { useManualUndoRedoShortcuts } from "./hooks/useManualUndoRedoShortcuts";
import { useAppWorkflowState } from "./hooks/useAppWorkflowState";
import { usePickFolderPath } from "./hooks/usePickFolderPath";
import { useAppSampleDatabaseBindings } from "./hooks/useAppSampleDatabaseBindings";
import { useAppLayoutBindings } from "./hooks/useAppLayoutBindings";
import "./App.css";

const MANUAL_HISTORY_LIMIT = 200;
const RELEASES_PAGE_URL = (import.meta.env.VITE_RELEASES_PAGE_URL as string | undefined)?.trim()
  || "https://github.com/null-t-maker/Pallet-o-Crates/releases";

function App() {
  const {
    pallet,
    setPallet,
    cartons,
    setCartons,
    result,
    setResult,
    workflowMode,
    setWorkflowMode,
    visibleLayers,
    setVisibleLayers,
    palletGenerationOpen,
    setPalletGenerationOpen,
  } = useAppWorkflowState();
  const {
    manualCartons,
    applyManualCartons,
    clearManualLayout,
    undoManualEdit,
    redoManualEdit,
  } = useManualLayoutHistory(MANUAL_HISTORY_LIMIT);
  const { uiScale, setUiScale, uiZoom, setUiZoom } = useUiScale();
  const uiOverlays = useUiOverlays();
  const {
    windowSize,
    capturingShortcutTarget,
    setCapturingShortcutTarget,
  } = uiOverlays;
  const topbarPanels = useTopbarPanels({
    viewportWidth: windowSize.width,
    zoomFactor: uiZoom,
    onClearTransientState: () => setCapturingShortcutTarget(null),
  });
  const { closeWorkflowPanel } = topbarPanels;
  const {
    updateCheckModalOpen,
    openUpdateCheckModal,
    closeUpdateCheckModal,
    handleConfirmUpdateCheck,
  } = useUpdateCheck({ releasesPageUrl: RELEASES_PAGE_URL });
  const { language, setLanguage, t } = useAppLanguage();
  const pickFolderPath = usePickFolderPath();

  useManualUndoRedoShortcuts({
    workflowMode,
    capturingShortcutTarget,
    undoManualEdit,
    redoManualEdit,
  });

  const labels = useAppLabels({ t, workflowMode });
  const sampleDatabase = useAppSampleDatabaseBindings({
    pallet,
    cartons,
    t,
    labels,
    pickFolderPath,
  });

  const sampleSave = useLayoutSampleSave({
    workflowMode,
    pallet,
    cartons,
    result,
    manualCartons,
    pickFolderPath,
    sampleFolderNotSelectedLabel: labels.sampleFolderNotSelectedLabel,
    sampleSavedPrefix: labels.sampleSavedPrefix,
    sampleSaveFailedPrefix: labels.sampleSaveFailedPrefix,
  });

  const {
    switchWorkflowMode,
    handleCalculate,
    handleGenerateManualAgain,
    handleGenerateManualMore,
    handleManualCartonUpdate,
  } = useWorkflowActions({
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
    sampleGuidance: sampleDatabase.sampleGuidance,
    sampleTemplateLockEnabled: sampleDatabase.sampleTemplateLockEnabled,
    templateLockCandidate: sampleDatabase.templateLockCandidate,
    setSampleTemplateLockStatus: sampleDatabase.setSampleTemplateLockStatus,
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
    uiOverlays,
    setUiScale,
    setUiZoom,
    pallet,
    setPallet,
    cartons,
    setCartons,
    result,
    manualCartons,
    handleManualCartonUpdate,
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
    handleGenerateManualAgain,
    handleGenerateManualMore,
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
    </div>
  );
}

export default App;
