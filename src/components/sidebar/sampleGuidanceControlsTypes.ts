import type { SampleGuidanceFilter } from "../../lib/packer";

export interface SampleGuidanceControlsProps {
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
}
