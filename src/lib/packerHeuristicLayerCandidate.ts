import type { CartonInput, PalletInput } from "./packerTypes";
import type {
  BestCandidate,
  LayerState,
  Pattern,
  Rect,
} from "./packerCoreTypes";
import type { HeuristicRunnerDeps } from "./packerHeuristicTypes";

interface ResolveBestCandidateArgs {
  safePallet: PalletInput;
  rem: CartonInput[];
  state: LayerState;
  remainingWeight: number;
  patternCache: Map<string, Pattern[]>;
  zBase: number;
  blockedAtZ: Rect[];
  deps: HeuristicRunnerDeps;
}

export function resolveBestHeuristicLayerCandidate({
  safePallet,
  rem,
  state,
  remainingWeight,
  patternCache,
  zBase,
  blockedAtZ,
  deps,
}: ResolveBestCandidateArgs): BestCandidate | null {
  const bestStrict = deps.tryFindBestCandidate(
    safePallet,
    rem,
    state,
    remainingWeight,
    patternCache,
    "strict",
    zBase,
    blockedAtZ,
  );
  const bestNormal = bestStrict ?? deps.tryFindBestCandidate(
    safePallet,
    rem,
    state,
    remainingWeight,
    patternCache,
    "normal",
    zBase,
    blockedAtZ,
  );
  return bestNormal ?? deps.tryFindBestCandidate(
    safePallet,
    rem,
    state,
    remainingWeight,
    patternCache,
    "rescue",
    zBase,
    blockedAtZ,
  );
}
