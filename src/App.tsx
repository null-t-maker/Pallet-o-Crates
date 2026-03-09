import { Sidebar } from "./components/Sidebar";
import { ViewerStage } from "./components/ViewerStage";
import { AppTopbar } from "./components/AppTopbar";
import { useLayoutSampleSave } from "./hooks/useLayoutSampleSave";
import { UI_SCALE_MAX, UI_SCALE_MIN, UI_ZOOM_MAX, UI_ZOOM_MIN } from "./hooks/useUiScale";
import { useAppLabels } from "./hooks/useAppLabels";
import { useWorkflowActions } from "./hooks/useWorkflowActions";
import { useAppSampleDatabaseBindings } from "./hooks/useAppSampleDatabaseBindings";
import { useAppLayoutBindings } from "./hooks/useAppLayoutBindings";
import { useAppBootstrap } from "./hooks/useAppBootstrap";
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
  const { pallet, setPallet, cartons, setCartons, result, setResult, workflowMode, setWorkflowMode, visibleLayers, setVisibleLayers, palletGenerationOpen, setPalletGenerationOpen } = workflowState;
  const { manualCartons, applyManualCartons, clearManualLayout } = manualHistory;
  const { updateCheckModalOpen, openUpdateCheckModal, closeUpdateCheckModal, handleConfirmUpdateCheck } = updateCheck;

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
