import React from "react";
import type { PackedCarton } from "../../lib/packer";

type WorkflowMode = "generation" | "manual";

interface UseVisualizerSelectionStateArgs {
  mode: WorkflowMode;
}

interface UseVisualizerSelectionStateResult {
  hovered: PackedCarton | null;
  setHovered: React.Dispatch<React.SetStateAction<PackedCarton | null>>;
  selectedId: string | null;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
  manualMoveStepMm: number;
  setManualMoveStepMm: React.Dispatch<React.SetStateAction<number>>;
  manualHint: string | null;
  setManualHint: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useVisualizerSelectionState({
  mode,
}: UseVisualizerSelectionStateArgs): UseVisualizerSelectionStateResult {
  const [hovered, setHovered] = React.useState<PackedCarton | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [manualMoveStepMm, setManualMoveStepMm] = React.useState(0);
  const [manualHint, setManualHint] = React.useState<string | null>(null);

  React.useEffect(() => {
    setHovered(null);
    setSelectedId(null);
    setManualHint(null);
  }, [mode]);

  React.useEffect(() => {
    setManualHint(null);
  }, [selectedId]);

  return {
    hovered,
    setHovered,
    selectedId,
    setSelectedId,
    manualMoveStepMm,
    setManualMoveStepMm,
    manualHint,
    setManualHint,
  };
}
