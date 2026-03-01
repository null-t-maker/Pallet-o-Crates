import { resolveSidebarLabels } from "./sidebarLabelResolver";
import type { SidebarProps } from "./sidebarTypes";
import type { ResolvedSidebarLabels } from "./sidebarPropsMappingTypes";

export function resolveSidebarLabelsFromProps(props: SidebarProps): ResolvedSidebarLabels {
  return resolveSidebarLabels({
    sampleDatabaseLabel: props.sampleDatabaseLabel,
    sampleDatabaseFolderLabel: props.sampleDatabaseFolderLabel,
    sampleDatabaseChooseFolderLabel: props.sampleDatabaseChooseFolderLabel,
    sampleDatabaseReloadLabel: props.sampleDatabaseReloadLabel,
    sampleDatabaseScanningLabel: props.sampleDatabaseScanningLabel,
    sampleDatabaseSummaryPrefix: props.sampleDatabaseSummaryPrefix,
    sampleDatabaseFolderNotSelectedLabel: props.sampleDatabaseFolderNotSelectedLabel,
    sampleGuidanceModeLabel: props.sampleGuidanceModeLabel,
    sampleGuidanceModeOnLabel: props.sampleGuidanceModeOnLabel,
    sampleGuidanceModeOffLabel: props.sampleGuidanceModeOffLabel,
    sampleGuidanceStrengthLabel: props.sampleGuidanceStrengthLabel,
    sampleGuidanceCfgScaleLabel: props.sampleGuidanceCfgScaleLabel,
    sampleGuidanceStepsLabel: props.sampleGuidanceStepsLabel,
    sampleGuidanceSeedLabel: props.sampleGuidanceSeedLabel,
    sampleGuidanceFilterLabel: props.sampleGuidanceFilterLabel,
    sampleGuidanceFilterAllLabel: props.sampleGuidanceFilterAllLabel,
    sampleGuidanceFilterDimsLabel: props.sampleGuidanceFilterDimsLabel,
    sampleGuidanceFilterShapeLabel: props.sampleGuidanceFilterShapeLabel,
    sampleGuidanceFilterExactLabel: props.sampleGuidanceFilterExactLabel,
    sampleTemplateLockLabel: props.sampleTemplateLockLabel,
    sampleTemplateLockOnLabel: props.sampleTemplateLockOnLabel,
    sampleTemplateLockOffLabel: props.sampleTemplateLockOffLabel,
  });
}
