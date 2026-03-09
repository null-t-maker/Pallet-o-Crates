import type { CandidateScoreInputs } from "./packerCandidateScoreTypes";

export function applyPackingStyleScoreAdjustments(
  score: number,
  input: CandidateScoreInputs,
): number {
  let nextScore = score;
  const futureLayersLikely = input.baseLayer && input.remainingTotalAfterPlacement > 0;

  if (input.packingStyle === "centerCompact") {
    nextScore += input.centerOccupancy * (input.baseLayer ? 190 : 150);
    nextScore += input.centerAxisCoverage * (input.baseLayer ? 130 : 85);
    nextScore += (1 - input.wallsCoverage) * (input.baseLayer ? 210 : 170);
    if (input.mode === "center") nextScore += input.baseLayer ? 280 : 170;
    if (input.mode === "pin") nextScore -= 140;
    if (input.mode === "edge") {
      nextScore -= input.baseLayer ? (input.isPartial ? 360 : 220) : (input.isPartial ? 180 : 120);
    }
    if (input.baseLayer && input.isPartial) {
      nextScore += Math.min(60, Math.max(0, input.insetsMin)) * 18;
      if (input.insetsMin < 8) nextScore -= (8 - input.insetsMin) * 120;
    }
    if (input.isPartial && input.insetsMin < 8) nextScore -= (8 - input.insetsMin) * 42;
    const lineComplexityPenalty = futureLayersLikely && !input.uniformStackMode ? 22 : 55;
    nextScore -= Math.max(0, input.lineComplexity - 4) * lineComplexityPenalty;
    if (input.baseLayer) {
      const footprintVariantPenalty = futureLayersLikely && !input.uniformStackMode ? 70 : 320;
      nextScore -= Math.max(0, input.footprintVariants - 1) * footprintVariantPenalty;
    }
    return nextScore;
  }

  nextScore += input.wallsCoverage * 140;
  nextScore += input.wallsBalance * 70;
  if (input.mode === "edge") nextScore += 190;
  if (input.mode === "center" && input.isPartial) nextScore -= 90;
  if (input.baseLayer) {
    nextScore -= Math.max(0, input.footprintVariants - 1) * 90;
    nextScore += input.fillRatio * 180;
    nextScore -= input.boundsAreaRatio * 320;
    nextScore -= Math.max(0, 0.9 - input.fillRatio) * 1800;
    nextScore -= Math.max(0, input.boundsAreaRatio - 0.8) * 700;
    if (input.isPartial && input.centerHasGap && input.fillRatio < 0.9) nextScore -= 520;
  }
  return nextScore;
}
