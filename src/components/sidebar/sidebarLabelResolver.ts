interface SidebarLabelInputs {
  sampleDatabaseLabel?: string;
  sampleDatabaseFolderLabel?: string;
  sampleDatabaseChooseFolderLabel?: string;
  sampleDatabaseReloadLabel?: string;
  sampleDatabaseScanningLabel?: string;
  sampleDatabaseSummaryPrefix?: string;
  sampleDatabaseFolderNotSelectedLabel?: string;
  sampleGuidanceModeLabel?: string;
  sampleGuidanceModeOnLabel?: string;
  sampleGuidanceModeOffLabel?: string;
  sampleGuidanceStrengthLabel?: string;
  sampleGuidanceCfgScaleLabel?: string;
  sampleGuidanceStepsLabel?: string;
  sampleGuidanceSeedLabel?: string;
  sampleGuidanceFilterLabel?: string;
  sampleGuidanceFilterAllLabel?: string;
  sampleGuidanceFilterDimsLabel?: string;
  sampleGuidanceFilterShapeLabel?: string;
  sampleGuidanceFilterExactLabel?: string;
  sampleTemplateLockLabel?: string;
  sampleTemplateLockOnLabel?: string;
  sampleTemplateLockOffLabel?: string;
}

export function resolveSidebarLabels(labels: SidebarLabelInputs): {
  sampleDatabaseLabel: string;
  sampleDatabaseFolderLabel: string;
  sampleDatabaseChooseFolderLabel: string;
  sampleDatabaseReloadLabel: string;
  sampleDatabaseScanningLabel: string;
  sampleDatabaseSummaryPrefix: string;
  sampleDatabaseFolderNotSelectedLabel: string;
  sampleGuidanceModeLabel: string;
  sampleGuidanceModeOnLabel: string;
  sampleGuidanceModeOffLabel: string;
  sampleGuidanceStrengthLabel: string;
  sampleGuidanceCfgScaleLabel: string;
  sampleGuidanceStepsLabel: string;
  sampleGuidanceSeedLabel: string;
  sampleGuidanceFilterLabel: string;
  sampleGuidanceFilterAllLabel: string;
  sampleGuidanceFilterDimsLabel: string;
  sampleGuidanceFilterShapeLabel: string;
  sampleGuidanceFilterExactLabel: string;
  sampleTemplateLockLabel: string;
  sampleTemplateLockOnLabel: string;
  sampleTemplateLockOffLabel: string;
} {
  return {
    sampleDatabaseLabel: labels.sampleDatabaseLabel ?? "Sample database",
    sampleDatabaseFolderLabel: labels.sampleDatabaseFolderLabel ?? "Sample database folder",
    sampleDatabaseChooseFolderLabel: labels.sampleDatabaseChooseFolderLabel ?? "Choose folder",
    sampleDatabaseReloadLabel: labels.sampleDatabaseReloadLabel ?? "Reload",
    sampleDatabaseScanningLabel: labels.sampleDatabaseScanningLabel ?? "Scanning sample database...",
    sampleDatabaseSummaryPrefix: labels.sampleDatabaseSummaryPrefix ?? "JSON samples",
    sampleDatabaseFolderNotSelectedLabel: labels.sampleDatabaseFolderNotSelectedLabel ?? "No folder selected",
    sampleGuidanceModeLabel: labels.sampleGuidanceModeLabel ?? "Guidance switch",
    sampleGuidanceModeOnLabel: labels.sampleGuidanceModeOnLabel ?? "On",
    sampleGuidanceModeOffLabel: labels.sampleGuidanceModeOffLabel ?? "Off",
    sampleGuidanceStrengthLabel: labels.sampleGuidanceStrengthLabel ?? "Guidance strength",
    sampleGuidanceCfgScaleLabel: labels.sampleGuidanceCfgScaleLabel ?? "Guidance CFG scale",
    sampleGuidanceStepsLabel: labels.sampleGuidanceStepsLabel ?? "Guidance steps",
    sampleGuidanceSeedLabel: labels.sampleGuidanceSeedLabel ?? "Guidance seed",
    sampleGuidanceFilterLabel: labels.sampleGuidanceFilterLabel ?? "Sample filter",
    sampleGuidanceFilterAllLabel: labels.sampleGuidanceFilterAllLabel ?? "All",
    sampleGuidanceFilterDimsLabel: labels.sampleGuidanceFilterDimsLabel ?? "Dims only",
    sampleGuidanceFilterShapeLabel: labels.sampleGuidanceFilterShapeLabel ?? "Shape match",
    sampleGuidanceFilterExactLabel: labels.sampleGuidanceFilterExactLabel ?? "Exact match",
    sampleTemplateLockLabel: labels.sampleTemplateLockLabel ?? "Template lock",
    sampleTemplateLockOnLabel: labels.sampleTemplateLockOnLabel ?? "On",
    sampleTemplateLockOffLabel: labels.sampleTemplateLockOffLabel ?? "Off",
  };
}
