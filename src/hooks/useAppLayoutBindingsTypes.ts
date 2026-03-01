import type { WorkflowMode } from "../components/Visualizer";
import type { Language, Translations } from "../i18n";
import type { CartonInput, MultiPackResult, PackedCarton, PalletInput } from "../lib/packer";
import type { AppLabels } from "./useAppLabels";
import type { UseAppSampleDatabaseBindingsResult } from "./useAppSampleDatabaseBindings";
import type { UseLayoutSampleSaveResult } from "./useLayoutSampleSave";
import type { UseTopbarPanelsResult } from "./useTopbarPanels";
import type { UseUiOverlaysResult } from "./useUiOverlays";

export interface UseAppLayoutBindingsArgs {
  t: Translations;
  labels: AppLabels;
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  palletGenerationOpen: boolean;
  setPalletGenerationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openUpdateCheckModal: () => void;
  workflowMode: WorkflowMode;
  switchWorkflowMode: (mode: WorkflowMode) => void;
  topbarPanels: UseTopbarPanelsResult;
  sampleSave: UseLayoutSampleSaveResult;
  uiOverlays: UseUiOverlaysResult;
  setUiScale: (value: number) => void;
  setUiZoom: (value: number) => void;

  pallet: PalletInput;
  setPallet: (pallet: PalletInput) => void;
  cartons: CartonInput[];
  setCartons: (cartons: CartonInput[]) => void;
  result: MultiPackResult | null;
  manualCartons: PackedCarton[];
  handleManualCartonUpdate: (
    id: string,
    next: Partial<Pick<PackedCarton, "x" | "y" | "z" | "w" | "l" | "h">>,
  ) => void;
  visibleLayers: number;
  setVisibleLayers: (value: number) => void;
  uiScale: number;
  uiZoom: number;
  uiScaleMin: number;
  uiScaleMax: number;
  uiZoomMin: number;
  uiZoomMax: number;
  updateCheckModalOpen: boolean;
  handleConfirmUpdateCheck: () => void;
  closeUpdateCheckModal: () => void;

  handleCalculate: () => void;
  handleGenerateManualAgain: () => void;
  handleGenerateManualMore: () => void;
  sampleDatabase: UseAppSampleDatabaseBindingsResult;
}
