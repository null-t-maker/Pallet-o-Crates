import type { PalletInput } from "./packerTypes";
import type { ParsedTemplatePlacement } from "./templateLockParsing";
import { buildSingleShapeTemplatePlacements } from "./templateLockSelectionCycling";
import { validateStrictTemplateShapeMatch } from "./templateLockSelectionValidation";

export function selectTemplatePlacements(
  parsedPlacements: ParsedTemplatePlacement[],
  activeShapeKeys: string[],
  requestedByShape: Map<string, number>,
  templateByShape: Map<string, number>,
  hasUnknownShapePlacements: boolean,
  pallet: PalletInput,
): ParsedTemplatePlacement[] | null {
  const singleShapeTemplateMode = activeShapeKeys.length === 1
    && !hasUnknownShapePlacements
    && templateByShape.size === 1
    && templateByShape.has(activeShapeKeys[0]);

  if (singleShapeTemplateMode) {
    const shapeKey = activeShapeKeys[0];
    const requestedQty = requestedByShape.get(shapeKey) ?? 0;
    return buildSingleShapeTemplatePlacements(parsedPlacements, shapeKey, requestedQty, pallet);
  }

  if (!validateStrictTemplateShapeMatch(activeShapeKeys, requestedByShape, templateByShape, hasUnknownShapePlacements)) {
    return null;
  }

  return parsedPlacements;
}
