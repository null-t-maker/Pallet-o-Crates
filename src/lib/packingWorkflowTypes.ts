import type {
  CartonInput,
  MultiPackResult,
  PackSampleGuidance,
  PalletInput,
} from "./packerTypes";

export interface TemplateLockCandidateInput {
  sample: {
    filePath: string;
    fileName: string;
  };
  matchKind: "exact" | "shape";
}

export interface CalculatePackingResult {
  result: MultiPackResult;
  templateStatus: string | null;
}

export interface TemplateLockAttemptResult {
  result: MultiPackResult | null;
  templateStatus: string | null;
}

export interface CalculatePackingArgs {
  pallet: PalletInput;
  cartons: CartonInput[];
  sampleGuidance: PackSampleGuidance | null;
  sampleTemplateLockEnabled: boolean;
  templateLockCandidate: TemplateLockCandidateInput | null;
}
