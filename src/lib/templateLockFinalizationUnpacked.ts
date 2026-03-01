import type { CartonInput } from "./packerTypes";
import type { FinalTemplatePlacement } from "./templateLockFinalizationTypes";

function countCartonUnits(cartons: CartonInput[]): number {
  return cartons.reduce((sum, carton) => sum + Math.max(0, Math.floor(carton.quantity)), 0);
}

export function buildUnpackedFromFinalizedPlacements(
  cartons: CartonInput[],
  finalizedPlacements: FinalTemplatePlacement[],
): { requestedUnits: number; unpacked: CartonInput[]; packedUnits: number } {
  const requestedUnits = countCartonUnits(cartons);
  const packedByType = new Map<string, number>();
  for (const placement of finalizedPlacements) {
    packedByType.set(
      placement.assignedTypeId,
      (packedByType.get(placement.assignedTypeId) ?? 0) + 1,
    );
  }

  const unpacked: CartonInput[] = cartons
    .map((carton) => {
      const requested = Math.max(0, Math.floor(carton.quantity));
      const packed = Math.min(requested, packedByType.get(carton.id) ?? 0);
      return {
        ...carton,
        quantity: Math.max(0, requested - packed),
      };
    })
    .filter((carton) => carton.quantity > 0);

  const unpackedUnits = countCartonUnits(unpacked);
  return {
    requestedUnits,
    unpacked,
    packedUnits: Math.max(0, requestedUnits - unpackedUnits),
  };
}
