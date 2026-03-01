export const BASE_H = 144;
export const WOOD = "#c9a06c";

export {
  MIN_TRANSLATION_PROGRESS_MM,
  WORKSPACE_LIMIT_MM,
  clampValue,
  displayCartonColor,
  hasCartonCollision,
  isValidCartonGeometry,
  quantizeToStep,
  roundMm,
  snapTranslationToFreePosition,
} from "./visualizerCartonMath";

export { patchTransformControlsOutwardGizmo } from "./visualizerGizmoPatch";
