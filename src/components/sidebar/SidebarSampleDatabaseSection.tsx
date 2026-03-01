import type { FC } from "react";
import { SampleDatabasePanel } from "./SampleDatabasePanel";
import type { SidebarSectionsProps } from "./sidebarSectionsTypes";

type SidebarSampleDatabaseSectionProps = Pick<
  SidebarSectionsProps,
  | "showSampleDatabaseSection"
  | "collapsedSections"
  | "toggleSection"
  | "resolvedLabels"
  | "sampleDatabaseFolderPath"
  | "sampleDatabaseSummary"
  | "sampleDatabaseLoading"
  | "sampleDatabaseError"
  | "onChooseSampleDatabaseFolder"
  | "onReloadSampleDatabase"
  | "sampleDatabaseGuidanceSummary"
  | "sampleGuidanceEnabled"
  | "onSampleGuidanceEnabledChange"
  | "sampleGuidanceStrengthPercent"
  | "onSampleGuidanceStrengthPercentChange"
  | "sampleGuidanceCfgScalePercent"
  | "onSampleGuidanceCfgScalePercentChange"
  | "sampleGuidanceSteps"
  | "onSampleGuidanceStepsChange"
  | "sampleGuidanceSeed"
  | "onSampleGuidanceSeedChange"
  | "sampleGuidanceFilter"
  | "onSampleGuidanceFilterChange"
  | "sampleTemplateLockEnabled"
  | "onSampleTemplateLockEnabledChange"
>;

export const SidebarSampleDatabaseSection: FC<SidebarSampleDatabaseSectionProps> = ({
  showSampleDatabaseSection,
  collapsedSections,
  toggleSection,
  resolvedLabels,
  sampleDatabaseFolderPath,
  sampleDatabaseSummary,
  sampleDatabaseLoading,
  sampleDatabaseError,
  onChooseSampleDatabaseFolder,
  onReloadSampleDatabase,
  sampleDatabaseGuidanceSummary,
  sampleGuidanceEnabled,
  onSampleGuidanceEnabledChange,
  sampleGuidanceStrengthPercent,
  onSampleGuidanceStrengthPercentChange,
  sampleGuidanceCfgScalePercent,
  onSampleGuidanceCfgScalePercentChange,
  sampleGuidanceSteps,
  onSampleGuidanceStepsChange,
  sampleGuidanceSeed,
  onSampleGuidanceSeedChange,
  sampleGuidanceFilter,
  onSampleGuidanceFilterChange,
  sampleTemplateLockEnabled,
  onSampleTemplateLockEnabledChange,
}) => {
  if (!showSampleDatabaseSection) return null;

  return (
    <SampleDatabasePanel
      title={resolvedLabels.sampleDatabaseLabel}
      collapsed={collapsedSections.sampleDatabase}
      onToggle={() => toggleSection("sampleDatabase")}
      folderLabel={resolvedLabels.sampleDatabaseFolderLabel}
      folderPath={sampleDatabaseFolderPath || ""}
      folderNotSelectedLabel={resolvedLabels.sampleDatabaseFolderNotSelectedLabel}
      chooseFolderLabel={resolvedLabels.sampleDatabaseChooseFolderLabel}
      reloadLabel={resolvedLabels.sampleDatabaseReloadLabel}
      onChooseFolder={onChooseSampleDatabaseFolder}
      onReload={onReloadSampleDatabase}
      loading={sampleDatabaseLoading}
      summaryPrefix={resolvedLabels.sampleDatabaseSummaryPrefix}
      scanningLabel={resolvedLabels.sampleDatabaseScanningLabel}
      summary={sampleDatabaseSummary}
      error={sampleDatabaseError}
      guidanceSummary={sampleDatabaseGuidanceSummary}
      guidanceEnabled={sampleGuidanceEnabled}
      onGuidanceEnabledChange={onSampleGuidanceEnabledChange}
      guidanceModeLabel={resolvedLabels.sampleGuidanceModeLabel}
      guidanceModeOnLabel={resolvedLabels.sampleGuidanceModeOnLabel}
      guidanceModeOffLabel={resolvedLabels.sampleGuidanceModeOffLabel}
      guidanceStrengthPercent={sampleGuidanceStrengthPercent}
      onGuidanceStrengthPercentChange={onSampleGuidanceStrengthPercentChange}
      guidanceStrengthLabel={resolvedLabels.sampleGuidanceStrengthLabel}
      guidanceCfgScalePercent={sampleGuidanceCfgScalePercent}
      onGuidanceCfgScalePercentChange={onSampleGuidanceCfgScalePercentChange}
      guidanceCfgScaleLabel={resolvedLabels.sampleGuidanceCfgScaleLabel}
      guidanceSteps={sampleGuidanceSteps}
      onGuidanceStepsChange={onSampleGuidanceStepsChange}
      guidanceStepsLabel={resolvedLabels.sampleGuidanceStepsLabel}
      guidanceSeed={sampleGuidanceSeed}
      onGuidanceSeedChange={onSampleGuidanceSeedChange}
      guidanceSeedLabel={resolvedLabels.sampleGuidanceSeedLabel}
      guidanceFilter={sampleGuidanceFilter}
      onGuidanceFilterChange={onSampleGuidanceFilterChange}
      guidanceFilterLabel={resolvedLabels.sampleGuidanceFilterLabel}
      guidanceFilterAllLabel={resolvedLabels.sampleGuidanceFilterAllLabel}
      guidanceFilterDimsLabel={resolvedLabels.sampleGuidanceFilterDimsLabel}
      guidanceFilterShapeLabel={resolvedLabels.sampleGuidanceFilterShapeLabel}
      guidanceFilterExactLabel={resolvedLabels.sampleGuidanceFilterExactLabel}
      templateLockEnabled={sampleTemplateLockEnabled}
      onTemplateLockEnabledChange={onSampleTemplateLockEnabledChange}
      templateLockLabel={resolvedLabels.sampleTemplateLockLabel}
      templateLockOnLabel={resolvedLabels.sampleTemplateLockOnLabel}
      templateLockOffLabel={resolvedLabels.sampleTemplateLockOffLabel}
    />
  );
};
