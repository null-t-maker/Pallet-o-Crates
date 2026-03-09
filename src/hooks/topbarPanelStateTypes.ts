export interface UseTopbarPanelStateArgs {
  onClearTransientState?: () => void;
}

export interface UseTopbarPanelStateResult {
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

export interface UseTopbarPanelStateActionsArgs extends UseTopbarPanelStateArgs {
  setWorkflowPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveSampleOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setLanguagePanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
