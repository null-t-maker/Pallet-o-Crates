export { roundTo, overlapArea2D, hasFullVerticalSupport, overlapVolume3D } from "./templateLockMath";
export type { ParsedTemplatePlacement } from "./templateLockPlacementParsing";
export {
  asRecord,
  buildPlacementOffsetsByIndex,
  comparePlacementByPalletAndSpatialOrder,
  comparePlacementBySpatialOrder,
  parseTemplatePlacements,
} from "./templateLockPlacementParsing";
export type { ShapeDescriptor, TemplateDemandState } from "./templateLockShapeState";
export {
  buildTemplateDemandState,
  collectTemplateShapeStats,
  getActiveShapeKeys,
} from "./templateLockShapeState";
