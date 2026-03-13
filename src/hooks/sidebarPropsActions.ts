import type { WorkflowMode } from "../components/Visualizer";
import type { MultiPackResult } from "../lib/packer";
import type { AppLabels } from "./useAppLabels";
import type { WorkflowBusyKind } from "./workflowActionsTypes";

export interface SidebarActionBindings {
  onPrimaryAction: () => void;
  primaryActionLabel: string;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  onWorkflowModeAction?: () => void;
  workflowModeActionLabel?: string;
  dualActionPrimaryAccent: boolean;
  actionsDisabled: boolean;
}

interface BuildSidebarActionBindingsArgs {
  workflowMode: WorkflowMode;
  manualCartonCount: number;
  result: MultiPackResult | null;
  generationSeedResult: MultiPackResult | null;
  labels: AppLabels;
  handleCalculate: () => void;
  handleCalculateMissing: () => void;
  handleGenerateManualAgain: () => void;
  handleGenerateManualMore: () => void;
  workflowBusyKind: WorkflowBusyKind;
  switchWorkflowMode: (mode: WorkflowMode) => void;
}

function withBusySuffix(label: string, busy: boolean): string {
  return busy ? `${label}...` : label;
}

export function buildSidebarActionBindings({
  workflowMode,
  manualCartonCount,
  result,
  generationSeedResult,
  labels,
  handleCalculate,
  handleCalculateMissing,
  handleGenerateManualAgain,
  handleGenerateManualMore,
  workflowBusyKind,
  switchWorkflowMode,
}: BuildSidebarActionBindingsArgs): SidebarActionBindings {
  const showManualDualActions = workflowMode === "manual" && manualCartonCount > 0;
  const showGenerationDualActions = workflowMode === "generation";
  const canSwitchGeneratedToManual = workflowMode === "generation"
    && (((result?.pallets.length ?? 0) > 0 && (result?.packedUnits ?? 0) > 0)
      || ((generationSeedResult?.pallets.length ?? 0) > 0 && (generationSeedResult?.packedUnits ?? 0) > 0));
  const actionsDisabled = workflowBusyKind !== null;

  const onPrimaryAction = workflowMode === "manual"
    ? handleGenerateManualAgain
    : handleCalculate;
  const primaryActionLabelBase = workflowMode === "manual"
    ? (showManualDualActions ? labels.regenerateAllCartonsLabel : labels.generateCartonsLabel)
    : labels.calculateFullLayoutLabel;
  const primaryActionLabel = withBusySuffix(
    primaryActionLabelBase,
    workflowBusyKind === "calculate",
  );

  const onSecondaryAction = workflowMode === "manual"
    ? (showManualDualActions ? handleGenerateManualMore : undefined)
    : (showGenerationDualActions ? handleCalculateMissing : undefined);
  const secondaryActionLabelBase = workflowMode === "manual"
    ? (showManualDualActions ? labels.generateMoreCartonsLabel : undefined)
    : (showGenerationDualActions ? labels.calculateMissingCartonsLabel : undefined);
  const secondaryActionLabel = secondaryActionLabelBase
    ? withBusySuffix(secondaryActionLabelBase, workflowBusyKind === "calculateMissing")
    : undefined;

  const onWorkflowModeAction = workflowMode === "manual"
    ? () => switchWorkflowMode("generation")
    : (canSwitchGeneratedToManual ? () => switchWorkflowMode("manual") : undefined);
  const workflowModeActionLabel = workflowMode === "manual"
    ? labels.switchToPalletGenerationLabel
    : (canSwitchGeneratedToManual ? labels.switchToManualEditingLabel : undefined);

  return {
    onPrimaryAction,
    primaryActionLabel,
    onSecondaryAction,
    secondaryActionLabel,
    onWorkflowModeAction,
    workflowModeActionLabel,
    dualActionPrimaryAccent: false,
    actionsDisabled,
  };
}
