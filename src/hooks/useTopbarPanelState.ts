import { useCallback, useState } from "react";

interface UseTopbarPanelStateArgs {
  onClearTransientState?: () => void;
}

interface UseTopbarPanelStateResult {
  workflowPanelOpen: boolean;
  saveSampleOpen: boolean;
  languagePanelOpen: boolean;
  settingsOpen: boolean;
  setWorkflowPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveSampleOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setLanguagePanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleWorkflowPanel: () => void;
  toggleSaveSampleOpen: () => void;
  toggleLanguagePanel: () => void;
  toggleSettingsOpen: () => void;
  closeWorkflowPanel: () => void;
  closeSaveSamplePanel: () => void;
  closeLanguagePanel: () => void;
  closeSettingsPanel: () => void;
}

export function useTopbarPanelState({
  onClearTransientState,
}: UseTopbarPanelStateArgs): UseTopbarPanelStateResult {
  const [workflowPanelOpen, setWorkflowPanelOpen] = useState(false);
  const [saveSampleOpen, setSaveSampleOpen] = useState(false);
  const [languagePanelOpen, setLanguagePanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const closeWorkflowPanel = useCallback(() => {
    setWorkflowPanelOpen(false);
  }, []);

  const closeSaveSamplePanel = useCallback(() => {
    setSaveSampleOpen(false);
  }, []);

  const closeLanguagePanel = useCallback(() => {
    setLanguagePanelOpen(false);
  }, []);

  const closeSettingsPanel = useCallback(() => {
    setSettingsOpen(false);
    onClearTransientState?.();
  }, [onClearTransientState]);

  const toggleWorkflowPanel = useCallback(() => {
    setWorkflowPanelOpen((prev) => {
      const next = !prev;
      if (next) {
        setSaveSampleOpen(false);
        setLanguagePanelOpen(false);
        setSettingsOpen(false);
        onClearTransientState?.();
      }
      return next;
    });
  }, [onClearTransientState]);

  const toggleLanguagePanel = useCallback(() => {
    setLanguagePanelOpen((prev) => {
      const next = !prev;
      if (next) {
        setWorkflowPanelOpen(false);
        setSaveSampleOpen(false);
        setSettingsOpen(false);
        onClearTransientState?.();
      }
      return next;
    });
  }, [onClearTransientState]);

  const toggleSettingsOpen = useCallback(() => {
    setWorkflowPanelOpen(false);
    setSaveSampleOpen(false);
    setLanguagePanelOpen(false);
    setSettingsOpen((prev) => {
      const next = !prev;
      if (!next) {
        onClearTransientState?.();
      }
      return next;
    });
  }, [onClearTransientState]);

  const toggleSaveSampleOpen = useCallback(() => {
    setWorkflowPanelOpen(false);
    setLanguagePanelOpen(false);
    setSettingsOpen(false);
    onClearTransientState?.();
    setSaveSampleOpen((prev) => !prev);
  }, [onClearTransientState]);

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
