import type { CartonInput } from "./packerTypes";
import { comparePlacementByPalletAndSpatialOrder, type ParsedTemplatePlacement } from "./templateLockParsing";
import type { FinalTemplatePlacement } from "./templateLockFinalizationTypes";

function buildQuotaByType(
  candidateTypeIds: string[],
  slotCount: number,
  remainingByType: Map<string, number>,
): Map<string, number> | null {
  const availableForShape = candidateTypeIds.reduce(
    (sum, typeId) => sum + Math.max(0, remainingByType.get(typeId) ?? 0),
    0,
  );
  if (availableForShape < slotCount) return null;

  const quotaByType = new Map<string, number>();
  let assignedSlots = 0;
  const fractional: Array<{ typeId: string; fraction: number; remaining: number; order: number }> = [];

  for (let i = 0; i < candidateTypeIds.length; i++) {
    const typeId = candidateTypeIds[i];
    const remaining = Math.max(0, remainingByType.get(typeId) ?? 0);
    if (remaining <= 0) {
      quotaByType.set(typeId, 0);
      continue;
    }
    const rawShare = (slotCount * remaining) / availableForShape;
    const baseShare = Math.min(remaining, Math.floor(rawShare));
    quotaByType.set(typeId, baseShare);
    assignedSlots += baseShare;
    fractional.push({
      typeId,
      fraction: rawShare - baseShare,
      remaining,
      order: i,
    });
  }

  let leftToAssign = slotCount - assignedSlots;
  fractional.sort((a, b) => {
    if (Math.abs(a.fraction - b.fraction) > 1e-9) return b.fraction - a.fraction;
    if (a.remaining !== b.remaining) return b.remaining - a.remaining;
    return a.order - b.order;
  });

  while (leftToAssign > 0) {
    let advanced = false;
    for (const part of fractional) {
      if (leftToAssign <= 0) break;
      const currentQuota = quotaByType.get(part.typeId) ?? 0;
      const maxQuota = Math.max(0, remainingByType.get(part.typeId) ?? 0);
      if (currentQuota >= maxQuota) continue;
      quotaByType.set(part.typeId, currentQuota + 1);
      leftToAssign -= 1;
      advanced = true;
    }
    if (!advanced) break;
  }

  if (leftToAssign > 0) {
    for (const typeId of candidateTypeIds) {
      while (leftToAssign > 0) {
        const currentQuota = quotaByType.get(typeId) ?? 0;
        const maxQuota = Math.max(0, remainingByType.get(typeId) ?? 0);
        if (currentQuota >= maxQuota) break;
        quotaByType.set(typeId, currentQuota + 1);
        leftToAssign -= 1;
      }
    }
  }

  return leftToAssign > 0 ? null : quotaByType;
}

export function buildFinalizedPlacements(
  selectedPlacements: ParsedTemplatePlacement[],
  requestedByType: Map<string, number>,
  typeIdsByShape: Map<string, string[]>,
  cartonById: Map<string, CartonInput>,
): FinalTemplatePlacement[] | null {
  const remainingByType = new Map<string, number>(requestedByType);
  const finalizedPlacements: FinalTemplatePlacement[] = [];
  const placementsByShape = new Map<string, ParsedTemplatePlacement[]>();

  for (const placement of selectedPlacements) {
    const shapeKey = placement.matchedShapeKey;
    if (!shapeKey) return null;
    const bucket = placementsByShape.get(shapeKey) ?? [];
    bucket.push(placement);
    placementsByShape.set(shapeKey, bucket);
  }

  for (const [shapeKey, placementsForShapeUnsorted] of placementsByShape.entries()) {
    const candidateTypeIds = (typeIdsByShape.get(shapeKey) ?? [])
      .filter((typeId) => (remainingByType.get(typeId) ?? 0) > 0);
    if (candidateTypeIds.length === 0) return null;

    const placementsForShape = [...placementsForShapeUnsorted].sort(comparePlacementByPalletAndSpatialOrder);
    const quotaByType = buildQuotaByType(candidateTypeIds, placementsForShape.length, remainingByType);
    if (!quotaByType) return null;

    let cursor = 0;
    for (const typeId of candidateTypeIds) {
      const takeCount = quotaByType.get(typeId) ?? 0;
      if (takeCount <= 0) continue;
      const assignedType = cartonById.get(typeId);
      if (!assignedType) return null;

      for (let i = 0; i < takeCount; i++) {
        const placement = placementsForShape[cursor];
        if (!placement) return null;
        cursor += 1;
        finalizedPlacements.push({
          ...placement,
          assignedTypeId: typeId,
          carton: {
            ...placement.carton,
            id: `${placement.carton.id}::${typeId}::${finalizedPlacements.length + 1}`,
            typeId,
            title: assignedType.title,
            color: assignedType.color,
            weight: assignedType.weight,
          },
        });
      }

      const remainingAfter = Math.max(0, (remainingByType.get(typeId) ?? 0) - takeCount);
      remainingByType.set(typeId, remainingAfter);
    }
  }

  return finalizedPlacements;
}
