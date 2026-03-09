import type { RunHeuristicLayerStepArgs, RunHeuristicLayerStepResult } from "./packerHeuristicLayerStepTypes";
import { runHeuristicLayerStepExperimental } from "./packerHeuristicLayerStepExperimental";
import { runHeuristicLayerStepGreedy } from "./packerHeuristicLayerStepGreedy";

function shouldUseExperimentalLayerPlanner({
  safePallet,
  rem,
  state,
}: Pick<RunHeuristicLayerStepArgs, "safePallet" | "rem" | "state">): boolean {
  if (safePallet.packingStyle !== "edgeAligned") return false;
  if (state.layerIndex < 3) return false;
  const activeTypes = rem.filter((carton) => carton.quantity > 0);
  const remainingUnits = activeTypes.reduce((sum, carton) => sum + carton.quantity, 0);
  return activeTypes.length >= 2
    && activeTypes.length <= 3
    && remainingUnits <= 40;
}

export function runHeuristicLayerStep(
  args: RunHeuristicLayerStepArgs,
): RunHeuristicLayerStepResult {
  if (!shouldUseExperimentalLayerPlanner(args)) {
    return runHeuristicLayerStepGreedy(args);
  }

  return runHeuristicLayerStepExperimental(args, runHeuristicLayerStepGreedy);
}
