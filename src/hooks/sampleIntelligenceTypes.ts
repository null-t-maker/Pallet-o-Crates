import type { CartonInput, PackSampleGuidance, PalletInput, SampleGuidanceFilter } from "../lib/packer";
import type { ScanSampleDatabaseResponse } from "../lib/layoutSamples";
import type { TemplateLockCandidate } from "./sampleIntelligenceLogic";

export interface UseSampleIntelligenceArgs {
  pallet: PalletInput;
  cartons: CartonInput[];
}

export interface UseSampleIntelligenceResult {
  sampleDatabaseFolderPath: string;
  setSampleDatabaseFolderPath: React.Dispatch<React.SetStateAction<string>>;
  sampleDatabaseData: ScanSampleDatabaseResponse | null;
  sampleDatabaseLoading: boolean;
  sampleDatabaseError: string | null;
  setSampleDatabaseError: React.Dispatch<React.SetStateAction<string | null>>;
  sampleGuidanceEnabled: boolean;
  setSampleGuidanceEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  sampleTemplateLockEnabled: boolean;
  setSampleTemplateLockEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  sampleGuidanceStrengthPercent: number;
  setSampleGuidanceStrengthPercent: React.Dispatch<React.SetStateAction<number>>;
  sampleGuidanceCfgScalePercent: number;
  setSampleGuidanceCfgScalePercent: React.Dispatch<React.SetStateAction<number>>;
  sampleGuidanceSteps: number;
  setSampleGuidanceSteps: React.Dispatch<React.SetStateAction<number>>;
  sampleGuidanceSeed: number;
  setSampleGuidanceSeed: React.Dispatch<React.SetStateAction<number>>;
  sampleGuidanceFilter: SampleGuidanceFilter;
  setSampleGuidanceFilter: React.Dispatch<React.SetStateAction<SampleGuidanceFilter>>;
  sampleTemplateLockStatus: string | null;
  setSampleTemplateLockStatus: React.Dispatch<React.SetStateAction<string | null>>;
  templateLockCandidate: TemplateLockCandidate | null;
  sampleGuidance: PackSampleGuidance | null;
  scanSampleDatabaseFolder: (folderPath: string) => Promise<void>;
}

export type { TemplateLockCandidate };
