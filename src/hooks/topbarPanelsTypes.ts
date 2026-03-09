import type { CSSProperties } from "react";

export interface UseTopbarPanelsArgs {
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
