import { useState } from "react";
import type { WorkflowMode } from "../components/Visualizer";
import type { CartonInput, MultiPackResult, PalletInput } from "../lib/packer";

export function useAppWorkflowState(): {
  pallet: PalletInput;
  setPallet: React.Dispatch<React.SetStateAction<PalletInput>>;
  cartons: CartonInput[];
  setCartons: React.Dispatch<React.SetStateAction<CartonInput[]>>;
  result: MultiPackResult | null;
  setResult: React.Dispatch<React.SetStateAction<MultiPackResult | null>>;
  generationSeedResult: MultiPackResult | null;
  setGenerationSeedResult: React.Dispatch<React.SetStateAction<MultiPackResult | null>>;
  workflowMode: WorkflowMode;
  setWorkflowMode: React.Dispatch<React.SetStateAction<WorkflowMode>>;
  visibleLayers: number;
  setVisibleLayers: React.Dispatch<React.SetStateAction<number>>;
  palletGenerationOpen: boolean;
  setPalletGenerationOpen: React.Dispatch<React.SetStateAction<boolean>>;
} {
  const [pallet, setPallet] = useState<PalletInput>({
    width: 800,
    length: 1200,
    maxHeight: 1800,
    maxWeight: 1000,
    packingStyle: "edgeAligned",
    extraPalletMode: "none",
  });
  const [cartons, setCartons] = useState<CartonInput[]>([]);
  const [result, setResult] = useState<MultiPackResult | null>(null);
  const [generationSeedResult, setGenerationSeedResult] = useState<MultiPackResult | null>(null);
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>("generation");
  const [visibleLayers, setVisibleLayers] = useState(0);
  const [palletGenerationOpen, setPalletGenerationOpen] = useState(true);

  return {
    pallet,
    setPallet,
    cartons,
    setCartons,
    result,
    setResult,
    generationSeedResult,
    setGenerationSeedResult,
    workflowMode,
    setWorkflowMode,
    visibleLayers,
    setVisibleLayers,
    palletGenerationOpen,
    setPalletGenerationOpen,
  };
}
