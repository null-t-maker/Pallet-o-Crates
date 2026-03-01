export function validateStrictTemplateShapeMatch(
  activeShapeKeys: string[],
  requestedByShape: Map<string, number>,
  templateByShape: Map<string, number>,
  hasUnknownShapePlacements: boolean,
): boolean {
  if (hasUnknownShapePlacements) return false;

  for (const shapeKey of activeShapeKeys) {
    const requested = requestedByShape.get(shapeKey) ?? 0;
    const templated = templateByShape.get(shapeKey) ?? 0;
    if (requested !== templated) return false;
  }
  for (const shapeKey of templateByShape.keys()) {
    const requested = requestedByShape.get(shapeKey) ?? 0;
    if (requested <= 0) return false;
  }
  return true;
}
