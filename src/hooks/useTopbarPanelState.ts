import { useState } from "react";
import type { UseTopbarPanelStateArgs, UseTopbarPanelStateResult } from "./topbarPanelStateTypes";
import { useTopbarPanelStateActions } from "./useTopbarPanelStateActions";

export function useTopbarPanelState({
  onClearTransientState,
}: UseTopbarPanelStateArgs): UseTopbarPanelStateResult {
  const [workflowPanelOpen, setWorkflowPanelOpen] = useState(false);
  const [saveSampleOpen, setSaveSampleOpen] = useState(false);
  const [languagePanelOpen, setLanguagePanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    toggleWorkflowPanel,
    toggleSaveSampleOpen,
    toggleLanguagePanel,
    toggleSettingsOpen,
    closeWorkflowPanel,
    closeSaveSamplePanel,
    closeLanguagePanel,
    closeSettingsPanel,
  } = useTopbarPanelStateActions({
    onClearTransientState,
    setWorkflowPanelOpen,
    setSaveSampleOpen,
    setLanguagePanelOpen,
    setSettingsOpen,
  });

  return {
    workflowPanelOpen,
    saveSampleOpen,
    languagePanelOpen,
    settingsOpen,
    setWorkflowPanelOpen,
    setSaveSampleOpen,
    setLanguagePanelOpen,
    setSettingsOpen,
    toggleWorkflowPanel,
    toggleSaveSampleOpen,
    toggleLanguagePanel,
    toggleSettingsOpen,
    closeWorkflowPanel,
    closeSaveSamplePanel,
    closeLanguagePanel,
    closeSettingsPanel,
  };
}
