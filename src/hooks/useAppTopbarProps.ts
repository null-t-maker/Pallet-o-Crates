import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { WorkflowMode } from "../components/Visualizer";
import type { AppTopbarProps, TopbarPanels } from "../components/topbar/AppTopbar.types";
import type { SampleSaveControls, SettingsControls } from "../components/topbar/topbarPanelTypes";
import type { Language, Translations } from "../i18n";
import type { AppLabels } from "./useAppLabels";

interface UseAppTopbarPropsArgs {
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
  settings: SettingsControls;
  labels: AppLabels;
}

export function useAppTopbarProps({
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
  settings,
  labels,
}: UseAppTopbarPropsArgs): AppTopbarProps {
  return useMemo(() => ({
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
    settings,
    refreshAppLabel: labels.refreshAppLabel,
    updateCheckTitle: labels.updateCheckTitle,
    palletPanelLabel: labels.palletPanelLabel,
    workflowLabel: labels.workflowLabel,
    currentWorkflowLabel: labels.currentWorkflowLabel,
    workflowGenerationLabel: labels.workflowGenerationLabel,
    workflowManualLabel: labels.workflowManualLabel,
    saveLayoutSampleLabel: labels.saveLayoutSampleLabel,
    sampleFolderLabel: labels.sampleFolderLabel,
    sampleChooseFolderLabel: labels.sampleChooseFolderLabel,
    sampleChangeFolderLabel: labels.sampleChangeFolderLabel,
    sampleFolderNotSelectedLabel: labels.sampleFolderNotSelectedLabel,
    sampleNameLabel: labels.sampleNameLabel,
    sampleNamePlaceholder: labels.sampleNamePlaceholder,
    sampleStrategyLabel: labels.sampleStrategyLabel,
    sampleStrategyBothLabel: labels.sampleStrategyBothLabel,
    sampleSaveActionLabel: labels.sampleSaveActionLabel,
    sampleSavingLabel: labels.sampleSavingLabel,
    languageLabel: labels.languageLabel,
    settingsLabel: labels.settingsLabel,
    settingsSaveLabel: labels.settingsSaveLabel,
    settingsRestoreDefaultsLabel: labels.settingsRestoreDefaultsLabel,
    uiZoomAndScaleLabel: labels.uiZoomAndScaleLabel,
    shortcutActivationLabel: labels.shortcutActivationLabel,
    shortcutPressLabel: labels.shortcutPressLabel,
    uiAccessOpenLabel: labels.uiAccessOpenLabel,
    uiAccessCloseLabel: labels.uiAccessCloseLabel,
  }), [
    language,
    labels,
    openUpdateCheckModal,
    palletGenerationOpen,
    refreshApp,
    sampleSave,
    setLanguage,
    settings,
    switchWorkflowMode,
    t,
    togglePalletGeneration,
    topbarPanels,
    workflowMode,
  ]);
}
