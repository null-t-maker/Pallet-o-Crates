import { useCallback, useMemo } from "react";
import type { UseSampleDatabaseControlsArgs, UseSampleDatabaseControlsResult } from "./sampleDatabaseControlsTypes";
import { buildSampleDatabaseStatusSummary } from "./sampleDatabaseStatusSummary";
import {
  chooseSampleDatabaseFolderAction,
  normalizeSampleGuidanceCfgScalePercent,
  normalizeSampleGuidanceSeed,
  normalizeSampleGuidanceSteps,
  reloadSampleDatabaseAction,
} from "./sampleDatabaseControlActions";

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
    await chooseSampleDatabaseFolderAction({
      pickFolderPath,
      setSampleDatabaseFolderPath,
      setSampleDatabaseError,
    });
  }, [pickFolderPath, setSampleDatabaseError, setSampleDatabaseFolderPath]);

  const handleReloadSampleDatabase = useCallback(() => {
    reloadSampleDatabaseAction(sampleDatabaseFolderPath, scanSampleDatabaseFolder);
  }, [sampleDatabaseFolderPath, scanSampleDatabaseFolder]);

  const handleSampleGuidanceCfgScalePercentChange = useCallback((value: number) => {
    setSampleGuidanceCfgScalePercent(normalizeSampleGuidanceCfgScalePercent(value));
  }, [setSampleGuidanceCfgScalePercent]);

  const handleSampleGuidanceStepsChange = useCallback((value: number) => {
    setSampleGuidanceSteps(normalizeSampleGuidanceSteps(value));
  }, [setSampleGuidanceSteps]);

  const handleSampleGuidanceSeedChange = useCallback((value: number) => {
    setSampleGuidanceSeed(normalizeSampleGuidanceSeed(value));
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
