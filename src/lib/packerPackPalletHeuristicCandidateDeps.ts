import {
  tryFindBestCandidate,
  tryFindCandidateOptions,
  type TryFindBestCandidateDeps,
} from "./packerCandidateSearch";
import type { HeuristicRunnerDeps } from "./packerHeuristicTypes";

type HeuristicCandidateResolver = Pick<
  HeuristicRunnerDeps,
  "tryFindBestCandidate" | "tryFindCandidateOptions"
>;

export function createHeuristicCandidateResolver(
  candidateSearchDeps: TryFindBestCandidateDeps,
): HeuristicCandidateResolver {
  return {
    tryFindCandidateOptions: (
      palletInput,
      remainingCartons,
      state,
      remainingWeight,
      patternCache,
      profile,
      zBase,
      blockedRects,
      avoidTypeId,
      maxOptions,
    ) => tryFindCandidateOptions(
      palletInput,
      remainingCartons,
      state,
      remainingWeight,
      patternCache,
      profile,
      zBase,
      blockedRects,
      avoidTypeId ?? null,
      null,
      true,
      true,
      maxOptions ?? 6,
      candidateSearchDeps,
    ),
    tryFindBestCandidate: (
      palletInput,
      remainingCartons,
      state,
      remainingWeight,
      patternCache,
      profile,
      zBase,
      blockedRects,
      avoidTypeId,
    ) => tryFindBestCandidate(
      palletInput,
      remainingCartons,
      state,
      remainingWeight,
      patternCache,
      profile,
      zBase,
      blockedRects,
      avoidTypeId ?? null,
      null,
      true,
      true,
      candidateSearchDeps,
    ),
  };
}
