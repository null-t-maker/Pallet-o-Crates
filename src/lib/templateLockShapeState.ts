import type { CartonInput, PackedCarton } from "./packerTypes";
import { roundTo } from "./templateLockMath";

export interface ShapeDescriptor {
  key: string;
  width: number;
  length: number;
  height: number;
  weight: number;
}

export interface TemplateDemandState {
  cartonById: Map<string, CartonInput>;
  requestedByType: Map<string, number>;
  requestedByShape: Map<string, number>;
  typeIdsByShape: Map<string, string[]>;
  descriptorByShape: Map<string, ShapeDescriptor>;
}

function buildShapeKey(width: number, length: number, height: number, weight: number): string {
  const minSide = roundTo(Math.min(width, length), 2).toFixed(2);
  const maxSide = roundTo(Math.max(width, length), 2).toFixed(2);
  const normalizedHeight = roundTo(height, 2).toFixed(2);
  const normalizedWeight = roundTo(weight, 3).toFixed(3);
  return `${minSide}x${maxSide}x${normalizedHeight}@${normalizedWeight}`;
}

function buildShapeDescriptor(
  width: number,
  length: number,
  height: number,
  weight: number,
): ShapeDescriptor {
  return {
    key: buildShapeKey(width, length, height, weight),
    width,
    length,
    height,
    weight,
  };
}

export function findMatchingCartonShapeKey(
  placement: PackedCarton,
  descriptors: ShapeDescriptor[],
): string | null {
  const eps = 0.5;
  for (const descriptor of descriptors) {
    const sameHeight = Math.abs(placement.h - descriptor.height) <= eps;
    const sameWeight = Math.abs(placement.weight - descriptor.weight) <= 0.05;
    const orientA = Math.abs(placement.w - descriptor.width) <= eps
      && Math.abs(placement.l - descriptor.length) <= eps;
    const orientB = Math.abs(placement.w - descriptor.length) <= eps
      && Math.abs(placement.l - descriptor.width) <= eps;
    if (sameHeight && sameWeight && (orientA || orientB)) {
      return descriptor.key;
    }
  }
  return null;
}

export function buildTemplateDemandState(cartons: CartonInput[]): TemplateDemandState {
  const cartonById = new Map<string, CartonInput>();
  const requestedByType = new Map<string, number>();
  const requestedByShape = new Map<string, number>();
  const typeIdsByShape = new Map<string, string[]>();
  const descriptorByShape = new Map<string, ShapeDescriptor>();

  for (const carton of cartons) {
    cartonById.set(carton.id, carton);
    const requested = Math.max(0, Math.floor(carton.quantity));
    requestedByType.set(carton.id, requested);

    const descriptor = buildShapeDescriptor(
      carton.width,
      carton.length,
      carton.height,
      carton.weight,
    );
    descriptorByShape.set(descriptor.key, descriptor);
    requestedByShape.set(
      descriptor.key,
      (requestedByShape.get(descriptor.key) ?? 0) + requested,
    );

    const ids = typeIdsByShape.get(descriptor.key) ?? [];
    if (!ids.includes(carton.id)) {
      ids.push(carton.id);
      typeIdsByShape.set(descriptor.key, ids);
    }
  }

  return {
    cartonById,
    requestedByType,
    requestedByShape,
    typeIdsByShape,
    descriptorByShape,
  };
}

export function collectTemplateShapeStats(parsedPlacements: Array<{ matchedShapeKey: string | null }>): {
  templateByShape: Map<string, number>;
  hasUnknownShapePlacements: boolean;
} {
  const templateByShape = new Map<string, number>();
  let hasUnknownShapePlacements = false;

  for (const placement of parsedPlacements) {
    if (!placement.matchedShapeKey) {
      hasUnknownShapePlacements = true;
      continue;
    }
    templateByShape.set(
      placement.matchedShapeKey,
      (templateByShape.get(placement.matchedShapeKey) ?? 0) + 1,
    );
  }

  return {
    templateByShape,
    hasUnknownShapePlacements,
  };
}

export function getActiveShapeKeys(requestedByShape: Map<string, number>): string[] {
  return Array.from(requestedByShape.entries())
    .filter(([, requested]) => requested > 0)
    .map(([shapeKey]) => shapeKey);
}
