import type {
  CartonInput,
  MultiPackResult,
  PalletInput,
} from "./packerTypes";
import {
  asRecord,
  buildPlacementOffsetsByIndex,
  buildTemplateDemandState,
  collectTemplateShapeStats,
  getActiveShapeKeys,
  parseTemplatePlacements,
} from "./templateLockParsing";
import {
  buildFinalizedPlacements,
  buildPalletResultsFromFinalizedPlacements,
  buildUnpackedFromFinalizedPlacements,
} from "./templateLockFinalization";
import { selectTemplatePlacements } from "./templateLockSelection";
export {
  countCartonUnits,
  isBetterMultiPackResult,
  mergeTemplateWithSupplementaryPallets,
  packTemplateRemainderAdaptive,
} from "./templateLockAdaptive";

export interface TemplateBuildResult {
  result: MultiPackResult;
  note: string;
}

export function buildTemplateResultFromPayload(
  payload: unknown,
  pallet: PalletInput,
  cartons: CartonInput[],
): TemplateBuildResult | null {
  const root = asRecord(payload);
  if (!root) return null;

  const placementsRaw = Array.isArray(root.placements) ? root.placements : null;
  if (!placementsRaw || placementsRaw.length === 0) return null;

  const {
    cartonById,
    requestedByType,
    requestedByShape,
    typeIdsByShape,
    descriptorByShape,
  } = buildTemplateDemandState(cartons);

  const shapeDescriptors = Array.from(descriptorByShape.values());

  const placementOffsetsByIndex = buildPlacementOffsetsByIndex(root);
  const parsedPlacements = parseTemplatePlacements(
    placementsRaw,
    pallet,
    shapeDescriptors,
    placementOffsetsByIndex,
  );
  if (!parsedPlacements) return null;

  const { templateByShape, hasUnknownShapePlacements } = collectTemplateShapeStats(parsedPlacements);
  const activeShapeKeys = getActiveShapeKeys(requestedByShape);
  const selectedPlacements = selectTemplatePlacements(
    parsedPlacements,
    activeShapeKeys,
    requestedByShape,
    templateByShape,
    hasUnknownShapePlacements,
    pallet,
  );
  if (!selectedPlacements || selectedPlacements.length === 0) return null;

  const finalizedPlacements = buildFinalizedPlacements(
    selectedPlacements,
    requestedByType,
    typeIdsByShape,
    cartonById,
  );
  if (!finalizedPlacements || finalizedPlacements.length === 0) return null;

  const palletsResult = buildPalletResultsFromFinalizedPlacements(finalizedPlacements, pallet);
  if (!palletsResult) return null;

  const { requestedUnits, unpacked, packedUnits } = buildUnpackedFromFinalizedPlacements(cartons, finalizedPlacements);
  const totalWeight = palletsResult.reduce((sum, placed) => sum + placed.result.totalWeight, 0);
  const maxHeight = palletsResult.reduce((max, placed) => Math.max(max, placed.result.totalHeight), 0);

  const descriptor = typeof root.descriptor === "string" && root.descriptor.trim().length > 0
    ? root.descriptor.trim()
    : "unnamed sample";

  return {
    result: {
      pallets: palletsResult,
      totalWeight,
      maxHeight,
      unpacked,
      packedUnits,
      requestedUnits,
    },
    note: descriptor,
  };
}

