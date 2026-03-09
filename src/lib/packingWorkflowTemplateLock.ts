import { invoke } from "@tauri-apps/api/core";
import type { CartonInput, PalletInput } from "./packerTypes";
import { LoadLayoutSampleResponse } from "./layoutSamples";
import {
  buildTemplateResultFromPayload,
  countCartonUnits,
  mergeTemplateWithSupplementaryPallets,
  packTemplateRemainderAdaptive,
} from "./templateLock";
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
}: TryApplyTemplateLockArgs): Promise<TemplateLockAttemptResult> {
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
    const loaded = await invoke<LoadLayoutSampleResponse>("load_layout_sample", {
      request: { filePath: templateLockCandidate.sample.filePath },
    });
    const templated = buildTemplateResultFromPayload(loaded.payload, pallet, cartons);
    if (!templated) {
      return {
        result: null,
        templateStatus: "Template lock: rejected (invalid geometry or limits)",
      };
    }

    let result = templated.result;
    let templateStatus = `Template lock: applied (${templated.note}, ${templateLockCandidate.matchKind})`;
    if (
      (nextPallet.extraPalletMode === "full" || nextPallet.extraPalletMode === "limitsOnly")
      && countCartonUnits(result.unpacked) > 0
    ) {
      let templateContinuationPacked = 0;
      let templateContinuationPasses = 0;
      let continuationSafety = 0;
      while (countCartonUnits(result.unpacked) > 0 && continuationSafety < 96) {
        continuationSafety += 1;
        const remainderBefore = countCartonUnits(result.unpacked);
        const nextTemplate = buildTemplateResultFromPayload(
          loaded.payload,
          pallet,
          result.unpacked.map((carton) => ({ ...carton })),
        );
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
      const adaptiveSupplementary = packTemplateRemainderAdaptive(
        noGuidancePallet,
        result.unpacked.map((carton) => ({ ...carton })),
      );
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
    return {
      result: null,
      templateStatus: `Template lock: failed (${toErrorMessage(error)})`,
    };
  }
}
