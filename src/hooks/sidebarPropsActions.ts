import type { WorkflowMode } from "../components/Visualizer";
import type { Translations } from "../i18n";
import type { MultiPackResult } from "../lib/packer";
import type { AppLabels } from "./useAppLabels";

export interface SidebarActionBindings {
  onPrimaryAction: () => void;
  primaryActionLabel: string;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  dualActionPrimaryAccent: boolean;
}

interface BuildSidebarActionBindingsArgs {
  workflowMode: WorkflowMode;
  manualCartonCount: number;
  result: MultiPackResult | null;
  labels: AppLabels;
  t: Translations;
  handleCalculate: () => void;
  handleGenerateManualAgain: () => void;
  handleGenerateManualMore: () => void;
  switchWorkflowMode: (mode: WorkflowMode) => void;
}

export function buildSidebarActionBindings({
  workflowMode,
  manualCartonCount,
  result,
  labels,
  t,
  handleCalculate,
  handleGenerateManualAgain,
  handleGenerateManualMore,
  switchWorkflowMode,
}: BuildSidebarActionBindingsArgs): SidebarActionBindings {
  const showManualDualActions = workflowMode === "manual" && manualCartonCount > 0;
  const canSwitchGeneratedToManual = workflowMode === "generation"
    && Boolean(result)
    && (result?.pallets.length ?? 0) > 0
    && (result?.packedUnits ?? 0) > 0;

  const onPrimaryAction = workflowMode === "manual"
    ? handleGenerateManualAgain
    : handleCalculate;
  const primaryActionLabel = workflowMode === "manual"
    ? (showManualDualActions ? labels.generateCartonsAgainLabel : labels.generateCartonsLabel)
    : t.calculatePacking;

  const onSecondaryAction = showManualDualActions
    ? handleGenerateManualMore
    : (canSwitchGeneratedToManual ? () => switchWorkflowMode("manual") : undefined);
  const secondaryActionLabel = showManualDualActions
    ? labels.generateMoreCartonsLabel
    : (canSwitchGeneratedToManual ? labels.switchToManualEditingLabel : undefined);

  return {
    onPrimaryAction,
    primaryActionLabel,
    onSecondaryAction,
    secondaryActionLabel,
    dualActionPrimaryAccent: canSwitchGeneratedToManual,
  };
}
