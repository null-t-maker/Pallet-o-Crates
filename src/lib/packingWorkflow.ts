import { invoke } from "@tauri-apps/api/core";
import {
  packPallets,
} from "./packer";
import type {
  CartonInput,
  MultiPackResult,
  PackSampleGuidance,
  PalletInput,
} from "./packerTypes";
import { LoadLayoutSampleResponse } from "./layoutSamples";
import {
  buildTemplateResultFromPayload,
  countCartonUnits,
  isBetterMultiPackResult,
  mergeTemplateWithSupplementaryPallets,
  packTemplateRemainderAdaptive,
} from "./templateLock";

interface TemplateLockCandidateInput {
  sample: {
    filePath: string;
    fileName: string;
  };
  matchKind: "exact" | "shape";
}

interface CalculatePackingResult {
  result: MultiPackResult;
  templateStatus: string | null;
}

interface TemplateLockAttemptResult {
  result: MultiPackResult | null;
  templateStatus: string | null;
}

interface CalculatePackingArgs {
  pallet: PalletInput;
  cartons: CartonInput[];
  sampleGuidance: PackSampleGuidance | null;
  sampleTemplateLockEnabled: boolean;
  templateLockCandidate: TemplateLockCandidateInput | null;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  if (typeof error === "string" && error.trim().length > 0) return error;
  return "Unknown error";
}

function applySampleGuidance(
  pallet: PalletInput,
  sampleGuidance: PackSampleGuidance | null,
): PalletInput {
  const nextPallet: PalletInput = { ...pallet };
  if (!sampleGuidance) return nextPallet;

  nextPallet.sampleGuidance = sampleGuidance;
  if (
    (sampleGuidance.confidence ?? 0) >= 0.72
    && sampleGuidance.preferredPackingStyle
  ) {
    nextPallet.packingStyle = sampleGuidance.preferredPackingStyle;
  }
  return nextPallet;
}

function calculateGuidedWithFallback(
  pallet: PalletInput,
  cartons: CartonInput[],
  sampleGuidance: PackSampleGuidance | null,
): MultiPackResult {
  const guided = packPallets(pallet, cartons.map((carton) => ({ ...carton })));
  if (!sampleGuidance) return guided;

  const unguided = packPallets(
    { ...pallet, sampleGuidance: undefined },
    cartons.map((carton) => ({ ...carton })),
  );
  return isBetterMultiPackResult(unguided, guided) ? unguided : guided;
}

async function tryApplyTemplateLock(
  pallet: PalletInput,
  cartons: CartonInput[],
  nextPallet: PalletInput,
  sampleTemplateLockEnabled: boolean,
  templateLockCandidate: TemplateLockCandidateInput | null,
): Promise<TemplateLockAttemptResult> {
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

export async function calculatePacking({
  pallet,
  cartons,
  sampleGuidance,
  sampleTemplateLockEnabled,
  templateLockCandidate,
}: CalculatePackingArgs): Promise<CalculatePackingResult> {
  const nextPallet = applySampleGuidance(pallet, sampleGuidance);
  const templateAttempt = await tryApplyTemplateLock(
    pallet,
    cartons,
    nextPallet,
    sampleTemplateLockEnabled,
    templateLockCandidate,
  );
  const result = templateAttempt.result ?? calculateGuidedWithFallback(nextPallet, cartons, sampleGuidance);

  return {
    result,
    templateStatus: templateAttempt.templateStatus,
  };
}
