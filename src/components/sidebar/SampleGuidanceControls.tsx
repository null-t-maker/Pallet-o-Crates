import React from "react";
import {
  FilterField,
  NumberField,
  RangeField,
  ToggleField,
} from "./sampleGuidanceControlsPrimitives";
import type { SampleGuidanceControlsProps } from "./sampleGuidanceControlsTypes";

export const SampleGuidanceControls: React.FC<SampleGuidanceControlsProps> = ({
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
}) => {
  const guidanceDisabled = guidanceEnabled === false;

  return (
    <>
      {typeof guidanceEnabled === "boolean" && onGuidanceEnabledChange && (
        <ToggleField
          label={guidanceModeLabel}
          enabled={guidanceEnabled}
          onChange={onGuidanceEnabledChange}
          onLabel={guidanceModeOnLabel}
          offLabel={guidanceModeOffLabel}
          marginTop={10}
        />
      )}

      {guidanceFilter && onGuidanceFilterChange && (
        <FilterField
          label={guidanceFilterLabel}
          value={guidanceFilter}
          onChange={onGuidanceFilterChange}
          allLabel={guidanceFilterAllLabel}
          dimsLabel={guidanceFilterDimsLabel}
          shapeLabel={guidanceFilterShapeLabel}
          exactLabel={guidanceFilterExactLabel}
          disabled={guidanceDisabled}
        />
      )}

      {typeof guidanceStrengthPercent === "number" && onGuidanceStrengthPercentChange && (
        <RangeField
          label={guidanceStrengthLabel}
          min={10}
          max={100}
          step={5}
          value={Math.round(guidanceStrengthPercent)}
          onChange={onGuidanceStrengthPercentChange}
          displayValue={`${Math.round(guidanceStrengthPercent)}%`}
          disabled={guidanceDisabled}
        />
      )}

      {typeof guidanceCfgScalePercent === "number" && onGuidanceCfgScalePercentChange && (
        <RangeField
          label={guidanceCfgScaleLabel}
          min={25}
          max={300}
          step={5}
          value={Math.round(guidanceCfgScalePercent)}
          onChange={onGuidanceCfgScalePercentChange}
          displayValue={`${Math.round(guidanceCfgScalePercent)}%`}
          disabled={guidanceDisabled}
        />
      )}

      {typeof guidanceSteps === "number" && onGuidanceStepsChange && (
        <RangeField
          label={guidanceStepsLabel}
          min={1}
          max={16}
          step={1}
          value={Math.round(guidanceSteps)}
          onChange={onGuidanceStepsChange}
          displayValue={`${Math.round(guidanceSteps)}`}
          disabled={guidanceDisabled}
        />
      )}

      {typeof guidanceSeed === "number" && onGuidanceSeedChange && (
        <NumberField
          label={guidanceSeedLabel}
          value={Math.trunc(guidanceSeed)}
          onChange={onGuidanceSeedChange}
          disabled={guidanceDisabled}
        />
      )}
    </>
  );
};
