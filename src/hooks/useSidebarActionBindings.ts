import { useMemo } from "react";
import { buildSidebarActionBindings } from "./sidebarPropsActions";
import type { SidebarBindingArgs } from "./sidebarBindingsTypes";

type SidebarActionBindingArgs = Pick<
  SidebarBindingArgs,
  | "workflowMode"
  | "manualCartons"
  | "result"
  | "generationSeedResult"
  | "labels"
  | "handleCalculate"
  | "handleCalculateMissing"
  | "handleGenerateManualAgain"
  | "handleGenerateManualMore"
  | "workflowBusyKind"
  | "switchWorkflowMode"
>;

export function useSidebarActionBindings({
  workflowMode,
  manualCartons,
  result,
  generationSeedResult,
  labels,
  handleCalculate,
  handleCalculateMissing,
  handleGenerateManualAgain,
  handleGenerateManualMore,
  workflowBusyKind,
  switchWorkflowMode,
}: SidebarActionBindingArgs): ReturnType<typeof buildSidebarActionBindings> {
  return useMemo(
    () =>
      buildSidebarActionBindings({
        workflowMode,
        manualCartonCount: manualCartons.length,
        result,
        generationSeedResult,
        labels,
        handleCalculate,
        handleCalculateMissing,
        handleGenerateManualAgain,
        handleGenerateManualMore,
        workflowBusyKind,
        switchWorkflowMode,
      }),
    [
      handleCalculate,
      handleCalculateMissing,
      handleGenerateManualAgain,
      handleGenerateManualMore,
      labels,
      manualCartons.length,
      result,
      generationSeedResult,
      workflowBusyKind,
      switchWorkflowMode,
      workflowMode,
    ],
  );
}
