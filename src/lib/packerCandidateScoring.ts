import type { NormalizedSampleGuidance } from "./packerConfig";
import type { CartonInput, PalletInput } from "./packerTypes";
import type { EvaluationProfile, LayerState, Rect, SelectionMode } from "./packerCoreTypes";

interface ScoreGuidanceDeps {
  centerStats: (
    rects: Rect[],
    palletWidth: number,
    palletLength: number,
  ) => { occupancy: number; axisCoverage: number; hasCentralGap: boolean };
  wallStats: (
    rects: Rect[],
    palletWidth: number,
    palletLength: number,
  ) => { coverage: number; balance: number; segments: number };
  guidanceTrialNoise: (guidance: NormalizedSampleGuidance | null, token: string) => number;
}

interface ScoreCandidateParams {
  evaluationScore: number;
  layoutHash: string;
  selected: Rect[];
  carton: CartonInput;
  mode: SelectionMode;
  pallet: PalletInput;
  state: LayerState;
  profile: EvaluationProfile;
  preferredDifferentTypeId: string | null;
  sampleGuidance: NormalizedSampleGuidance | null;
  singleActiveType: boolean;
  baseCritical: boolean;
}

export function scoreCandidateSelection(
  params: ScoreCandidateParams,
  deps: ScoreGuidanceDeps,
): number {
  const {
    evaluationScore,
    layoutHash,
    selected,
    carton,
    mode,
    pallet,
    state,
    profile,
    preferredDifferentTypeId,
    sampleGuidance,
    singleActiveType,
    baseCritical,
  } = params;

  let scored = evaluationScore;
  if (singleActiveType && profile !== "rescue") {
    scored += selected.length * 4000;
  }
  const waitLayers = state.typeWaitById.get(carton.id) ?? 0;
  scored += Math.min(8, waitLayers) * 95;
  if (state.prevLayerTypeId === carton.id) scored -= 120;
  if (preferredDifferentTypeId) {
    scored += carton.id === preferredDifferentTypeId ? -260 : 90;
  }

  if (baseCritical) {
    if (state.prevPlacements.length === 0) {
      scored += 14_000;
    } else if (state.layerIndex <= 2) {
      scored += 4_200;
    }
  }

  if (sampleGuidance) {
    const center = deps.centerStats(selected, pallet.width, pallet.length);
    const walls = deps.wallStats(selected, pallet.width, pallet.length);
    const modeWeight = 460 * sampleGuidance.confidence * sampleGuidance.cfgScale;

    if (sampleGuidance.preferredMode === "center") {
      if (mode === "center") scored += modeWeight;
      else if (mode === "pin") scored += modeWeight * 0.35;
      else scored -= modeWeight * 0.55;

      scored += center.occupancy * (sampleGuidance.confidence * sampleGuidance.cfgScale * 280);
      scored += center.axisCoverage * (sampleGuidance.confidence * sampleGuidance.cfgScale * 150);
      scored -= walls.coverage * (sampleGuidance.confidence * sampleGuidance.cfgScale * 120);
    } else {
      if (mode === "edge") scored += modeWeight;
      else if (mode === "pin") scored += modeWeight * 0.2;
      else scored -= modeWeight * 0.4;

      scored += walls.coverage * (sampleGuidance.confidence * sampleGuidance.cfgScale * 260);
      scored += walls.balance * (sampleGuidance.confidence * sampleGuidance.cfgScale * 130);
      scored -= center.occupancy * (sampleGuidance.confidence * sampleGuidance.cfgScale * 110);
    }
    const jitter = deps.guidanceTrialNoise(
      sampleGuidance,
      `${state.layerIndex}|cand|${carton.id}|${mode}|${selected.length}|${layoutHash}`,
    );
    scored += jitter * (26 * sampleGuidance.cfgScale);
  }

  return scored;
}
