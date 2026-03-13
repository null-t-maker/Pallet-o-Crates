import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Translations } from "../../../i18n";
import type { SampleSavePackingStyle } from "../../../lib/layoutSamples";
import { MenuSelect } from "../../MenuSelect";
import type { SampleLoadControls, SampleSaveControls } from "../topbarPanelTypes";

interface SaveSamplePanelContentProps {
  t: Translations;
  sampleSave: SampleSaveControls;
  sampleLoad: SampleLoadControls;
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
}

export function SaveSamplePanelContent({
  t,
  sampleSave,
  sampleLoad,
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
}: SaveSamplePanelContentProps) {
  const [saveSectionCollapsed, setSaveSectionCollapsed] = useState(false);
  const [loadSectionCollapsed, setLoadSectionCollapsed] = useState(false);

  return (
    <div className="section-body save-sample-panel-body">
      <div className="save-sample-sections">
        <section className="section-card settings-section-card">
          <button
            type="button"
            className="section-titlebar settings-section-toggle"
            onClick={() => setSaveSectionCollapsed((prev) => !prev)}
            aria-expanded={!saveSectionCollapsed}
          >
            <span className="section-title" title={saveLayoutSampleLabel}>{saveLayoutSampleLabel}</span>
            <span className="section-arrow">
              {saveSectionCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>
          {!saveSectionCollapsed && (
            <div className="section-body settings-section-body">
              <div className="settings-field">
                <label>{sampleFolderLabel}</label>
                <button
                  type="button"
                  className="outline layout-sample-action-btn"
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

              {sampleSave.saveSampleBlockedReason && (
                <p
                  className="save-sample-status save-sample-status-error"
                  title={sampleSave.saveSampleBlockedReason}
                >
                  {sampleSave.saveSampleBlockedReason}
                </p>
              )}

              <button
                type="button"
                className="settings-save-btn"
                onClick={sampleSave.handleSaveLayoutSample}
                disabled={sampleSave.saveSampleBusy || !sampleSave.sampleSaveFolderPath || !!sampleSave.saveSampleBlockedReason}
              >
                {sampleSave.saveSampleBusy ? sampleSavingLabel : sampleSaveActionLabel}
              </button>
            </div>
          )}
        </section>

        <section className="section-card settings-section-card">
          <button
            type="button"
            className="section-titlebar settings-section-toggle"
            onClick={() => setLoadSectionCollapsed((prev) => !prev)}
            aria-expanded={!loadSectionCollapsed}
          >
            <span className="section-title" title={loadLayoutSampleLabel}>{loadLayoutSampleLabel}</span>
            <span className="section-arrow">
              {loadSectionCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>
          {!loadSectionCollapsed && (
            <div className="section-body settings-section-body">
              <div className="settings-field">
                <label>{sampleFolderLabel}</label>
                <button
                  type="button"
                  className="outline layout-sample-action-btn"
                  onClick={sampleLoad.handleChooseSampleLoadFolder}
                  disabled={sampleLoad.sampleLoadBusy}
                >
                  {sampleLoad.sampleLoadFolderPath ? sampleChangeFolderLabel : sampleChooseFolderLabel}
                </button>
                <button
                  type="button"
                  className="outline layout-sample-action-btn"
                  onClick={sampleLoad.handleReloadSampleLoadFolder}
                  disabled={!sampleLoad.sampleLoadFolderPath || sampleLoad.sampleLoadScanning || sampleLoad.sampleLoadBusy}
                >
                  {sampleReloadFolderLabel}
                </button>
                <p
                  className="save-sample-folder-path"
                  title={sampleLoad.sampleLoadFolderPath || sampleFolderNotSelectedLabel}
                >
                  {sampleLoad.sampleLoadFolderPath || sampleFolderNotSelectedLabel}
                </p>
              </div>

              <div className="settings-field">
                <label>{sampleLoadFileLabel}</label>
                <MenuSelect
                  value={sampleLoad.sampleLoadSelectedFilePath}
                  onChange={(value) => sampleLoad.setSampleLoadSelectedFilePath(value)}
                  ariaLabel={sampleLoadFileLabel}
                  options={sampleLoad.sampleLoadOptions}
                  searchable
                  disabled={sampleLoad.sampleLoadScanning || !sampleLoad.sampleLoadHasOptions}
                />
              </div>

              {sampleLoad.sampleLoadFolderError && (
                <p
                  className="save-sample-status save-sample-status-error"
                  title={sampleLoad.sampleLoadFolderError}
                >
                  {sampleLoad.sampleLoadFolderError}
                </p>
              )}

              {sampleLoad.sampleLoadStatus && (
                <p
                  className={`save-sample-status save-sample-status-${sampleLoad.sampleLoadStatus.kind}`}
                  title={sampleLoad.sampleLoadStatus.message}
                >
                  {sampleLoad.sampleLoadStatus.message}
                </p>
              )}

              <button
                type="button"
                className="settings-save-btn"
                onClick={sampleLoad.handleLoadLayoutSample}
                disabled={
                  sampleLoad.sampleLoadBusy
                  || sampleLoad.sampleLoadScanning
                  || !sampleLoad.sampleLoadFolderPath
                  || !sampleLoad.sampleLoadHasOptions
                  || !sampleLoad.sampleLoadSelectedFilePath
                }
              >
                {sampleLoad.sampleLoadBusy ? sampleLoadingLabel : sampleLoadActionLabel}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
