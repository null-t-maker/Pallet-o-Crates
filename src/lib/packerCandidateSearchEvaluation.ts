import type { NormalizedSampleGuidance } from "./packerConfig";
import type { CartonInput, PalletInput } from "./packerTypes";
import type {
  EvaluationProfile,
  LayerState,
  Rect,
  SelectionMode,
} from "./packerCoreTypes";
import type { TryFindBestCandidateDeps } from "./packerCandidateSearchTypes";
import { scoreCandidateSelection } from "./packerCandidateScoring";

export interface CandidateSearchContext {
  packingStyle: "centerCompact" | "edgeAligned";
  sampleGuidance: NormalizedSampleGuidance | null;
  preferCenterMode: boolean;
  singleActiveType: boolean;
  uniformStackMode: boolean;
  criticalTypeIds: Set<string> | null;
}

interface EvaluateModeCandidateArgs {
  pallet: PalletInput;
  rem: CartonInput[];
  carton: CartonInput;
  state: LayerState;
  profile: EvaluationProfile;
  mode: SelectionMode;
  count: number;
  capacity: number;
  availableRects: Rect[];
  blockedRects: Rect[];
  preferredDifferentTypeId: string | null;
  baseCritical: boolean;
  context: CandidateSearchContext;
  deps: TryFindBestCandidateDeps;
}

interface ModeCandidateResult {
  rects: Rect[];
  score: number;
  layoutHash: string;
}

export function evaluateModeCandidate({
  pallet,
  rem,
  carton,
  state,
  profile,
  mode,
  count,
  capacity,
  availableRects,
  blockedRects,
  preferredDifferentTypeId,
  baseCritical,
  context,
  deps,
}: EvaluateModeCandidateArgs): ModeCandidateResult | null {
  const selectedRaw = deps.selectRects(
    availableRects,
    count,
    mode,
    pallet.width,
    pallet.length,
  );
  const canRecenter = context.preferCenterMode && blockedRects.length === 0;
  const selected = canRecenter
    ? deps.sortRects(deps.recenterRects(selectedRaw, pallet.width, pallet.length))
    : selectedRaw;
  if (selected.length === 0) return null;
  if (!deps.isRectSetPlacementSafe(selected, blockedRects, pallet.width, pallet.length)) return null;

  const remainingSameType = carton.quantity - selected.length;
  const remainingTotalAfterPlacement = rem.reduce((sum, cart) => {
    const quantity = cart.id === carton.id ? cart.quantity - selected.length : cart.quantity;
    return sum + Math.max(0, quantity);
  }, 0);
  const evaluation = deps.evaluateCandidate(
    pallet,
    carton,
    selected,
    capacity,
    mode,
    state,
    profile,
    remainingSameType,
    remainingTotalAfterPlacement,
    context.uniformStackMode,
    context.packingStyle,
  );
  if (!evaluation.valid) return null;

  const score = scoreCandidateSelection(
    {
      evaluationScore: evaluation.score,
      layoutHash: evaluation.layoutHash,
      selected,
      carton,
      mode,
      pallet,
      state,
      profile,
      preferredDifferentTypeId,
      sampleGuidance: context.sampleGuidance,
      singleActiveType: context.singleActiveType,
      baseCritical,
    },
    {
      centerStats: deps.centerStats,
      wallStats: deps.wallStats,
      guidanceTrialNoise: deps.guidanceTrialNoise,
    },
  );

  return {
    rects: selected,
    score,
    layoutHash: evaluation.layoutHash,
  };
}
