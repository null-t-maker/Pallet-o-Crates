import type { SampleGuidanceFilter } from "../../lib/packer";

export interface SampleDatabaseSummary {
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  firstDescriptors: string[];
}

export interface SampleDatabasePanelProps {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  folderLabel: string;
  folderPath: string;
  folderNotSelectedLabel: string;
  chooseFolderLabel: string;
  reloadLabel: string;
  onChooseFolder?: () => void;
  onReload?: () => void;
  loading: boolean;
  summaryPrefix: string;
  scanningLabel: string;
  summary: SampleDatabaseSummary | null;
  error: string | null;
  guidanceSummary?: string;
  guidanceEnabled?: boolean;
  onGuidanceEnabledChange?: (enabled: boolean) => void;
  guidanceModeLabel: string;
  guidanceModeOnLabel: string;
  guidanceModeOffLabel: string;
  guidanceStrengthPercent?: number;
  onGuidanceStrengthPercentChange?: (value: number) => void;
  guidanceStrengthLabel: string;
  guidanceCfgScalePercent?: number;
  onGuidanceCfgScalePercentChange?: (value: number) => void;
  guidanceCfgScaleLabel: string;
  guidanceSteps?: number;
  onGuidanceStepsChange?: (value: number) => void;
  guidanceStepsLabel: string;
  guidanceSeed?: number;
  onGuidanceSeedChange?: (value: number) => void;
  guidanceSeedLabel: string;
  guidanceFilter?: SampleGuidanceFilter;
  onGuidanceFilterChange?: (value: SampleGuidanceFilter) => void;
  guidanceFilterLabel: string;
  guidanceFilterAllLabel: string;
  guidanceFilterDimsLabel: string;
  guidanceFilterShapeLabel: string;
  guidanceFilterExactLabel: string;
  templateLockEnabled?: boolean;
  onTemplateLockEnabledChange?: (enabled: boolean) => void;
  templateLockLabel: string;
  templateLockOnLabel: string;
  templateLockOffLabel: string;
}
