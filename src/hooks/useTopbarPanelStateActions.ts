import { useCallback } from "react";
import type {
  UseTopbarPanelStateActionsArgs,
  UseTopbarPanelStateResult,
} from "./topbarPanelStateTypes";

type TopbarPanelActions = Pick<
  UseTopbarPanelStateResult,
  | "toggleWorkflowPanel"
  | "toggleSaveSampleOpen"
  | "toggleLanguagePanel"
  | "toggleSettingsOpen"
  | "closeWorkflowPanel"
  | "closeSaveSamplePanel"
  | "closeLanguagePanel"
  | "closeSettingsPanel"
>;

export function useTopbarPanelStateActions({
  onClearTransientState,
  setWorkflowPanelOpen,
  setSaveSampleOpen,
  setLanguagePanelOpen,
  setSettingsOpen,
}: UseTopbarPanelStateActionsArgs): TopbarPanelActions {
  const closeWorkflowPanel = useCallback(() => {
    setWorkflowPanelOpen(false);
  }, [setWorkflowPanelOpen]);

  const closeSaveSamplePanel = useCallback(() => {
    setSaveSampleOpen(false);
  }, [setSaveSampleOpen]);

  const closeLanguagePanel = useCallback(() => {
    setLanguagePanelOpen(false);
  }, [setLanguagePanelOpen]);

  const closeSettingsPanel = useCallback(() => {
    setSettingsOpen(false);
    onClearTransientState?.();
  }, [onClearTransientState, setSettingsOpen]);

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
  }, [onClearTransientState, setLanguagePanelOpen, setSaveSampleOpen, setSettingsOpen, setWorkflowPanelOpen]);

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
  }, [onClearTransientState, setLanguagePanelOpen, setSaveSampleOpen, setSettingsOpen, setWorkflowPanelOpen]);

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
  }, [onClearTransientState, setLanguagePanelOpen, setSaveSampleOpen, setSettingsOpen, setWorkflowPanelOpen]);

  const toggleSaveSampleOpen = useCallback(() => {
    setWorkflowPanelOpen(false);
    setLanguagePanelOpen(false);
    setSettingsOpen(false);
    onClearTransientState?.();
    setSaveSampleOpen((prev) => !prev);
  }, [onClearTransientState, setLanguagePanelOpen, setSaveSampleOpen, setSettingsOpen, setWorkflowPanelOpen]);

  return {
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
