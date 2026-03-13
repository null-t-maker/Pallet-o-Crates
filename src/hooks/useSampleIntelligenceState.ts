import { useEffect, useState } from "react";
import type { ScanSampleDatabaseResponse } from "../lib/layoutSamples";
import {
  getInitialSampleDatabaseFolderPath,
  getInitialSampleGuidanceCfgScalePercent,
  getInitialSampleGuidanceEnabled,
  getInitialSampleGuidanceFilter,
  getInitialSampleGuidanceSeed,
  getInitialSampleGuidanceSteps,
  getInitialSampleGuidanceStrengthPercent,
  getInitialSampleTemplateLockEnabled,
  persistSampleDatabaseFolderPath,
  persistSampleGuidanceCfgScalePercent,
  persistSampleGuidanceEnabled,
  persistSampleGuidanceFilter,
  persistSampleGuidanceSeed,
  persistSampleGuidanceSteps,
  persistSampleGuidanceStrengthPercent,
  persistSampleTemplateLockEnabled,
} from "./sampleIntelligenceStateStorage";

interface UseSampleIntelligenceStateArgs {
  sampleDatabasePanelVisible: boolean;
}

export function useSampleIntelligenceState({
  sampleDatabasePanelVisible,
}: UseSampleIntelligenceStateArgs) {
  const [sampleDatabaseFolderPath, setSampleDatabaseFolderPath] = useState<string>(getInitialSampleDatabaseFolderPath);
  const [sampleDatabaseData, setSampleDatabaseData] = useState<ScanSampleDatabaseResponse | null>(null);
  const [sampleDatabaseLoading, setSampleDatabaseLoading] = useState(false);
  const [sampleDatabaseError, setSampleDatabaseError] = useState<string | null>(null);
  const [sampleGuidanceEnabled, setSampleGuidanceEnabled] = useState<boolean>(() =>
    sampleDatabasePanelVisible ? getInitialSampleGuidanceEnabled() : false,
  );
  const [sampleTemplateLockEnabled, setSampleTemplateLockEnabled] = useState<boolean>(() =>
    sampleDatabasePanelVisible ? getInitialSampleTemplateLockEnabled() : false,
  );
  const [sampleGuidanceStrengthPercent, setSampleGuidanceStrengthPercent] = useState<number>(
    getInitialSampleGuidanceStrengthPercent,
  );
  const [sampleGuidanceCfgScalePercent, setSampleGuidanceCfgScalePercent] = useState<number>(
    getInitialSampleGuidanceCfgScalePercent,
  );
  const [sampleGuidanceSteps, setSampleGuidanceSteps] = useState<number>(getInitialSampleGuidanceSteps);
  const [sampleGuidanceSeed, setSampleGuidanceSeed] = useState<number>(getInitialSampleGuidanceSeed);
  const [sampleGuidanceFilter, setSampleGuidanceFilter] = useState(getInitialSampleGuidanceFilter);
  const [sampleTemplateLockStatus, setSampleTemplateLockStatus] = useState<string | null>(null);

  useEffect(() => {
    persistSampleDatabaseFolderPath(sampleDatabaseFolderPath);
  }, [sampleDatabaseFolderPath]);

  useEffect(() => {
    persistSampleGuidanceEnabled(sampleGuidanceEnabled);
  }, [sampleGuidanceEnabled]);

  useEffect(() => {
    persistSampleTemplateLockEnabled(sampleTemplateLockEnabled);
  }, [sampleTemplateLockEnabled]);

  useEffect(() => {
    persistSampleGuidanceStrengthPercent(sampleGuidanceStrengthPercent);
  }, [sampleGuidanceStrengthPercent]);

  useEffect(() => {
    persistSampleGuidanceCfgScalePercent(sampleGuidanceCfgScalePercent);
  }, [sampleGuidanceCfgScalePercent]);

  useEffect(() => {
    persistSampleGuidanceSteps(sampleGuidanceSteps);
  }, [sampleGuidanceSteps]);

  useEffect(() => {
    persistSampleGuidanceSeed(sampleGuidanceSeed);
  }, [sampleGuidanceSeed]);

  useEffect(() => {
    persistSampleGuidanceFilter(sampleGuidanceFilter);
  }, [sampleGuidanceFilter]);

  useEffect(() => {
    if (sampleDatabasePanelVisible) return;
    if (sampleGuidanceEnabled) {
      setSampleGuidanceEnabled(false);
    }
    if (sampleTemplateLockEnabled) {
      setSampleTemplateLockEnabled(false);
    }
    if (sampleTemplateLockStatus !== null) {
      setSampleTemplateLockStatus(null);
    }
  }, [
    sampleDatabasePanelVisible,
    sampleGuidanceEnabled,
    sampleTemplateLockEnabled,
    sampleTemplateLockStatus,
  ]);

  return {
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
  };
}
