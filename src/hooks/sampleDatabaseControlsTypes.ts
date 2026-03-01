import type { Dispatch, SetStateAction } from "react";
import type { PackSampleGuidance, SampleGuidanceFilter } from "../lib/packer";
import type { TemplateLockCandidate } from "./sampleIntelligenceLogic";

export interface UseSampleDatabaseControlsArgs {
  pickFolderPath: () => Promise<string | null>;
  sampleDatabaseFolderPath: string;
  setSampleDatabaseFolderPath: Dispatch<SetStateAction<string>>;
  setSampleDatabaseError: Dispatch<SetStateAction<string | null>>;
  scanSampleDatabaseFolder: (folderPath: string) => Promise<void>;
  sampleGuidance: PackSampleGuidance | null;
  sampleGuidanceEnabled: boolean;
  sampleTemplateLockEnabled: boolean;
  sampleTemplateLockStatus: string | null;
  templateLockCandidate: TemplateLockCandidate | null;
  sampleGuidanceActiveLabel: string;
  sampleGuidanceCenterLabel: string;
  sampleGuidanceEdgeLabel: string;
  sampleGuidanceOffManualLabel: string;
  sampleGuidanceOffNoDirectionalLabel: string;
  templateLockReadyLabel: string;
  templateLockNoMatchLabel: string;
  templateLockShapeMatchLabel: string;
  templateLockExactMatchLabel: string;
  templateLockDisabledLabel: string;
  setSampleGuidanceCfgScalePercent: Dispatch<SetStateAction<number>>;
  setSampleGuidanceSteps: Dispatch<SetStateAction<number>>;
  setSampleGuidanceSeed: Dispatch<SetStateAction<number>>;
}

export interface UseSampleDatabaseControlsResult {
  sampleDatabaseStatusSummaryText: string;
  handleChooseSampleDatabaseFolder: () => Promise<void>;
  handleReloadSampleDatabase: () => void;
  handleSampleGuidanceCfgScalePercentChange: (value: number) => void;
  handleSampleGuidanceStepsChange: (value: number) => void;
  handleSampleGuidanceSeedChange: (value: number) => void;
}

export interface BuildSampleDatabaseStatusSummaryArgs {
  sampleGuidance: PackSampleGuidance | null;
  sampleGuidanceEnabled: boolean;
  sampleTemplateLockEnabled: boolean;
  sampleTemplateLockStatus: string | null;
  templateLockCandidate: TemplateLockCandidate | null;
  sampleGuidanceActiveLabel: string;
  sampleGuidanceCenterLabel: string;
  sampleGuidanceEdgeLabel: string;
  sampleGuidanceOffManualLabel: string;
  sampleGuidanceOffNoDirectionalLabel: string;
  templateLockReadyLabel: string;
  templateLockNoMatchLabel: string;
  templateLockShapeMatchLabel: string;
  templateLockExactMatchLabel: string;
  templateLockDisabledLabel: string;
}

export type { SampleGuidanceFilter };
