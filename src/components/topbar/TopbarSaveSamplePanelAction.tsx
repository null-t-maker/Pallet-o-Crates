import { SaveSamplePanelContent } from "./TopbarPanelContent";
import { TopbarActionWithPanel } from "./TopbarActionWithPanel";
import type { TopbarCorePanelsProps } from "./TopbarCorePanels.types";

type TopbarSaveSamplePanelActionProps = Pick<
  TopbarCorePanelsProps,
  | "t"
  | "topbarPanels"
  | "sampleSave"
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
>;

export function TopbarSaveSamplePanelAction({
  t,
  topbarPanels,
  sampleSave,
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
}: TopbarSaveSamplePanelActionProps) {
  return (
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
  );
}
