import type { TemplateLockCandidate } from "./sampleIntelligenceLogic";
import {
  SAMPLE_GUIDANCE_CFG_SCALE_MAX,
  SAMPLE_GUIDANCE_CFG_SCALE_MIN,
  SAMPLE_GUIDANCE_STEPS_MAX,
  SAMPLE_GUIDANCE_STEPS_MIN,
  SAMPLE_GUIDANCE_STRENGTH_MAX,
  SAMPLE_GUIDANCE_STRENGTH_MIN,
} from "./sampleIntelligenceLogic";
import type { UseSampleIntelligenceArgs, UseSampleIntelligenceResult } from "./sampleIntelligenceTypes";
import { useSampleIntelligenceDerivations } from "./useSampleIntelligenceDerivations";
import { useSampleIntelligenceState } from "./useSampleIntelligenceState";
import { useSampleDatabaseScanner } from "./useSampleDatabaseScanner";

export {
  SAMPLE_GUIDANCE_CFG_SCALE_MAX,
  SAMPLE_GUIDANCE_CFG_SCALE_MIN,
  SAMPLE_GUIDANCE_STEPS_MAX,
  SAMPLE_GUIDANCE_STEPS_MIN,
  SAMPLE_GUIDANCE_STRENGTH_MAX,
  SAMPLE_GUIDANCE_STRENGTH_MIN,
};
export type { TemplateLockCandidate };

export function useSampleIntelligence({
  pallet,
  cartons,
}: UseSampleIntelligenceArgs): UseSampleIntelligenceResult {
  const {
    sampleDatabaseFolderPath,
    setSampleDatabaseFolderPath,
    sampleDatabaseData,
    setSampleDatabaseData,
    sampleDatabaseLoading,
    setSampleDatabaseLoading,
    sampleDatabaseError,
    setSampleDatabaseError,
    sampleGuidanceEnabled,
    setSampleGuidanceEnabled,
    sampleTemplateLockEnabled,
    setSampleTemplateLockEnabled,
    sampleGuidanceStrengthPercent,
    setSampleGuidanceStrengthPercent,
    sampleGuidanceCfgScalePercent,
    setSampleGuidanceCfgScalePercent,
    sampleGuidanceSteps,
    setSampleGuidanceSteps,
    sampleGuidanceSeed,
    setSampleGuidanceSeed,
    sampleGuidanceFilter,
    setSampleGuidanceFilter,
    sampleTemplateLockStatus,
    setSampleTemplateLockStatus,
  } = useSampleIntelligenceState();
  const { scanSampleDatabaseFolder } = useSampleDatabaseScanner({
    sampleDatabaseFolderPath,
    setSampleDatabaseData,
    setSampleDatabaseLoading,
    setSampleDatabaseError,
  });
  const { templateLockCandidate, sampleGuidance } = useSampleIntelligenceDerivations({
    cartons,
    pallet,
    sampleDatabaseData,
    sampleGuidanceEnabled,
    sampleGuidanceFilter,
    sampleGuidanceStrengthPercent,
    sampleGuidanceCfgScalePercent,
    sampleGuidanceSteps,
    sampleGuidanceSeed,
    sampleTemplateLockEnabled,
    sampleDatabaseFolderPath,
    setSampleTemplateLockStatus,
  });

  return {
    sampleDatabaseFolderPath,
    setSampleDatabaseFolderPath,
    sampleDatabaseData,
    sampleDatabaseLoading,
    sampleDatabaseError,
    setSampleDatabaseError,
    sampleGuidanceEnabled,
    setSampleGuidanceEnabled,
    sampleTemplateLockEnabled,
    setSampleTemplateLockEnabled,
    sampleGuidanceStrengthPercent,
    setSampleGuidanceStrengthPercent,
    sampleGuidanceCfgScalePercent,
    setSampleGuidanceCfgScalePercent,
    sampleGuidanceSteps,
    setSampleGuidanceSteps,
    sampleGuidanceSeed,
    setSampleGuidanceSeed,
    sampleGuidanceFilter,
    setSampleGuidanceFilter,
    sampleTemplateLockStatus,
    setSampleTemplateLockStatus,
    templateLockCandidate,
    sampleGuidance,
    scanSampleDatabaseFolder,
  };
}
