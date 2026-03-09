import type { CartonInput } from "./packerTypes";
import type { LayerState, Rect } from "./packerCoreTypes";
import type { EvaluateCandidateDeps } from "./packerCandidateEvaluationTypes";

export interface SupportAnalysisResult {
  avgSupport: number;
  lowSupportCount: number;
  pressureMarginSum: number;
  crossBondCount: number;
  exactAlignedCount: number;
  towerPenalty: number;
  alignmentRatio: number;
  hasMeaningfulCrossBond: boolean;
  stronglyColumnLikeLayer: boolean;
}

export function analyzeSupportAndTower(
  rects: Rect[],
  state: LayerState,
  carton: CartonInput,
  nearTail: boolean,
  rescue: boolean,
  uniformStackMode: boolean,
  pressureFactor: number,
  deps: EvaluateCandidateDeps,
): SupportAnalysisResult | null {
  let supportSum = 0;
  let lowSupportCount = 0;
  let pressureMarginSum = 0;
  let crossBondCount = 0;
  let towerPenalty = 0;

  for (const rect of rects) {
    const support = deps.analyzeSupport(rect, state.prevPlacements);
    const supportOk = state.prevPlacements.length === 0 || deps.hasFullSupport(support);

    if (!supportOk) return null;

    if (state.prevPlacements.length > 0) {
      if (!deps.structuralSupportSafe(carton.weight, deps.areaOf(rect), support)) return null;

      const localPressureFactor = support.touching <= 1
        ? Math.min(pressureFactor, rescue ? 2.1 : 2.0)
        : pressureFactor;
      const pressure = deps.pressureSafe(carton.weight, support, localPressureFactor);
      if (!pressure.ok) return null;
      pressureMarginSum += pressure.marginScore;

      if (support.maxOverlapRatio >= 0.26 && support.maxOverlapRatio <= 0.84 && support.touching >= 2) {
        crossBondCount += 1;
      }
    }

    supportSum += support.ratio;
    if (support.ratio < deps.MIN_FULL_SUPPORT_RATIO + 0.01) lowSupportCount++;
  }

  const exactAlignedCount = deps.exactAlignmentCount(rects, state.prevPlacements);
  const alignmentRatio = rects.length > 0 ? (exactAlignedCount / rects.length) : 1;
  const hasMeaningfulCrossBond = crossBondCount >= Math.max(1, Math.floor(rects.length * 0.15));

  const stronglyColumnLikeLayer = state.prevPlacements.length > 0
    && !uniformStackMode
    && !rescue
    && !nearTail
    && alignmentRatio >= 0.88
    && !hasMeaningfulCrossBond;

  for (const rect of rects) {
    const footprintKey = deps.footprintKey(rect);
    const typedKey = deps.typedFootprintKey(rect, carton.id);
    const nextFoot = (state.streakByFootprint.get(footprintKey) ?? 0) + 1;
    const nextType = (state.streakByType.get(typedKey) ?? 0) + 1;
    towerPenalty += Math.max(0, nextFoot - 2) * 1.2;
    towerPenalty += Math.max(0, nextType - 1) * 1.7;
  }

  return {
    avgSupport: supportSum / rects.length,
    lowSupportCount,
    pressureMarginSum,
    crossBondCount,
    exactAlignedCount,
    towerPenalty,
    alignmentRatio,
    hasMeaningfulCrossBond,
    stronglyColumnLikeLayer,
  };
}
