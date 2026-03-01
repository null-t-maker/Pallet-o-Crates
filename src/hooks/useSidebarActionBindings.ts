import { useMemo } from "react";
import { buildSidebarActionBindings } from "./sidebarPropsActions";
import type { SidebarBindingArgs } from "./sidebarBindingsTypes";

type SidebarActionBindingArgs = Pick<
  SidebarBindingArgs,
  | "workflowMode"
  | "manualCartons"
  | "result"
  | "labels"
  | "t"
  | "handleCalculate"
  | "handleGenerateManualAgain"
  | "handleGenerateManualMore"
  | "switchWorkflowMode"
>;

export function useSidebarActionBindings({
  workflowMode,
  manualCartons,
  result,
  labels,
  t,
  handleCalculate,
  handleGenerateManualAgain,
  handleGenerateManualMore,
  switchWorkflowMode,
}: SidebarActionBindingArgs): ReturnType<typeof buildSidebarActionBindings> {
  return useMemo(
    () =>
      buildSidebarActionBindings({
        workflowMode,
        manualCartonCount: manualCartons.length,
        result,
        labels,
        t,
        handleCalculate,
        handleGenerateManualAgain,
        handleGenerateManualMore,
        switchWorkflowMode,
      }),
    [
      handleCalculate,
      handleGenerateManualAgain,
      handleGenerateManualMore,
      labels,
      manualCartons.length,
      result,
      switchWorkflowMode,
      t,
      workflowMode,
    ],
  );
}
