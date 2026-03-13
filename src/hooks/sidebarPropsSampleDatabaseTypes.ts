import type { WorkflowMode } from "../components/Visualizer";
import type { SidebarProps } from "../components/Sidebar";
import type { SampleGuidanceFilter } from "../lib/packer";
import type { AppLabels } from "./useAppLabels";

export type SampleDatabaseSidebarBindings = Pick<
  SidebarProps,
  | "showSampleDatabaseSection"
  | "sampleDatabaseFolderPath"
  | "sampleDatabaseSummary"
  | "sampleDatabaseLoading"
  | "sampleDatabaseError"
  | "onChooseSampleDatabaseFolder"
  | "onReloadSampleDatabase"
  | "sampleDatabaseLabel"
  | "sampleDatabaseFolderLabel"
  | "sampleDatabaseChooseFolderLabel"
  | "sampleDatabaseReloadLabel"
  | "sampleDatabaseScanningLabel"
  | "sampleDatabaseSummaryPrefix"
  | "sampleDatabaseFolderNotSelectedLabel"
  | "sampleDatabaseGuidanceSummary"
  | "sampleGuidanceEnabled"
  | "onSampleGuidanceEnabledChange"
  | "sampleGuidanceModeLabel"
  | "sampleGuidanceModeOnLabel"
  | "sampleGuidanceModeOffLabel"
  | "sampleGuidanceStrengthPercent"
  | "onSampleGuidanceStrengthPercentChange"
  | "sampleGuidanceStrengthLabel"
  | "sampleGuidanceCfgScalePercent"
  | "onSampleGuidanceCfgScalePercentChange"
  | "sampleGuidanceCfgScaleLabel"
  | "sampleGuidanceSteps"
  | "onSampleGuidanceStepsChange"
  | "sampleGuidanceStepsLabel"
  | "sampleGuidanceSeed"
  | "onSampleGuidanceSeedChange"
  | "sampleGuidanceSeedLabel"
  | "sampleGuidanceFilter"
  | "onSampleGuidanceFilterChange"
  | "sampleGuidanceFilterLabel"
  | "sampleGuidanceFilterAllLabel"
  | "sampleGuidanceFilterDimsLabel"
  | "sampleGuidanceFilterShapeLabel"
  | "sampleGuidanceFilterExactLabel"
  | "sampleTemplateLockEnabled"
  | "onSampleTemplateLockEnabledChange"
  | "sampleTemplateLockLabel"
  | "sampleTemplateLockOnLabel"
  | "sampleTemplateLockOffLabel"
>;

export interface BuildSampleDatabaseSidebarBindingsArgs {
  workflowMode: WorkflowMode;
  sampleDatabasePanelVisible: boolean;
  sampleDatabaseFolderPath: string;
  sampleDatabaseSummary: SidebarProps["sampleDatabaseSummary"];
  sampleDatabaseLoading: boolean;
  sampleDatabaseError: string | null;
  handleChooseSampleDatabaseFolder: () => Promise<void>;
  handleReloadSampleDatabase: () => void;
  sampleDatabaseStatusSummaryText: string;
  sampleGuidanceEnabled: boolean;
  setSampleGuidanceEnabled: (enabled: boolean) => void;
  sampleGuidanceStrengthPercent: number;
  setSampleGuidanceStrengthPercent: (value: number) => void;
  sampleGuidanceCfgScalePercent: number;
  handleSampleGuidanceCfgScalePercentChange: (value: number) => void;
  sampleGuidanceSteps: number;
  handleSampleGuidanceStepsChange: (value: number) => void;
  sampleGuidanceSeed: number;
  handleSampleGuidanceSeedChange: (value: number) => void;
  sampleGuidanceFilter: SampleGuidanceFilter;
  setSampleGuidanceFilter: (value: SampleGuidanceFilter) => void;
  sampleTemplateLockEnabled: boolean;
  setSampleTemplateLockEnabled: (enabled: boolean) => void;
  labels: AppLabels;
}
