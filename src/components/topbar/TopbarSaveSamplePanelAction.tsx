import { SaveSamplePanelContent } from "./TopbarPanelContent";
import { TopbarActionWithPanel } from "./TopbarActionWithPanel";
import type { TopbarCorePanelsProps } from "./TopbarCorePanels.types";

type TopbarSaveSamplePanelActionProps = Pick<
  TopbarCorePanelsProps,
  | "t"
  | "topbarPanels"
  | "sampleSave"
  | "sampleLoad"
  | "layoutSamplesLabel"
  | "saveLayoutSampleLabel"
  | "loadLayoutSampleLabel"
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
  | "sampleLoadFileLabel"
  | "sampleReloadFolderLabel"
  | "sampleLoadActionLabel"
  | "sampleLoadingLabel"
>;

export function TopbarSaveSamplePanelAction({
  t,
  topbarPanels,
  sampleSave,
  sampleLoad,
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
  sampleLoadFileLabel,
  sampleReloadFolderLabel,
  sampleLoadActionLabel,
  sampleLoadingLabel,
}: TopbarSaveSamplePanelActionProps) {
  return (
    <TopbarActionWithPanel
      wrapperClassName="topbar-save-sample-wrap"
      navRef={topbarPanels.saveSampleNavRef}
      isOpen={topbarPanels.saveSampleOpen}
      title={layoutSamplesLabel}
      onToggle={topbarPanels.toggleSaveSampleOpen}
      dropdownClassName="save-sample-dropdown"
      dropdownStyle={topbarPanels.saveSampleDropdownStyle}
    >
      <SaveSamplePanelContent
        t={t}
        sampleSave={sampleSave}
        sampleLoad={sampleLoad}
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
    </TopbarActionWithPanel>
  );
}
