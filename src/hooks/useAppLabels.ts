import { useMemo } from "react";
import { resolveTranslation } from "../i18n";

interface UseAppLabelsArgs {
  t: ReturnType<typeof resolveTranslation>;
  workflowMode: "generation" | "manual";
}

export function useAppLabels({ t, workflowMode }: UseAppLabelsArgs) {
  return useMemo(() => {
    const workflowGenerationLabel = t.workflowModeGeneration ?? "Pallet generation";
    const workflowManualLabel = t.workflowModeManual ?? "Manual layout";

    return {
      windowResolutionLabel: t.windowResolution ?? "Window resolution",
      workflowLabel: t.workflowLabel ?? "Workflow",
      workflowGenerationLabel,
      workflowManualLabel,
      generateCartonsLabel: t.generateCartons ?? "Generate cartons",
      generateMoreCartonsLabel: t.generateMoreCartons ?? "Generate missing cartons",
      generateCartonsAgainLabel: t.generateCartonsAgain ?? "Generate cartons again",
      switchToManualEditingLabel: t.switchToManualEditing ?? "Switch to manual editing",
      palletPanelLabel: t.palletPanelLabel ?? "Pallet panel",
      refreshAppLabel: t.refreshAppLabel ?? "Refresh app",
      languageLabel: t.languageLabel ?? "Language",
      settingsLabel: t.settingsLabel ?? "Settings",
      settingsSaveLabel: t.settingsSaveLabel ?? "Save settings",
      settingsRestoreDefaultsLabel: t.settingsRestoreDefaultsLabel ?? "Restore to default",
      uiZoomAndScaleLabel: t.uiZoomAndScaleLabel ?? "UI Zoom and Scale",
      uiAccessOpenLabel: t.uiAccessOpenLabel ?? "Open",
      uiAccessCloseLabel: t.uiAccessCloseLabel ?? "Close",
      uiScaleLabel: t.uiScaleLabel ?? "UI scale",
      uiZoomLabel: t.uiZoomLabel ?? "UI zoom",
      shortcutActivationLabel: t.shortcutActivationLabel ?? "Activation shortcut",
      shortcutPressLabel: t.shortcutPressLabel ?? "Press shortcut...",
      closeLabel: t.closeLabel ?? "Close",
      closeUiZoomAndScaleLabel: t.closeUiZoomAndScaleLabel ?? "Close UI zoom and scale",
      closeDiagnosticsLabel: t.closeDiagnosticsLabel ?? "Close diagnostics",
      currentWorkflowLabel: workflowMode === "manual" ? workflowManualLabel : workflowGenerationLabel,
      diagnosticsHint: workflowMode === "manual"
        ? (t.diagnosticsHintManual ?? "No diagnostics data yet. Run Generate cartons first.")
        : (t.diagnosticsHintGeneration ?? "No diagnostics data yet. Run Calculate packing first."),
      updateCheckTitle: t.updateCheckTitle ?? "Check for updates",
      updateCheckQuestion: t.updateCheckQuestion ?? "Do you want to check if a newer version was released?",
      updateCheckYesLabel: t.updateCheckYesLabel ?? "Yes",
      updateCheckNoLabel: t.updateCheckNoLabel ?? "No",
      saveLayoutSampleLabel: t.saveLayoutSampleLabel ?? "Save layout sample",
      sampleFolderLabel: t.sampleFolderLabel ?? "Sample folder",
      sampleChooseFolderLabel: t.sampleChooseFolderLabel ?? "Choose folder",
      sampleChangeFolderLabel: t.sampleChangeFolderLabel ?? "Change folder",
      sampleFolderNotSelectedLabel: t.sampleFolderNotSelectedLabel ?? "No folder selected",
      sampleNameLabel: t.sampleNameLabel ?? "Sample name",
      sampleNamePlaceholder: t.sampleNamePlaceholder ?? "e.g. centered_mix_001",
      sampleStrategyLabel: t.sampleStrategyLabel ?? "Layout strategy",
      sampleStrategyBothLabel: t.sampleStrategyBoth ?? "Compatible with both strategies",
      sampleSaveActionLabel: t.sampleSaveActionLabel ?? "Save sample",
      sampleSavingLabel: t.sampleSavingLabel ?? "Saving...",
      sampleSavedPrefix: t.sampleSavedPrefix ?? "Saved sample:",
      sampleSaveFailedPrefix: t.sampleSaveFailedPrefix ?? "Save failed:",
      sampleDatabaseLabel: t.sampleDatabaseLabel ?? "Sample database",
      sampleDatabaseFolderLabel: t.sampleDatabaseFolderLabel ?? "Sample database folder",
      sampleDatabaseChooseFolderLabel: t.sampleDatabaseChooseFolderLabel ?? "Choose folder",
      sampleDatabaseReloadLabel: t.sampleDatabaseReloadLabel ?? "Reload",
      sampleDatabaseScanningLabel: t.sampleDatabaseScanningLabel ?? "Scanning sample database...",
      sampleDatabaseSummaryPrefix: t.sampleDatabaseSummaryPrefix ?? "JSON samples",
      sampleGuidanceActiveLabel: t.sampleGuidanceActiveLabel ?? "Sample guidance",
      sampleGuidanceCenterLabel: t.sampleGuidanceCenterLabel ?? "compact center",
      sampleGuidanceEdgeLabel: t.sampleGuidanceEdgeLabel ?? "aligned edges",
      sampleGuidanceOffManualLabel: t.sampleGuidanceOffManualLabel ?? "off (manual switch)",
      sampleGuidanceOffNoDirectionalLabel: t.sampleGuidanceOffNoDirectionalLabel ?? "off (no eligible generation samples yet)",
      sampleGuidanceSwitchLabel: t.sampleGuidanceSwitchLabel ?? "Guidance switch",
      sampleGuidanceOnLabel: t.sampleGuidanceOnLabel ?? "On",
      sampleGuidanceOffOptionLabel: t.sampleGuidanceOffOptionLabel ?? "Off",
      sampleGuidanceStrengthLabel: t.sampleGuidanceStrengthLabel ?? "Guidance strength",
      sampleGuidanceCfgScaleLabel: t.sampleGuidanceCfgScaleLabel ?? "Guidance CFG scale",
      sampleGuidanceStepsLabel: t.sampleGuidanceStepsLabel ?? "Guidance steps",
      sampleGuidanceSeedLabel: t.sampleGuidanceSeedLabel ?? "Guidance seed",
      sampleGuidanceFilterLabel: t.sampleGuidanceFilterLabel ?? "Sample filter",
      sampleGuidanceFilterAllLabel: t.sampleGuidanceFilterAllLabel ?? "All",
      sampleGuidanceFilterDimsLabel: t.sampleGuidanceFilterDimsLabel ?? "Dims only",
      sampleGuidanceFilterShapeLabel: t.sampleGuidanceFilterShapeLabel ?? "Shape match",
      sampleGuidanceFilterExactLabel: t.sampleGuidanceFilterExactLabel ?? "Exact match",
      sampleTemplateLockLabel: t.sampleTemplateLockLabel ?? "Template lock",
      sampleTemplateLockOnLabel: t.sampleTemplateLockOnLabel ?? "On",
      sampleTemplateLockOffLabel: t.sampleTemplateLockOffLabel ?? "Off",
      templateLockReadyLabel: t.sampleTemplateLockReadyLabel ?? "Template lock: ready",
      templateLockNoMatchLabel: t.sampleTemplateLockNoMatchLabel ?? "Template lock: no compatible sample",
      templateLockShapeMatchLabel: t.sampleTemplateLockShapeMatchLabel ?? "shape-match",
      templateLockExactMatchLabel: t.sampleTemplateLockExactMatchLabel ?? "exact-match",
    };
  }, [t, workflowMode]);
}

export type AppLabels = ReturnType<typeof useAppLabels>;
