import type { Dispatch, SetStateAction } from "react";
import type { WorkflowMode } from "../components/Visualizer";
import type {
  CartonInput,
  MultiPackResult,
  PackedCarton,
  PackSampleGuidance,
  PalletInput,
} from "../lib/packer";
import type { TemplateLockCandidate } from "./useSampleIntelligence";

export type ManualCartonUpdatePatch = Partial<Pick<PackedCarton, "x" | "y" | "z" | "w" | "l" | "h">>;

export interface UseWorkflowActionsArgs {
  workflowMode: WorkflowMode;
  setWorkflowMode: Dispatch<SetStateAction<WorkflowMode>>;
  result: MultiPackResult | null;
  setResult: Dispatch<SetStateAction<MultiPackResult | null>>;
  pallet: PalletInput;
  cartons: CartonInput[];
  manualCartons: PackedCarton[];
  applyManualCartons: (
    cartons: PackedCarton[],
    options?: { recordHistory?: boolean; resetHistory?: boolean },
  ) => void;
  clearManualLayout: () => void;
  setVisibleLayers: Dispatch<SetStateAction<number>>;
  closeWorkflowPanel: () => void;
  sampleGuidance: PackSampleGuidance | null;
  sampleTemplateLockEnabled: boolean;
  templateLockCandidate: TemplateLockCandidate | null;
  setSampleTemplateLockStatus: Dispatch<SetStateAction<string | null>>;
}

export interface UseWorkflowActionsResult {
  switchWorkflowMode: (nextMode: WorkflowMode) => void;
  handleCalculate: () => void;
  handleGenerateManualAgain: () => void;
  handleGenerateManualMore: () => void;
  handleManualCartonUpdate: (id: string, next: ManualCartonUpdatePatch) => void;
}
