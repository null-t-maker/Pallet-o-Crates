import { invoke } from "@tauri-apps/api/core";
import type { CartonInput, PalletInput } from "./packerTypes";
import { LoadLayoutSampleResponse } from "./layoutSamples";
import {
  buildTemplateResultFromPayload,
  countCartonUnits,
  mergeTemplateWithSupplementaryPallets,
  packTemplateRemainderAdaptive,
} from "./templateLock";
import { isPackingCancelledError, type PackingProgressReporter } from "./packingProgress";
import type {
  TemplateLockAttemptResult,
  TemplateLockCandidateInput,
} from "./packingWorkflowTypes";

interface TryApplyTemplateLockArgs {
  pallet: PalletInput;
  cartons: CartonInput[];
  nextPallet: PalletInput;
  sampleTemplateLockEnabled: boolean;
  templateLockCandidate: TemplateLockCandidateInput | null;
  progressReporter?: PackingProgressReporter | null;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  if (typeof error === "string" && error.trim().length > 0) return error;
  return "Unknown error";
}

export async function tryApplyTemplateLock({
  pallet,
  cartons,
  nextPallet,
  sampleTemplateLockEnabled,
  templateLockCandidate,
  progressReporter,
}: TryApplyTemplateLockArgs): Promise<TemplateLockAttemptResult> {
  progressReporter?.throwIfCancelled();
  if (!sampleTemplateLockEnabled) {
    return {
      result: null,
      templateStatus: null,
    };
  }

  if (!templateLockCandidate) {
    return {
      result: null,
      templateStatus: "Template lock: no compatible sample",
    };
  }

  try {
    if (progressReporter) {
      await progressReporter.report({
        stage: "tryingTemplateLock",
        packedUnits: 0,
        detail: templateLockCandidate.sample.fileName,
      }, { force: true, yieldToUi: true });
    }
    const loaded = await invoke<LoadLayoutSampleResponse>("load_layout_sample", {
      request: { filePath: templateLockCandidate.sample.filePath },
    });
    progressReporter?.throwIfCancelled();
    const templated = buildTemplateResultFromPayload(loaded.payload, pallet, cartons);
    if (!templated) {
      return {
        result: null,
        templateStatus: "Template lock: rejected (invalid geometry or limits)",
      };
    }

    let result = templated.result;
    if (progressReporter) {
      await progressReporter.report({
        stage: "tryingTemplateLock",
        packedUnits: result.packedUnits,
        detail: templateLockCandidate.sample.fileName,
      }, { force: true });
    }
    let templateStatus = `Template lock: applied (${templated.note}, ${templateLockCandidate.matchKind})`;
    if (
      (nextPallet.extraPalletMode === "full" || nextPallet.extraPalletMode === "limitsOnly")
      && countCartonUnits(result.unpacked) > 0
    ) {
      let templateContinuationPacked = 0;
      let templateContinuationPasses = 0;
      let continuationSafety = 0;
      while (countCartonUnits(result.unpacked) > 0 && continuationSafety < 96) {
        progressReporter?.throwIfCancelled();
        continuationSafety += 1;
        const remainderBefore = countCartonUnits(result.unpacked);
        if (progressReporter) {
          await progressReporter.report({
            stage: "templateContinuation",
            packedUnits: result.packedUnits,
            detail: templateLockCandidate.sample.fileName,
            palletIndex: continuationSafety + 1,
          });
        }
        const nextTemplate = buildTemplateResultFromPayload(
          loaded.payload,
          pallet,
          result.unpacked.map((carton) => ({ ...carton })),
        );
        progressReporter?.throwIfCancelled();
        if (!nextTemplate) break;

        const remainderAfter = countCartonUnits(nextTemplate.result.unpacked);
        const packedThisPass = Math.max(0, remainderBefore - remainderAfter);
        if (packedThisPass <= 0) break;

        result = mergeTemplateWithSupplementaryPallets(result, nextTemplate.result, nextPallet);
        templateContinuationPacked += packedThisPass;
        templateContinuationPasses += 1;
      }

      const noGuidancePallet: PalletInput = {
        ...nextPallet,
        sampleGuidance: undefined,
      };
      if (progressReporter) {
        await progressReporter.report({
          stage: "packingSupplementary",
          packedUnits: result.packedUnits,
          detail: templateLockCandidate.sample.fileName,
        }, { force: true, yieldToUi: true });
      }
      progressReporter?.throwIfCancelled();
      const adaptiveSupplementary = packTemplateRemainderAdaptive(
        noGuidancePallet,
        result.unpacked.map((carton) => ({ ...carton })),
      );
      progressReporter?.throwIfCancelled();
      result = mergeTemplateWithSupplementaryPallets(
        result,
        adaptiveSupplementary.result,
        nextPallet,
      );

      if (templateContinuationPacked > 0) {
        templateStatus += ` + template continuation (${templateContinuationPacked} packed in ${templateContinuationPasses} passes)`;
      }
      if (adaptiveSupplementary.result.packedUnits > 0) {
        const usedStyleKinds = Array.from(new Set(adaptiveSupplementary.usedStyles));
        const styleLabel = usedStyleKinds.length === 1
          ? usedStyleKinds[0]
          : "adaptive";
        templateStatus += ` + extra pallets (${adaptiveSupplementary.result.packedUnits} packed from remainder, style=${styleLabel})`;
      }
    }

    return {
      result,
      templateStatus,
    };
  } catch (error) {
    if (isPackingCancelledError(error)) {
      throw error;
    }
    return {
      result: null,
      templateStatus: `Template lock: failed (${toErrorMessage(error)})`,
    };
  }
}
