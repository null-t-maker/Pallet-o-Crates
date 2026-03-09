import type { CartonInput, PalletInput } from "./packerTypes";
import type { LayerState } from "./packerCoreTypes";
import {
  collectActiveTypeIds,
  collectCriticalTypeIds,
  resolveUniformStackMode,
} from "./packerCandidateSearchHelpers";
import type { TryFindBestCandidateDeps } from "./packerCandidateSearchTypes";
import type { CandidateSearchContext } from "./packerCandidateSearchEvaluation";

interface BuildCandidateSearchContextArgs {
  pallet: PalletInput;
  rem: CartonInput[];
  state: LayerState;
  remainingWeight: number;
  zBase: number;
  heightCeil: number | null;
  enforceCriticalFirst: boolean;
  deps: TryFindBestCandidateDeps;
}

export function buildCandidateSearchContext({
  pallet,
  rem,
  state,
  remainingWeight,
  zBase,
  heightCeil,
  enforceCriticalFirst,
  deps,
}: BuildCandidateSearchContextArgs): CandidateSearchContext {
  const packingStyle = deps.resolvePackingStyle(pallet);
  const sampleGuidance = deps.resolveSampleGuidance(pallet);
  const preferCenterMode = packingStyle === "centerCompact";
  const activeTypeIds = collectActiveTypeIds(
    rem,
    pallet,
    zBase,
    heightCeil,
    remainingWeight,
    deps.EPS,
  );
  const singleActiveType = activeTypeIds.size <= 1;
  const uniformStackMode = resolveUniformStackMode(
    rem,
    pallet,
    zBase,
    heightCeil,
    deps.EPS,
    singleActiveType,
    state.layerIndex,
  );
  const criticalTypeIds = enforceCriticalFirst
    ? collectCriticalTypeIds(
      rem,
      state.prevPlacements,
      zBase,
      pallet,
      heightCeil,
      remainingWeight,
      deps.EPS,
    )
    : null;

  return {
    packingStyle,
    sampleGuidance,
    preferCenterMode,
    singleActiveType,
    uniformStackMode,
    criticalTypeIds,
  };
}
