import { useCallback, useMemo } from "react";
import {
  SAMPLE_GUIDANCE_CFG_SCALE_MAX,
  SAMPLE_GUIDANCE_CFG_SCALE_MIN,
  SAMPLE_GUIDANCE_STEPS_MAX,
  SAMPLE_GUIDANCE_STEPS_MIN,
  clamp,
  toErrorMessage,
} from "./sampleIntelligenceLogic";
import type { UseSampleDatabaseControlsArgs, UseSampleDatabaseControlsResult } from "./sampleDatabaseControlsTypes";
import { buildSampleDatabaseStatusSummary } from "./sampleDatabaseStatusSummary";

export type { UseSampleDatabaseControlsArgs, UseSampleDatabaseControlsResult } from "./sampleDatabaseControlsTypes";

export function useSampleDatabaseControls({
  pickFolderPath,
  sampleDatabaseFolderPath,
  setSampleDatabaseFolderPath,
  setSampleDatabaseError,
  scanSampleDatabaseFolder,
  sampleGuidance,
  sampleGuidanceEnabled,
  sampleTemplateLockEnabled,
  sampleTemplateLockStatus,
  templateLockCandidate,
  sampleGuidanceActiveLabel,
  sampleGuidanceCenterLabel,
  sampleGuidanceEdgeLabel,
  sampleGuidanceOffManualLabel,
  sampleGuidanceOffNoDirectionalLabel,
  templateLockReadyLabel,
  templateLockNoMatchLabel,
  templateLockShapeMatchLabel,
  templateLockExactMatchLabel,
  templateLockDisabledLabel,
  setSampleGuidanceCfgScalePercent,
  setSampleGuidanceSteps,
  setSampleGuidanceSeed,
}: UseSampleDatabaseControlsArgs): UseSampleDatabaseControlsResult {
  const sampleDatabaseStatusSummaryText = useMemo(() => {
    return buildSampleDatabaseStatusSummary({
      sampleGuidance,
      sampleGuidanceEnabled,
      sampleTemplateLockEnabled,
      sampleTemplateLockStatus,
      templateLockCandidate,
      sampleGuidanceActiveLabel,
      sampleGuidanceCenterLabel,
      sampleGuidanceEdgeLabel,
      sampleGuidanceOffManualLabel,
      sampleGuidanceOffNoDirectionalLabel,
      templateLockReadyLabel,
      templateLockNoMatchLabel,
      templateLockShapeMatchLabel,
      templateLockExactMatchLabel,
      templateLockDisabledLabel,
    });
  }, [
    sampleGuidance,
    sampleGuidanceActiveLabel,
    sampleGuidanceCenterLabel,
    sampleGuidanceEdgeLabel,
    sampleGuidanceEnabled,
    sampleGuidanceOffManualLabel,
    sampleGuidanceOffNoDirectionalLabel,
    sampleTemplateLockEnabled,
    sampleTemplateLockStatus,
    templateLockCandidate,
    templateLockDisabledLabel,
    templateLockExactMatchLabel,
    templateLockNoMatchLabel,
    templateLockReadyLabel,
    templateLockShapeMatchLabel,
  ]);

  const handleChooseSampleDatabaseFolder = useCallback(async () => {
    try {
      const selectedPath = await pickFolderPath();
      if (!selectedPath) return;
      setSampleDatabaseFolderPath(selectedPath);
    } catch (error) {
      setSampleDatabaseError(toErrorMessage(error));
    }
  }, [pickFolderPath, setSampleDatabaseError, setSampleDatabaseFolderPath]);

  const handleReloadSampleDatabase = useCallback(() => {
    if (!sampleDatabaseFolderPath) return;
    void scanSampleDatabaseFolder(sampleDatabaseFolderPath);
  }, [sampleDatabaseFolderPath, scanSampleDatabaseFolder]);

  const handleSampleGuidanceCfgScalePercentChange = useCallback((value: number) => {
    setSampleGuidanceCfgScalePercent(Math.round(clamp(
      value,
      SAMPLE_GUIDANCE_CFG_SCALE_MIN,
      SAMPLE_GUIDANCE_CFG_SCALE_MAX,
    )));
  }, [setSampleGuidanceCfgScalePercent]);

  const handleSampleGuidanceStepsChange = useCallback((value: number) => {
    setSampleGuidanceSteps(Math.round(clamp(
      value,
      SAMPLE_GUIDANCE_STEPS_MIN,
      SAMPLE_GUIDANCE_STEPS_MAX,
    )));
  }, [setSampleGuidanceSteps]);

  const handleSampleGuidanceSeedChange = useCallback((value: number) => {
    setSampleGuidanceSeed(Number.isFinite(value) ? Math.trunc(value) : 0);
  }, [setSampleGuidanceSeed]);

  return {
    sampleDatabaseStatusSummaryText,
    handleChooseSampleDatabaseFolder,
    handleReloadSampleDatabase,
    handleSampleGuidanceCfgScalePercentChange,
    handleSampleGuidanceStepsChange,
    handleSampleGuidanceSeedChange,
  };
}
