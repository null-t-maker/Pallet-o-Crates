import type { Dispatch, SetStateAction } from "react";
import type { Language, Translations } from "../../i18n";
import type { UseTopbarPanelsResult } from "../../hooks/useTopbarPanels";
import type { WorkflowMode } from "../Visualizer";
import type { SampleLoadControls, SampleSaveControls, SettingsControls } from "./topbarPanelTypes";

export type TopbarPanels = Pick<
  UseTopbarPanelsResult,
  | "workflowPanelOpen"
  | "saveSampleOpen"
  | "languagePanelOpen"
  | "settingsOpen"
  | "workflowNavRef"
  | "saveSampleNavRef"
  | "languageNavRef"
  | "settingsNavRef"
  | "toggleWorkflowPanel"
  | "toggleSaveSampleOpen"
  | "toggleLanguagePanel"
  | "toggleSettingsOpen"
  | "workflowDropdownStyle"
  | "saveSampleDropdownStyle"
  | "languageDropdownStyle"
  | "settingsDropdownStyle"
>;

export interface AppTopbarProps {
  t: Translations;
  language: Language;
  setLanguage: Dispatch<SetStateAction<Language>>;
  palletGenerationOpen: boolean;
  togglePalletGeneration: () => void;
  refreshApp: () => void;
  openUpdateCheckModal: () => void;
  workflowMode: WorkflowMode;
  switchWorkflowMode: (mode: WorkflowMode) => void;
  topbarPanels: TopbarPanels;
  sampleSave: SampleSaveControls;
  sampleLoad: SampleLoadControls;
  settings: SettingsControls;
  refreshAppLabel: string;
  updateCheckTitle: string;
  palletPanelLabel: string;
  workflowLabel: string;
  currentWorkflowLabel: string;
  workflowGenerationLabel: string;
  workflowManualLabel: string;
  layoutSamplesLabel: string;
  saveLayoutSampleLabel: string;
  loadLayoutSampleLabel: string;
  sampleFolderLabel: string;
  sampleChooseFolderLabel: string;
  sampleChangeFolderLabel: string;
  sampleFolderNotSelectedLabel: string;
  sampleNameLabel: string;
  sampleNamePlaceholder: string;
  sampleStrategyLabel: string;
  sampleStrategyBothLabel: string;
  sampleSaveActionLabel: string;
  sampleSavingLabel: string;
  sampleLoadFileLabel: string;
  sampleReloadFolderLabel: string;
  sampleLoadActionLabel: string;
  sampleLoadingLabel: string;
  languageLabel: string;
  settingsLabel: string;
  settingsSaveLabel: string;
  settingsRestoreDefaultsLabel: string;
  uiZoomAndScaleLabel: string;
  shortcutActivationLabel: string;
  shortcutPressLabel: string;
  uiAccessOpenLabel: string;
  uiAccessCloseLabel: string;
}
