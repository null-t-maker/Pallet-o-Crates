import {
  applySampleGuidance,
  calculateGuidedWithFallbackAsync,
} from "./packingWorkflowGuidance";
import { tryApplyTemplateLock } from "./packingWorkflowTemplateLock";
import type { CalculatePackingArgs, CalculatePackingResult } from "./packingWorkflowTypes";

export async function calculatePacking({
  pallet,
  cartons,
  sampleGuidance,
  sampleTemplateLockEnabled,
  templateLockCandidate,
  progressReporter,
}: CalculatePackingArgs): Promise<CalculatePackingResult> {
  progressReporter?.throwIfCancelled();
  const nextPallet = applySampleGuidance(pallet, sampleGuidance);
  const templateAttempt = await tryApplyTemplateLock({
    pallet,
    cartons,
    nextPallet,
    sampleTemplateLockEnabled,
    templateLockCandidate,
    progressReporter,
  });
  progressReporter?.throwIfCancelled();
  const result = templateAttempt.result ?? await calculateGuidedWithFallbackAsync(
    nextPallet,
    cartons,
    sampleGuidance,
    progressReporter,
  );

  return {
    result,
    templateStatus: templateAttempt.templateStatus,
  };
}
