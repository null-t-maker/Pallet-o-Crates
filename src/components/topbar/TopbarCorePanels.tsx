import { TopbarLanguagePanelAction } from "./TopbarLanguagePanelAction";
import { TopbarSaveSamplePanelAction } from "./TopbarSaveSamplePanelAction";
import { TopbarSettingsPanelAction } from "./TopbarSettingsPanelAction";
import type { TopbarCorePanelsProps } from "./TopbarCorePanels.types";
import { TopbarWorkflowPanelAction } from "./TopbarWorkflowPanelAction";

export function TopbarCorePanels({
  t,
  language,
  setLanguage,
  workflowMode,
  switchWorkflowMode,
  topbarPanels,
  sampleSave,
  settings,
  workflowLabel,
  currentWorkflowLabel,
  workflowGenerationLabel,
  workflowManualLabel,
  layoutSamplesLabel,
  saveLayoutSampleLabel,
  loadLayoutSampleLabel,
  sampleFolderLabel,
  sampleChooseFolderLabel,
  sampleChangeFolderLabel,
  sampleFolderNotSelectedLabel,
  sampleNameLabel,
  sampleNamePlaceholder,
  sampleStrategyLabel,
  sampleStrategyBothLabel,
  sampleSaveActionLabel,
  sampleSavingLabel,
  sampleLoad,
  sampleLoadFileLabel,
  sampleReloadFolderLabel,
  sampleLoadActionLabel,
  sampleLoadingLabel,
  languageLabel,
  settingsLabel,
  settingsSaveLabel,
  settingsRestoreDefaultsLabel,
  uiZoomAndScaleLabel,
  shortcutActivationLabel,
  shortcutPressLabel,
  uiAccessOpenLabel,
  uiAccessCloseLabel,
}: TopbarCorePanelsProps) {
  return (
    <>
      <TopbarWorkflowPanelAction
        topbarPanels={topbarPanels}
        workflowLabel={workflowLabel}
        currentWorkflowLabel={currentWorkflowLabel}
        workflowMode={workflowMode}
        switchWorkflowMode={switchWorkflowMode}
        workflowGenerationLabel={workflowGenerationLabel}
        workflowManualLabel={workflowManualLabel}
      />

      <TopbarSaveSamplePanelAction
        t={t}
        topbarPanels={topbarPanels}
        sampleSave={sampleSave}
        sampleLoad={sampleLoad}
        layoutSamplesLabel={layoutSamplesLabel}
        saveLayoutSampleLabel={saveLayoutSampleLabel}
        loadLayoutSampleLabel={loadLayoutSampleLabel}
        sampleFolderLabel={sampleFolderLabel}
        sampleChooseFolderLabel={sampleChooseFolderLabel}
        sampleChangeFolderLabel={sampleChangeFolderLabel}
        sampleFolderNotSelectedLabel={sampleFolderNotSelectedLabel}
        sampleNameLabel={sampleNameLabel}
        sampleNamePlaceholder={sampleNamePlaceholder}
        sampleStrategyLabel={sampleStrategyLabel}
        sampleStrategyBothLabel={sampleStrategyBothLabel}
        sampleSaveActionLabel={sampleSaveActionLabel}
        sampleSavingLabel={sampleSavingLabel}
        sampleLoadFileLabel={sampleLoadFileLabel}
        sampleReloadFolderLabel={sampleReloadFolderLabel}
        sampleLoadActionLabel={sampleLoadActionLabel}
        sampleLoadingLabel={sampleLoadingLabel}
      />

      <div className="topbar-actions-spacer" aria-hidden="true" />

      <TopbarLanguagePanelAction
        t={t}
        language={language}
        setLanguage={setLanguage}
        topbarPanels={topbarPanels}
        languageLabel={languageLabel}
      />

      <TopbarSettingsPanelAction
        t={t}
        settings={settings}
        topbarPanels={topbarPanels}
        settingsLabel={settingsLabel}
        settingsSaveLabel={settingsSaveLabel}
        settingsRestoreDefaultsLabel={settingsRestoreDefaultsLabel}
        uiZoomAndScaleLabel={uiZoomAndScaleLabel}
        shortcutActivationLabel={shortcutActivationLabel}
        shortcutPressLabel={shortcutPressLabel}
        uiAccessOpenLabel={uiAccessOpenLabel}
        uiAccessCloseLabel={uiAccessCloseLabel}
      />
    </>
  );
}
