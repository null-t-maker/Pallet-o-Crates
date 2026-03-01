import type { WorkflowMode } from "../components/Visualizer";
import type { MultiPackResult, PackedCarton, PalletInput } from "../lib/packer";
import type { Translations } from "../i18n";
import type { AppLabels } from "./useAppLabels";
import type { UseUiOverlaysResult } from "./useUiOverlays";

type ViewerUiOverlayBindings = Pick<
  UseUiOverlaysResult,
  | "windowSize"
  | "uiAccessOpen"
  | "diagnosticsOpen"
  | "closeUiAccess"
  | "closeDiagnostics"
  | "uiAccessModalRef"
  | "diagnosticsModalRef"
  | "beginDrag"
  | "handleDragPointerMove"
  | "endDragPointer"
  | "uiAccessModalStyle"
  | "diagnosticsModalStyle"
>;

export interface UseViewerStagePropsArgs {
  pallet: PalletInput;
  result: MultiPackResult | null;
  visibleLayers: number;
  setVisibleLayers: (value: number) => void;
  t: Translations;
  workflowMode: WorkflowMode;
  manualCartons: PackedCarton[];
  onManualCartonUpdate: (id: string, next: Partial<Pick<PackedCarton, "x" | "y" | "z" | "w" | "l" | "h">>) => void;
  uiOverlays: ViewerUiOverlayBindings;
  uiScale: number;
  uiZoom: number;
  uiScaleMin: number;
  uiScaleMax: number;
  uiZoomMin: number;
  uiZoomMax: number;
  onSetUiScale: (value: number) => void;
  onSetUiZoom: (value: number) => void;
  updateCheckModalOpen: boolean;
  onConfirmUpdateCheck: () => void;
  onCloseUpdateCheck: () => void;
  labels: AppLabels;
}
