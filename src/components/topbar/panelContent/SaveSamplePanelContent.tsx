import type { Translations } from "../../../i18n";
import type { SampleSavePackingStyle } from "../../../lib/layoutSamples";
import { MenuSelect } from "../../MenuSelect";
import type { SampleSaveControls } from "../topbarPanelTypes";

interface SaveSamplePanelContentProps {
  t: Translations;
  sampleSave: SampleSaveControls;
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
}

export function SaveSamplePanelContent({
  t,
  sampleSave,
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
}: SaveSamplePanelContentProps) {
  return (
    <div className="section-body save-sample-panel-body">
      <div className="settings-field">
        <label>{sampleFolderLabel}</label>
        <button
          type="button"
          className="settings-shortcut-btn"
          onClick={sampleSave.handleChooseSampleSaveFolder}
        >
          {sampleSave.sampleSaveFolderPath ? sampleChangeFolderLabel : sampleChooseFolderLabel}
        </button>
        <p
          className="save-sample-folder-path"
          title={sampleSave.sampleSaveFolderPath || sampleFolderNotSelectedLabel}
        >
          {sampleSave.sampleSaveFolderPath || sampleFolderNotSelectedLabel}
        </p>
      </div>

      <div className="settings-field">
        <label>{sampleNameLabel}</label>
        <input
          type="text"
          className="save-sample-text-input"
          value={sampleSave.sampleSaveName}
          onChange={(event) => sampleSave.setSampleSaveName(event.target.value)}
          placeholder={sampleNamePlaceholder}
        />
      </div>

      <div className="settings-field">
        <label>{sampleStrategyLabel}</label>
        <MenuSelect
          value={sampleSave.sampleSavePackingStyle}
          onChange={(value) => sampleSave.setSampleSavePackingStyle(value as SampleSavePackingStyle)}
          ariaLabel={sampleStrategyLabel}
          options={[
            { value: "centerCompact", label: t.packingStyleCenterCompact },
            { value: "both", label: sampleStrategyBothLabel },
            { value: "edgeAligned", label: t.packingStyleEdgeAligned },
          ]}
        />
      </div>

      {sampleSave.saveSampleStatus && (
        <p
          className={`save-sample-status save-sample-status-${sampleSave.saveSampleStatus.kind}`}
          title={sampleSave.saveSampleStatus.message}
        >
          {sampleSave.saveSampleStatus.message}
        </p>
      )}

      <button
        type="button"
        className="settings-save-btn"
        onClick={sampleSave.handleSaveLayoutSample}
        disabled={sampleSave.saveSampleBusy || !sampleSave.sampleSaveFolderPath}
      >
        {sampleSave.saveSampleBusy ? sampleSavingLabel : sampleSaveActionLabel}
      </button>
    </div>
  );
}
