import type { CartonInput, PalletInput } from "../lib/packer";
import type { Translations } from "../i18n";
import type { AppLabels } from "./useAppLabels";
import { useSampleDatabaseControls, type UseSampleDatabaseControlsResult } from "./useSampleDatabaseControls";
import { useSampleIntelligence } from "./useSampleIntelligence";
import type { UseSampleIntelligenceResult } from "./sampleIntelligenceTypes";

interface UseAppSampleDatabaseBindingsArgs {
  pallet: PalletInput;
  cartons: CartonInput[];
  sampleDatabasePanelVisible: boolean;
  t: Translations;
  labels: AppLabels;
  pickFolderPath: () => Promise<string | null>;
}

export type UseAppSampleDatabaseBindingsResult =
  UseSampleIntelligenceResult
  & UseSampleDatabaseControlsResult;

export function useAppSampleDatabaseBindings({
  pallet,
  cartons,
  sampleDatabasePanelVisible,
  t,
  labels,
  pickFolderPath,
}: UseAppSampleDatabaseBindingsArgs): UseAppSampleDatabaseBindingsResult {
  const sampleIntelligence = useSampleIntelligence({ pallet, cartons, sampleDatabasePanelVisible });

  const controls = useSampleDatabaseControls({
    pickFolderPath,
    sampleDatabaseFolderPath: sampleIntelligence.sampleDatabaseFolderPath,
    setSampleDatabaseFolderPath: sampleIntelligence.setSampleDatabaseFolderPath,
    setSampleDatabaseError: sampleIntelligence.setSampleDatabaseError,
    scanSampleDatabaseFolder: sampleIntelligence.scanSampleDatabaseFolder,
    sampleGuidance: sampleIntelligence.sampleGuidance,
    sampleGuidanceEnabled: sampleIntelligence.sampleGuidanceEnabled,
    sampleTemplateLockEnabled: sampleIntelligence.sampleTemplateLockEnabled,
    sampleTemplateLockStatus: sampleIntelligence.sampleTemplateLockStatus,
    templateLockCandidate: sampleIntelligence.templateLockCandidate,
    sampleGuidanceActiveLabel: labels.sampleGuidanceActiveLabel,
    sampleGuidanceCenterLabel: labels.sampleGuidanceCenterLabel,
    sampleGuidanceEdgeLabel: labels.sampleGuidanceEdgeLabel,
    sampleGuidanceOffManualLabel: labels.sampleGuidanceOffManualLabel,
    sampleGuidanceOffNoDirectionalLabel: labels.sampleGuidanceOffNoDirectionalLabel,
    templateLockReadyLabel: labels.templateLockReadyLabel,
    templateLockNoMatchLabel: labels.templateLockNoMatchLabel,
    templateLockShapeMatchLabel: labels.templateLockShapeMatchLabel,
    templateLockExactMatchLabel: labels.templateLockExactMatchLabel,
    templateLockDisabledLabel: t.sampleTemplateLockDisabledLabel ?? "Template lock: off",
    setSampleGuidanceCfgScalePercent: sampleIntelligence.setSampleGuidanceCfgScalePercent,
    setSampleGuidanceSteps: sampleIntelligence.setSampleGuidanceSteps,
    setSampleGuidanceSeed: sampleIntelligence.setSampleGuidanceSeed,
  });

  return {
    ...sampleIntelligence,
    ...controls,
  };
}
