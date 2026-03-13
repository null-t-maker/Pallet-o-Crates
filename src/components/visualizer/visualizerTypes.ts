import type { Translations } from "../../i18n";
import type { MultiPackResult, PalletInput, PackedCarton } from "../../lib/packer";

export type WorkflowMode = "generation" | "manual";

export interface VisualizerProps {
  pallet: PalletInput;
  result: MultiPackResult | null;
  visibleLayers: number;
  t: Translations;
  mode: WorkflowMode;
  manualCartons: PackedCarton[];
  onManualCartonUpdate: (id: string, next: Partial<Pick<PackedCarton, "x" | "y" | "z" | "w" | "l" | "h">>) => void;
  manualShadowModeEnabled: boolean;
  setManualShadowModeEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}
