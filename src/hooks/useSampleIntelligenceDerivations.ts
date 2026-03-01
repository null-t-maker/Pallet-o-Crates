import { useEffect, useMemo } from "react";
import type { CartonInput, PackSampleGuidance, PalletInput, SampleGuidanceFilter } from "../lib/packer";
import { buildCartonFingerprint, fingerprintWithoutQuantity, type ScanSampleDatabaseResponse } from "../lib/layoutSamples";
import {
  buildSampleGuidance,
  selectTemplateLockCandidate,
  type TemplateLockCandidate,
} from "./sampleIntelligenceLogic";

interface UseSampleIntelligenceDerivationsArgs {
  cartons: CartonInput[];
  pallet: PalletInput;
  sampleDatabaseData: ScanSampleDatabaseResponse | null;
  sampleGuidanceEnabled: boolean;
  sampleGuidanceFilter: SampleGuidanceFilter;
  sampleGuidanceStrengthPercent: number;
  sampleGuidanceCfgScalePercent: number;
  sampleGuidanceSteps: number;
  sampleGuidanceSeed: number;
  sampleTemplateLockEnabled: boolean;
  sampleDatabaseFolderPath: string;
  setSampleTemplateLockStatus: React.Dispatch<React.SetStateAction<string | null>>;
}

interface UseSampleIntelligenceDerivationsResult {
  templateLockCandidate: TemplateLockCandidate | null;
  sampleGuidance: PackSampleGuidance | null;
}

export function useSampleIntelligenceDerivations({
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
}: UseSampleIntelligenceDerivationsArgs): UseSampleIntelligenceDerivationsResult {
  const currentCartonFingerprint = useMemo(
    () => buildCartonFingerprint(cartons),
    [cartons],
  );
  const currentCartonShapeFingerprint = useMemo(
    () => fingerprintWithoutQuantity(currentCartonFingerprint),
    [currentCartonFingerprint],
  );

  const templateLockCandidate = useMemo<TemplateLockCandidate | null>(() => {
    return selectTemplateLockCandidate({
      sampleTemplateLockEnabled,
      records: sampleDatabaseData?.samples ?? [],
      currentCartonFingerprint,
      currentCartonShapeFingerprint,
      pallet,
    });
  }, [
    currentCartonFingerprint,
    currentCartonShapeFingerprint,
    pallet.length,
    pallet.packingStyle,
    pallet.width,
    sampleDatabaseData?.samples,
    sampleTemplateLockEnabled,
  ]);

  useEffect(() => {
    setSampleTemplateLockStatus(null);
  }, [
    currentCartonFingerprint,
    pallet.length,
    pallet.packingStyle,
    pallet.width,
    sampleDatabaseFolderPath,
    sampleTemplateLockEnabled,
    setSampleTemplateLockStatus,
  ]);

  const sampleGuidance = useMemo<PackSampleGuidance | null>(() => {
    return buildSampleGuidance({
      sampleGuidanceEnabled,
      records: sampleDatabaseData?.samples ?? [],
      pallet,
      currentCartonFingerprint,
      currentCartonShapeFingerprint,
      sampleGuidanceFilter,
      sampleGuidanceStrengthPercent,
      sampleGuidanceCfgScalePercent,
      sampleGuidanceSteps,
      sampleGuidanceSeed,
    });
  }, [
    currentCartonFingerprint,
    currentCartonShapeFingerprint,
    pallet.length,
    pallet.packingStyle,
    pallet.width,
    sampleDatabaseData?.samples,
    sampleGuidanceCfgScalePercent,
    sampleGuidanceEnabled,
    sampleGuidanceFilter,
    sampleGuidanceSeed,
    sampleGuidanceSteps,
    sampleGuidanceStrengthPercent,
  ]);

  return {
    templateLockCandidate,
    sampleGuidance,
  };
}
