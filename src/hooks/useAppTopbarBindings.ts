import { useCallback } from "react";
import type { Language, Translations } from "../i18n";
import type { WorkflowMode } from "../components/Visualizer";
import type { AppLabels } from "./useAppLabels";
import type { UseTopbarPanelsResult } from "./useTopbarPanels";
import type { UseUiOverlaysResult } from "./useUiOverlays";
import type { UseLayoutSampleSaveResult } from "./useLayoutSampleSave";
import { useAppTopbarProps } from "./useAppTopbarProps";

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
  uiOverlays,
  setUiScale,
  setUiZoom,
}: UseAppTopbarBindingsArgs) {
  const restoreUiAccessDefaults = useCallback(() => {
    setUiScale(1);
    setUiZoom(1);
    uiOverlays.closeUiAccess();
  }, [setUiScale, setUiZoom, uiOverlays]);

  const togglePalletGeneration = useCallback(() => {
    setPalletGenerationOpen((prev) => !prev);
  }, [setPalletGenerationOpen]);

  const refreshApp = useCallback(() => {
    window.location.reload();
  }, []);

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
    settings: {
      settingsDirty: uiOverlays.settingsDirty,
      saveSettings: uiOverlays.saveSettings,
      capturingShortcutTarget: uiOverlays.capturingShortcutTarget,
      setCapturingShortcutTarget: uiOverlays.setCapturingShortcutTarget,
      uiAccessShortcutDraft: uiOverlays.uiAccessShortcutDraft,
      diagnosticsShortcutDraft: uiOverlays.diagnosticsShortcutDraft,
      uiAccessOpen: uiOverlays.uiAccessOpen,
      diagnosticsOpen: uiOverlays.diagnosticsOpen,
      toggleUiAccess: uiOverlays.toggleUiAccess,
      toggleDiagnostics: uiOverlays.toggleDiagnostics,
      restoreUiAccessDefaults,
    },
    labels,
  });
}
