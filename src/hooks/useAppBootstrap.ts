import { useManualLayoutHistory } from "./useManualLayoutHistory";
import { useUiOverlays } from "./useUiOverlays";
import { useTopbarPanels } from "./useTopbarPanels";
import { useUiScale } from "./useUiScale";
import { useUpdateCheck } from "./useUpdateCheck";
import { useAppLanguage } from "./useAppLanguage";
import { useManualUndoRedoShortcuts } from "./useManualUndoRedoShortcuts";
import { useAppWorkflowState } from "./useAppWorkflowState";
import { usePickFolderPath } from "./usePickFolderPath";

const MANUAL_HISTORY_LIMIT = 200;

interface UseAppBootstrapArgs {
  releasesPageUrl: string;
}

export function useAppBootstrap({
  releasesPageUrl,
}: UseAppBootstrapArgs) {
  const workflowState = useAppWorkflowState();
  const manualHistory = useManualLayoutHistory(MANUAL_HISTORY_LIMIT);
  const uiScaleState = useUiScale();
  const uiOverlays = useUiOverlays();
  const topbarPanels = useTopbarPanels({
    viewportWidth: uiOverlays.windowSize.width,
    zoomFactor: uiScaleState.uiZoom,
    onClearTransientState: () => uiOverlays.setCapturingShortcutTarget(null),
  });
  const updateCheck = useUpdateCheck({ releasesPageUrl });
  const languageState = useAppLanguage();
  const pickFolderPath = usePickFolderPath();

  useManualUndoRedoShortcuts({
    workflowMode: workflowState.workflowMode,
    capturingShortcutTarget: uiOverlays.capturingShortcutTarget,
    undoManualEdit: manualHistory.undoManualEdit,
    redoManualEdit: manualHistory.redoManualEdit,
  });

  return {
    workflowState,
    manualHistory,
    uiScaleState,
    uiOverlays,
    topbarPanels,
    updateCheck,
    languageState,
    pickFolderPath,
  };
}
