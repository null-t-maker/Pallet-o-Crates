import {
  cumulativeStackLoadSafe,
  findNextZBase,
  tryCenterShiftLayer,
} from "./packerLayerStability";
import { type TryFindBestCandidateDeps } from "./packerCandidateSearch";
import { hashRects } from "./packerGeometryCore";
import { updateStreakMaps } from "./packerFootprintTracking";
import {
  hasAnyNonNeverUprightCandidates,
  hasAnyPreferredUprightCandidates,
} from "./packerPolicy";
import type { HeuristicRunnerDeps } from "./packerHeuristicCore";
import type { PackPalletSharedDeps } from "./packerPackPalletSharedDeps";
import { createHeuristicCandidateResolver } from "./packerPackPalletHeuristicCandidateDeps";
import { createHeuristicGapPlacementResolvers } from "./packerPackPalletHeuristicGapDeps";

export function createHeuristicRunnerDeps(
  shared: PackPalletSharedDeps,
  candidateSearchDeps: TryFindBestCandidateDeps,
): HeuristicRunnerDeps {
  const candidateResolver = createHeuristicCandidateResolver(candidateSearchDeps);
  const gapPlacementResolvers = createHeuristicGapPlacementResolvers(shared);

  return {
    hasAnyPreferredUprightCandidates,
    hasAnyNonNeverUprightCandidates,
    tryFindCandidateOptions: candidateResolver.tryFindCandidateOptions,
    tryFindBestCandidate: candidateResolver.tryFindBestCandidate,
    findLowestHeightGapPlacement: gapPlacementResolvers.findLowestHeightGapPlacement,
    findGapPlacementOptions: gapPlacementResolvers.findGapPlacementOptions,
    findGapPlacementExhaustive: gapPlacementResolvers.findGapPlacementExhaustive,
    findGapPlacementExhaustiveOptions: gapPlacementResolvers.findGapPlacementExhaustiveOptions,
    findGapPlacement: gapPlacementResolvers.findGapPlacement,
    isRectSetPlacementSafe: shared.rectSetPlacementSafeOnPallet,
    isWrapFriendlyLayerShape: shared.isWrapFriendlyLayerShape,
    cumulativeStackLoadSafe: (cartonsInStack) => cumulativeStackLoadSafe(cartonsInStack, shared.stackLoadDeps),
    noCollision: shared.noCollisionOnPallet,
    tryCenterShiftLayer: (placements, placedCartons, belowPlacements, palletInput) => (
      tryCenterShiftLayer(placements, placedCartons, belowPlacements, palletInput, shared.centerShiftDeps)
    ),
    hashRects,
    mirrorHashes: shared.mirrorHashes,
    wallStats: shared.wallStats,
    centerStats: shared.centerStats,
    updateStreakMaps,
    findNextZBase: (placed, currentZ) => findNextZBase(placed, currentZ, shared.EPS),
  };
}
