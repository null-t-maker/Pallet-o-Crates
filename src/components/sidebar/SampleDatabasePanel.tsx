import React from "react";
import { SectionPanel } from "./SectionPanel";
import { SampleDatabaseFolderControls } from "./SampleDatabaseFolderControls";
import { SampleGuidanceControls } from "./SampleGuidanceControls";
import { SampleDatabaseStatusBlock } from "./SampleDatabaseStatusBlock";
import { ToggleField } from "./sampleGuidanceControlsPrimitives";
import type { SampleDatabasePanelProps } from "./sampleDatabasePanelTypes";
export type { SampleDatabasePanelProps } from "./sampleDatabasePanelTypes";

export const SampleDatabasePanel: React.FC<SampleDatabasePanelProps> = ({
  title,
  collapsed,
  onToggle,
  folderLabel,
  folderPath,
  folderNotSelectedLabel,
  chooseFolderLabel,
  reloadLabel,
  onChooseFolder,
  onReload,
  loading,
  summaryPrefix,
  scanningLabel,
  summary,
  error,
  guidanceSummary,
  guidanceEnabled,
  onGuidanceEnabledChange,
  guidanceModeLabel,
  guidanceModeOnLabel,
  guidanceModeOffLabel,
  guidanceStrengthPercent,
  onGuidanceStrengthPercentChange,
  guidanceStrengthLabel,
  guidanceCfgScalePercent,
  onGuidanceCfgScalePercentChange,
  guidanceCfgScaleLabel,
  guidanceSteps,
  onGuidanceStepsChange,
  guidanceStepsLabel,
  guidanceSeed,
  onGuidanceSeedChange,
  guidanceSeedLabel,
  guidanceFilter,
  onGuidanceFilterChange,
  guidanceFilterLabel,
  guidanceFilterAllLabel,
  guidanceFilterDimsLabel,
  guidanceFilterShapeLabel,
  guidanceFilterExactLabel,
  templateLockEnabled,
  onTemplateLockEnabledChange,
  templateLockLabel,
  templateLockOnLabel,
  templateLockOffLabel,
}) => {
  return (
    <SectionPanel
      title={title}
      collapsed={collapsed}
      onToggle={onToggle}
      className="dropdown-section"
    >
      <SampleDatabaseFolderControls
        folderLabel={folderLabel}
        folderPath={folderPath}
        folderNotSelectedLabel={folderNotSelectedLabel}
        chooseFolderLabel={chooseFolderLabel}
        reloadLabel={reloadLabel}
        onChooseFolder={onChooseFolder}
        onReload={onReload}
        loading={loading}
      />

      <SampleGuidanceControls
        guidanceEnabled={guidanceEnabled}
        onGuidanceEnabledChange={onGuidanceEnabledChange}
        guidanceModeLabel={guidanceModeLabel}
        guidanceModeOnLabel={guidanceModeOnLabel}
        guidanceModeOffLabel={guidanceModeOffLabel}
        guidanceStrengthPercent={guidanceStrengthPercent}
        onGuidanceStrengthPercentChange={onGuidanceStrengthPercentChange}
        guidanceStrengthLabel={guidanceStrengthLabel}
        guidanceCfgScalePercent={guidanceCfgScalePercent}
        onGuidanceCfgScalePercentChange={onGuidanceCfgScalePercentChange}
        guidanceCfgScaleLabel={guidanceCfgScaleLabel}
        guidanceSteps={guidanceSteps}
        onGuidanceStepsChange={onGuidanceStepsChange}
        guidanceStepsLabel={guidanceStepsLabel}
        guidanceSeed={guidanceSeed}
        onGuidanceSeedChange={onGuidanceSeedChange}
        guidanceSeedLabel={guidanceSeedLabel}
        guidanceFilter={guidanceFilter}
        onGuidanceFilterChange={onGuidanceFilterChange}
        guidanceFilterLabel={guidanceFilterLabel}
        guidanceFilterAllLabel={guidanceFilterAllLabel}
        guidanceFilterDimsLabel={guidanceFilterDimsLabel}
        guidanceFilterShapeLabel={guidanceFilterShapeLabel}
        guidanceFilterExactLabel={guidanceFilterExactLabel}
      />

      {typeof templateLockEnabled === "boolean" && onTemplateLockEnabledChange && (
        <ToggleField
          label={templateLockLabel}
          enabled={templateLockEnabled}
          onChange={onTemplateLockEnabledChange}
          onLabel={templateLockOnLabel}
          offLabel={templateLockOffLabel}
          marginTop={10}
        />
      )}

      <SampleDatabaseStatusBlock
        error={error}
        loading={loading}
        scanningLabel={scanningLabel}
        summary={summary}
        summaryPrefix={summaryPrefix}
        guidanceSummary={guidanceSummary}
      />
    </SectionPanel>
  );
};
