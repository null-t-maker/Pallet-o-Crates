import { type CSSProperties, useMemo, useRef } from "react";
import { computeTopbarDropdownStyle } from "./topbarPanelStyle";
import { useTopbarOutsideClose } from "./useTopbarOutsideClose";
import { useTopbarPanelState } from "./useTopbarPanelState";

interface UseTopbarPanelsArgs {
  viewportWidth: number;
  zoomFactor: number;
  onClearTransientState?: () => void;
}

export interface UseTopbarPanelsResult {
  workflowPanelOpen: boolean;
  saveSampleOpen: boolean;
  languagePanelOpen: boolean;
  settingsOpen: boolean;
  workflowNavRef: React.MutableRefObject<HTMLDivElement | null>;
  saveSampleNavRef: React.MutableRefObject<HTMLDivElement | null>;
  languageNavRef: React.MutableRefObject<HTMLDivElement | null>;
  settingsNavRef: React.MutableRefObject<HTMLDivElement | null>;
  toggleWorkflowPanel: () => void;
  toggleSaveSampleOpen: () => void;
  toggleLanguagePanel: () => void;
  toggleSettingsOpen: () => void;
  closeWorkflowPanel: () => void;
  closeSaveSamplePanel: () => void;
  closeLanguagePanel: () => void;
  closeSettingsPanel: () => void;
  workflowDropdownStyle: CSSProperties | undefined;
  saveSampleDropdownStyle: CSSProperties | undefined;
  languageDropdownStyle: CSSProperties | undefined;
  settingsDropdownStyle: CSSProperties | undefined;
}

export function useTopbarPanels({
  viewportWidth,
  zoomFactor,
  onClearTransientState,
}: UseTopbarPanelsArgs): UseTopbarPanelsResult {
  const workflowNavRef = useRef<HTMLDivElement | null>(null);
  const saveSampleNavRef = useRef<HTMLDivElement | null>(null);
  const languageNavRef = useRef<HTMLDivElement | null>(null);
  const settingsNavRef = useRef<HTMLDivElement | null>(null);

  const {
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
  } = useTopbarPanelState({ onClearTransientState });

  useTopbarOutsideClose({
    workflowPanelOpen,
    saveSampleOpen,
    languagePanelOpen,
    settingsOpen,
    workflowNavRef,
    saveSampleNavRef,
    languageNavRef,
    settingsNavRef,
    setWorkflowPanelOpen,
    setSaveSampleOpen,
    setLanguagePanelOpen,
    setSettingsOpen,
    onClearTransientState,
  });

  const workflowDropdownStyle = useMemo(
    () => (workflowPanelOpen
      ? computeTopbarDropdownStyle(workflowNavRef.current, viewportWidth, 320, zoomFactor)
      : undefined),
    [viewportWidth, workflowPanelOpen, zoomFactor],
  );
  const saveSampleDropdownStyle = useMemo(
    () => (saveSampleOpen
      ? computeTopbarDropdownStyle(saveSampleNavRef.current, viewportWidth, 420, zoomFactor)
      : undefined),
    [saveSampleOpen, viewportWidth, zoomFactor],
  );
  const languageDropdownStyle = useMemo(
    () => (languagePanelOpen
      ? computeTopbarDropdownStyle(languageNavRef.current, viewportWidth, 470, zoomFactor)
      : undefined),
    [languagePanelOpen, viewportWidth, zoomFactor],
  );
  const settingsDropdownStyle = useMemo(
    () => (settingsOpen
      ? computeTopbarDropdownStyle(settingsNavRef.current, viewportWidth, 340, zoomFactor)
      : undefined),
    [settingsOpen, viewportWidth, zoomFactor],
  );

  return {
    workflowPanelOpen,
    saveSampleOpen,
    languagePanelOpen,
    settingsOpen,
    workflowNavRef,
    saveSampleNavRef,
    languageNavRef,
    settingsNavRef,
    toggleWorkflowPanel,
    toggleSaveSampleOpen,
    toggleLanguagePanel,
    toggleSettingsOpen,
    closeWorkflowPanel,
    closeSaveSamplePanel,
    closeLanguagePanel,
    closeSettingsPanel,
    workflowDropdownStyle,
    saveSampleDropdownStyle,
    languageDropdownStyle,
    settingsDropdownStyle,
  };
}
