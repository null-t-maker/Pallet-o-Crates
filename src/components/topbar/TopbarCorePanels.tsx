import {
  LanguagePanelContent,
  SaveSamplePanelContent,
  SettingsPanelContent,
  WorkflowPanelContent,
} from "./TopbarPanelContent";
import type { AppTopbarProps } from "./AppTopbar.types";
import { TopbarActionWithPanel } from "./TopbarActionWithPanel";

type TopbarCorePanelsProps = Pick<
  AppTopbarProps,
  | "t"
  | "language"
  | "setLanguage"
  | "workflowMode"
  | "switchWorkflowMode"
  | "topbarPanels"
  | "sampleSave"
  | "settings"
  | "workflowLabel"
  | "currentWorkflowLabel"
  | "workflowGenerationLabel"
  | "workflowManualLabel"
  | "saveLayoutSampleLabel"
  | "sampleFolderLabel"
  | "sampleChooseFolderLabel"
  | "sampleChangeFolderLabel"
  | "sampleFolderNotSelectedLabel"
  | "sampleNameLabel"
  | "sampleNamePlaceholder"
  | "sampleStrategyLabel"
  | "sampleStrategyBothLabel"
  | "sampleSaveActionLabel"
  | "sampleSavingLabel"
  | "languageLabel"
  | "settingsLabel"
  | "settingsSaveLabel"
  | "settingsRestoreDefaultsLabel"
  | "uiZoomAndScaleLabel"
  | "shortcutActivationLabel"
  | "shortcutPressLabel"
  | "uiAccessOpenLabel"
  | "uiAccessCloseLabel"
>;

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
  saveLayoutSampleLabel,
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
      <TopbarActionWithPanel
        wrapperClassName="topbar-workflow-wrap"
        navRef={topbarPanels.workflowNavRef}
        isOpen={topbarPanels.workflowPanelOpen}
        title={workflowLabel}
        onToggle={topbarPanels.toggleWorkflowPanel}
        dropdownClassName="workflow-dropdown"
        dropdownStyle={topbarPanels.workflowDropdownStyle}
        buttonContent={<span className="topbar-action-label" title={workflowLabel}>{workflowLabel}: {currentWorkflowLabel}</span>}
      >
        <WorkflowPanelContent
          workflowMode={workflowMode}
          switchWorkflowMode={switchWorkflowMode}
          workflowGenerationLabel={workflowGenerationLabel}
          workflowManualLabel={workflowManualLabel}
        />
      </TopbarActionWithPanel>

      <TopbarActionWithPanel
        wrapperClassName="topbar-save-sample-wrap"
        navRef={topbarPanels.saveSampleNavRef}
        isOpen={topbarPanels.saveSampleOpen}
        title={saveLayoutSampleLabel}
        onToggle={topbarPanels.toggleSaveSampleOpen}
        dropdownClassName="save-sample-dropdown"
        dropdownStyle={topbarPanels.saveSampleDropdownStyle}
      >
        <SaveSamplePanelContent
          t={t}
          sampleSave={sampleSave}
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
        />
      </TopbarActionWithPanel>

      <div className="topbar-actions-spacer" aria-hidden="true" />

      <TopbarActionWithPanel
        wrapperClassName="topbar-language-wrap"
        navRef={topbarPanels.languageNavRef}
        isOpen={topbarPanels.languagePanelOpen}
        title={languageLabel}
        onToggle={topbarPanels.toggleLanguagePanel}
        dropdownClassName="language-dropdown"
        dropdownStyle={topbarPanels.languageDropdownStyle}
      >
        <LanguagePanelContent
          language={language}
          setLanguage={setLanguage}
          t={t}
        />
      </TopbarActionWithPanel>

      <TopbarActionWithPanel
        wrapperClassName="topbar-settings-wrap"
        navRef={topbarPanels.settingsNavRef}
        isOpen={topbarPanels.settingsOpen}
        title={settingsLabel}
        onToggle={topbarPanels.toggleSettingsOpen}
        dropdownClassName="settings-dropdown"
        dropdownStyle={topbarPanels.settingsDropdownStyle}
      >
        <SettingsPanelContent
          t={t}
          settings={settings}
          settingsSaveLabel={settingsSaveLabel}
          settingsRestoreDefaultsLabel={settingsRestoreDefaultsLabel}
          uiZoomAndScaleLabel={uiZoomAndScaleLabel}
          shortcutActivationLabel={shortcutActivationLabel}
          shortcutPressLabel={shortcutPressLabel}
          uiAccessOpenLabel={uiAccessOpenLabel}
          uiAccessCloseLabel={uiAccessCloseLabel}
        />
      </TopbarActionWithPanel>
    </>
  );
}
