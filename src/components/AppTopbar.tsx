import type { AppTopbarProps } from "./topbar/AppTopbar.types";
import { TopbarCorePanels } from "./topbar/TopbarCorePanels";
import { TopbarPalletToggleButton } from "./topbar/TopbarPalletToggleButton";
import { TopbarBrand } from "./topbar/TopbarPrimitives";

export function AppTopbar({
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
  refreshAppLabel,
  updateCheckTitle,
  palletPanelLabel,
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
}: AppTopbarProps) {
  return (
    <header className="topbar">
      <TopbarBrand
        refreshAppLabel={refreshAppLabel}
        refreshApp={refreshApp}
        updateCheckTitle={updateCheckTitle}
        openUpdateCheckModal={openUpdateCheckModal}
        appTagline={t.appTagline}
      />

      <div className="topbar-actions">
        <TopbarPalletToggleButton
          palletGenerationOpen={palletGenerationOpen}
          togglePalletGeneration={togglePalletGeneration}
          palletPanelLabel={palletPanelLabel}
        />
        <TopbarCorePanels
          t={t}
          language={language}
          setLanguage={setLanguage}
          workflowMode={workflowMode}
          switchWorkflowMode={switchWorkflowMode}
          topbarPanels={topbarPanels}
          sampleSave={sampleSave}
          settings={settings}
          workflowLabel={workflowLabel}
          currentWorkflowLabel={currentWorkflowLabel}
          workflowGenerationLabel={workflowGenerationLabel}
          workflowManualLabel={workflowManualLabel}
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
          sampleLoad={sampleLoad}
          sampleLoadFileLabel={sampleLoadFileLabel}
          sampleReloadFolderLabel={sampleReloadFolderLabel}
          sampleLoadActionLabel={sampleLoadActionLabel}
          sampleLoadingLabel={sampleLoadingLabel}
          languageLabel={languageLabel}
          settingsLabel={settingsLabel}
          settingsSaveLabel={settingsSaveLabel}
          settingsRestoreDefaultsLabel={settingsRestoreDefaultsLabel}
          uiZoomAndScaleLabel={uiZoomAndScaleLabel}
          shortcutActivationLabel={shortcutActivationLabel}
          shortcutPressLabel={shortcutPressLabel}
          uiAccessOpenLabel={uiAccessOpenLabel}
          uiAccessCloseLabel={uiAccessCloseLabel}
        />
      </div>
    </header>
  );
}
