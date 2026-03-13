import type { Dispatch, SetStateAction } from "react";
import type { WorkflowMode } from "../components/Visualizer";
import type {
  CartonInput,
  MultiPackResult,
  PackedCarton,
  PackSampleGuidance,
  PalletInput,
} from "../lib/packer";
import type { PackingProgressSnapshot } from "../lib/packingProgress";
import type { TemplateLockCandidate } from "./useSampleIntelligence";

export type ManualCartonUpdatePatch = Partial<Pick<PackedCarton, "x" | "y" | "z" | "w" | "l" | "h">>;
export type WorkflowBusyKind = "calculate" | "calculateMissing" | null;

export interface UseWorkflowActionsArgs {
  workflowMode: WorkflowMode;
  setWorkflowMode: Dispatch<SetStateAction<WorkflowMode>>;
  result: MultiPackResult | null;
  setResult: Dispatch<SetStateAction<MultiPackResult | null>>;
  generationSeedResult: MultiPackResult | null;
  setGenerationSeedResult: Dispatch<SetStateAction<MultiPackResult | null>>;
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
  workflowBusyKind: WorkflowBusyKind;
  setWorkflowBusyKind: Dispatch<SetStateAction<WorkflowBusyKind>>;
  setWorkflowProgress: Dispatch<SetStateAction<PackingProgressSnapshot | null>>;
}

export interface UseWorkflowActionsResult {
  cancelWorkflow: () => void;
  switchWorkflowMode: (nextMode: WorkflowMode) => void;
  handleCalculate: () => void;
  handleCalculateMissing: () => void;
  handleGenerateManualAgain: () => void;
  handleGenerateManualMore: () => void;
  handleManualCartonUpdate: (id: string, next: ManualCartonUpdatePatch) => void;
}
