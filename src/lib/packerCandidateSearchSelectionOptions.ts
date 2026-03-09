import type { EvaluationProfile, SelectionMode } from "./packerCoreTypes";

export function buildCountOptions(
  maxCount: number,
  mustKeepFullCountAtBase: boolean,
  allowShapeDeviation: boolean,
  profile: EvaluationProfile,
  centerGapStreak: number,
  layerIndex: number,
): number[] {
  const countOptions = new Set<number>([maxCount]);
  if (!mustKeepFullCountAtBase) {
    if (allowShapeDeviation) {
      if (maxCount > 2) countOptions.add(maxCount - 1);
      if (maxCount > 4) countOptions.add(maxCount - 2);
      if (maxCount > 6 && (centerGapStreak > 0 || layerIndex >= 2)) {
        countOptions.add(Math.max(2, Math.floor(maxCount * 0.85)));
      }
    }
    if (profile === "rescue" && allowShapeDeviation) {
      for (let n = 1; n <= Math.min(8, maxCount); n++) countOptions.add(n);
      if (maxCount > 8) countOptions.add(Math.max(2, Math.floor(maxCount * 0.65)));
    }
  }

  return Array.from(countOptions)
    .filter((count) => count > 0 && count <= maxCount)
    .sort((a, b) => b - a);
}

export function buildModeOptions(
  preferCenterMode: boolean,
  singleActiveType: boolean,
  hasSpareSlots: boolean,
  likelyTaper: boolean,
  allowShapeDeviation: boolean,
  profile: EvaluationProfile,
  nearTailForCarton: boolean,
  layerIndex: number,
): SelectionMode[] {
  const modeSet = new Set<SelectionMode>([
    preferCenterMode ? "center" : "edge",
  ]);
  if (preferCenterMode && singleActiveType) {
    modeSet.add("edge");
  }
  if ((hasSpareSlots || likelyTaper) && allowShapeDeviation) {
    if (preferCenterMode) {
      if (profile === "rescue") {
        modeSet.add("pin");
      }
      if (nearTailForCarton || layerIndex >= 3 || profile === "rescue") {
        modeSet.add("edge");
      }
    } else {
      modeSet.add("center");
      modeSet.add("pin");
    }
  }
  if (profile === "rescue" && allowShapeDeviation) {
    modeSet.add("center");
    modeSet.add("pin");
    modeSet.add("edge");
  }
  return Array.from(modeSet);
}

export function shouldSkipMode(
  mode: SelectionMode,
  profile: EvaluationProfile,
  count: number,
  capacity: number,
  centerGapStreak: number,
): boolean {
  return mode === "pin"
    && profile !== "rescue"
    && count > Math.max(6, Math.floor(capacity * 0.6))
    && centerGapStreak === 0;
}
