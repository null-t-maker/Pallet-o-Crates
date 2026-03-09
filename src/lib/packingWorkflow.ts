import {
  applySampleGuidance,
  calculateGuidedWithFallback,
} from "./packingWorkflowGuidance";
import { tryApplyTemplateLock } from "./packingWorkflowTemplateLock";
import type { CalculatePackingArgs, CalculatePackingResult } from "./packingWorkflowTypes";

export async function calculatePacking({
  pallet,
  cartons,
  sampleGuidance,
  sampleTemplateLockEnabled,
  templateLockCandidate,
}: CalculatePackingArgs): Promise<CalculatePackingResult> {
  const nextPallet = applySampleGuidance(pallet, sampleGuidance);
  const templateAttempt = await tryApplyTemplateLock({
    pallet,
    cartons,
    nextPallet,
    sampleTemplateLockEnabled,
    templateLockCandidate,
  });
  const result = templateAttempt.result ?? calculateGuidedWithFallback(nextPallet, cartons, sampleGuidance);

  return {
    result,
    templateStatus: templateAttempt.templateStatus,
  };
}
