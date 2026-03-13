import { useCallback } from "react";
import type { Language, Translations } from "../i18n";
import type { WorkflowMode } from "../components/Visualizer";
import type { AppLabels } from "./useAppLabels";
import type { UseTopbarPanelsResult } from "./useTopbarPanels";
import type { UseUiOverlaysResult } from "./useUiOverlays";
import type { UseLayoutSampleSaveResult } from "./useLayoutSampleSave";
import type { UseLayoutSampleLoadResult } from "./useLayoutSampleLoad";
import { useAppTopbarProps } from "./useAppTopbarProps";
import { DEFAULT_SAMPLE_DATABASE_PANEL_VISIBLE } from "./settingsPanelDefaults";

interface UseAppTopbarBindingsArgs {
  t: Translations;
  labels: AppLabels;
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  palletGenerationOpen: boolean;
  setPalletGenerationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openUpdateCheckModal: () => void;
  workflowMode: WorkflowMode;
  switchWorkflowMode: (mode: WorkflowMode) => void;
  topbarPanels: UseTopbarPanelsResult;
  sampleSave: UseLayoutSampleSaveResult;
  sampleLoad: UseLayoutSampleLoadResult;
  uiOverlays: UseUiOverlaysResult;
  setUiScale: (value: number) => void;
  setUiZoom: (value: number) => void;
}

export function useAppTopbarBindings({
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
}: UseAppTopbarBindingsArgs) {
  const restoreUiAccessDefaults = useCallback(() => {
    setUiScale(1);
    setUiZoom(1);
    uiOverlays.setSampleDatabasePanelVisible(DEFAULT_SAMPLE_DATABASE_PANEL_VISIBLE);
    uiOverlays.closeUiAccess();
  }, [setUiScale, setUiZoom, uiOverlays]);

  const togglePalletGeneration = useCallback(() => {
    setPalletGenerationOpen((prev) => !prev);
  }, [setPalletGenerationOpen]);

  const refreshApp = useCallback(() => {
    window.location.reload();
  }, []);

  const toggleSampleDatabasePanelVisible = useCallback(() => {
    uiOverlays.setSampleDatabasePanelVisible((prev) => !prev);
  }, [uiOverlays]);

  return useAppTopbarProps({
    t,
    language,
    setLanguage,
    palletGenerationOpen,
    togglePalletGeneration,
    refreshApp,
    openUpdateCheckModal,
    workflowMode,
    switchWorkflowMode,
    topbarPanels,
    sampleSave,
    sampleLoad,
    settings: {
      settingsDirty: uiOverlays.settingsDirty,
      saveSettings: uiOverlays.saveSettings,
      capturingShortcutTarget: uiOverlays.capturingShortcutTarget,
      setCapturingShortcutTarget: uiOverlays.setCapturingShortcutTarget,
      uiAccessShortcutDraft: uiOverlays.uiAccessShortcutDraft,
      diagnosticsShortcutDraft: uiOverlays.diagnosticsShortcutDraft,
      uiAccessOpen: uiOverlays.uiAccessOpen,
      diagnosticsOpen: uiOverlays.diagnosticsOpen,
      sampleDatabasePanelVisible: uiOverlays.sampleDatabasePanelVisible,
      toggleUiAccess: uiOverlays.toggleUiAccess,
      toggleDiagnostics: uiOverlays.toggleDiagnostics,
      toggleSampleDatabasePanelVisible,
      restoreUiAccessDefaults,
    },
    labels,
  });
}
