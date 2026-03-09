import {
  applyBestCandidate,
  applyGapPlacementCandidate,
} from "./packerHeuristicPlacement";
import {
  runGapFillPhase,
  runTopOffPhase,
} from "./packerHeuristicPhases";
import {
  collectSupportAndBlockedAtZ,
  updateStateAfterCommittedLayer,
} from "./packerHeuristicState";
import type {
  BestCandidate,
  GapPlacementCandidate,
  LayerState,
  PlacementRect,
  Rect,
} from "./packerCoreTypes";
import type {
  CartonInput,
  Layer,
  PackedCarton,
} from "./packerTypes";
import type { RunHeuristicLayerStepArgs, RunHeuristicLayerStepResult } from "./packerHeuristicLayerStepTypes";

type GreedyLayerRunner = (args: RunHeuristicLayerStepArgs) => RunHeuristicLayerStepResult;

type LayerSeedBranch =
  | { kind: "candidate"; key: string; candidate: BestCandidate }
  | { kind: "gap"; key: string; candidate: GapPlacementCandidate };

interface MaterializedLayerOutcome extends RunHeuristicLayerStepResult {
  remAfter: CartonInput[];
  placedAfter: PackedCarton[];
  stateAfter: LayerState;
}

interface LayerBranchEvaluation {
  remainingUnits: number;
  remainingVolume: number;
  projectedAddedCount: number;
  projectedTop: number;
  currentCount: number;
  currentArea: number;
  currentTop: number;
}

interface CandidateBranch {
  mode: "greedy" | "seed";
  seed?: LayerSeedBranch;
  outcome: MaterializedLayerOutcome;
  evaluation: LayerBranchEvaluation;
}

function cloneLayerState(state: LayerState): LayerState {
  return {
    prevPlacements: state.prevPlacements.map((placement) => ({ ...placement })),
    prevLayerTypeId: state.prevLayerTypeId,
    prevHash: state.prevHash,
    prevMirrorHashes: new Set(state.prevMirrorHashes),
    streakByFootprint: new Map(state.streakByFootprint),
    streakByType: new Map(state.streakByType),
    typeWaitById: new Map(state.typeWaitById),
    prevWallCoverage: state.prevWallCoverage,
    prevCenterOccupancy: state.prevCenterOccupancy,
    centerGapStreak: state.centerGapStreak,
    layerIndex: state.layerIndex,
  };
}

function cloneRemaining(rem: CartonInput[]): CartonInput[] {
  return rem.map((carton) => ({ ...carton }));
}

function clonePlaced(placed: PackedCarton[]): PackedCarton[] {
  return placed.map((carton) => ({ ...carton }));
}

function computeLayerArea(placements: PlacementRect[]): number {
  return placements.reduce((sum, placement) => sum + (placement.w * placement.l), 0);
}

function computeStackTop(placed: PackedCarton[]): number {
  return placed.reduce((maxTop, carton) => Math.max(maxTop, carton.z + carton.h), 0);
}

function mapCandidateToRemaining(
  candidate: BestCandidate,
  rem: CartonInput[],
): BestCandidate | null {
  const carton = rem.find((entry) => entry.id === candidate.carton.id);
  if (!carton) return null;
  return {
    carton,
    rects: candidate.rects.map((rect) => ({ ...rect })),
    score: candidate.score,
    layoutHash: candidate.layoutHash,
  };
}

function mapGapCandidateToRemaining(
  candidate: GapPlacementCandidate,
  rem: CartonInput[],
): GapPlacementCandidate | null {
  const carton = rem.find((entry) => entry.id === candidate.carton.id);
  if (!carton) return null;
  return {
    carton,
    rect: { ...candidate.rect },
    orientation: { ...candidate.orientation },
    score: candidate.score,
  };
}

function buildSeedBranches(args: RunHeuristicLayerStepArgs): LayerSeedBranch[] {
  const {
    safePallet,
    rem,
    state,
    patternCache,
    blockedAtZ,
    zBase,
    totalWeight,
    deps,
  } = args;
  const remainingWeight = safePallet.maxWeight - totalWeight;
  const seeds: LayerSeedBranch[] = [];
  const unique = new Set<string>();

  const pushSeed = (seed: LayerSeedBranch): void => {
    if (unique.has(seed.key)) return;
    unique.add(seed.key);
    seeds.push(seed);
  };

  const pushCandidates = (
    searchRem: CartonInput[],
    profile: "strict" | "normal" | "rescue",
    maxOptions: number,
    keyPrefix: string,
  ): void => {
    for (const candidate of deps.tryFindCandidateOptions(
      safePallet,
      searchRem,
      state,
      remainingWeight,
      patternCache,
      profile,
      zBase,
      blockedAtZ,
      null,
      maxOptions,
    )) {
      pushSeed({
        kind: "candidate",
        key: `${keyPrefix}|candidate|${candidate.carton.id}|${candidate.layoutHash}`,
        candidate,
      });
    }
  };

  const seedPreferType = state.prevLayerTypeId;
  const allowPreferredUpright = deps.hasAnyPreferredUprightCandidates(rem);
  const pushGapSeeds = (
    searchRem: CartonInput[],
    maxNormalGapOptions: number,
    maxExhaustiveGapOptions: number,
    keyPrefix: string,
  ): void => {
    const lowest = deps.findLowestHeightGapPlacement(
      safePallet,
      searchRem,
      state,
      remainingWeight,
      blockedAtZ,
      zBase,
      0,
      allowPreferredUpright,
      seedPreferType,
      new Set<string>(),
    );
    if (lowest) {
      pushSeed({
        kind: "gap",
        key: [
          keyPrefix,
          "gap-lowest",
          lowest.carton.id,
          lowest.rect.x,
          lowest.rect.y,
          lowest.rect.w,
          lowest.rect.l,
          lowest.orientation.h,
        ].join("|"),
        candidate: lowest,
      });
    }

    for (const candidate of deps.findGapPlacementOptions(
      safePallet,
      searchRem,
      state,
      remainingWeight,
      blockedAtZ,
      zBase,
      0,
      false,
      seedPreferType,
      new Set<string>(),
      undefined,
      maxNormalGapOptions,
    )) {
      pushSeed({
        kind: "gap",
        key: [
          keyPrefix,
          "gap",
          candidate.carton.id,
          candidate.rect.x,
          candidate.rect.y,
          candidate.rect.w,
          candidate.rect.l,
          candidate.orientation.h,
          candidate.orientation.upright ? "u" : "f",
        ].join("|"),
        candidate,
      });
    }

    for (const candidate of deps.findGapPlacementExhaustiveOptions(
      safePallet,
      searchRem,
      state,
      remainingWeight,
      blockedAtZ,
      zBase,
      0,
      allowPreferredUpright,
      seedPreferType,
      new Set<string>(),
      undefined,
      maxExhaustiveGapOptions,
    )) {
      pushSeed({
        kind: "gap",
        key: [
          keyPrefix,
          "gap-exhaustive",
          candidate.carton.id,
          candidate.rect.x,
          candidate.rect.y,
          candidate.rect.w,
          candidate.rect.l,
          candidate.orientation.h,
          candidate.orientation.upright ? "u" : "f",
        ].join("|"),
        candidate,
      });
    }
  };

  pushCandidates(rem, "strict", 3, "global");
  pushCandidates(rem, "normal", 2, "global");
  pushCandidates(rem, "rescue", 1, "global");
  pushGapSeeds(rem, 2, 2, "global");

  const activeTypes = rem
    .filter((carton) => carton.quantity > 0)
    .sort((left, right) => {
      const leftVolume = left.width * left.length * left.height;
      const rightVolume = right.width * right.length * right.height;
      return rightVolume - leftVolume;
    });

  for (const activeType of activeTypes) {
    const typeOnlyRem = [{ ...activeType }];
    const keyPrefix = `type-${activeType.id}`;
    pushCandidates(typeOnlyRem, "strict", 1, keyPrefix);
    pushCandidates(typeOnlyRem, "normal", 1, keyPrefix);
    pushGapSeeds(typeOnlyRem, 1, 1, keyPrefix);
  }

  return seeds.slice(0, 8);
}

function materializeSeedBranch(
  args: RunHeuristicLayerStepArgs,
  remTarget: CartonInput[],
  placedTarget: PackedCarton[],
  seed: LayerSeedBranch,
): MaterializedLayerOutcome | null {
  const {
    safePallet,
    state,
    patternCache,
    blockedAtZ,
    zBase,
    totalWeight,
    EPS,
    deps,
  } = args;

  const layer: Layer = {
    zBase,
    height: 0,
    cartons: [],
  };
  const layerPlacements: PlacementRect[] = [];
  const blockedRects: Rect[] = blockedAtZ.map((rect) => ({ ...rect }));
  const usedTypeIds = new Set<string>();
  const totalWeightRef = { value: totalWeight };
  let idCounter = 0;

  const placementContext = {
    safePallet,
    state,
    placed: placedTarget,
    layer,
    layerPlacements,
    blockedRects,
    usedTypeIds,
    zBase,
    totalWeightRef,
    EPS,
    createId: () => `experimental-${zBase}-${idCounter++}`,
    isRectSetPlacementSafe: deps.isRectSetPlacementSafe,
    isWrapFriendlyLayerShape: deps.isWrapFriendlyLayerShape,
    cumulativeStackLoadSafe: deps.cumulativeStackLoadSafe,
    noCollision: deps.noCollision,
  };

  const applyCandidate = (candidate: BestCandidate): boolean => applyBestCandidate(candidate, placementContext);
  const applySinglePlacement = (candidate: GapPlacementCandidate): boolean => applyGapPlacementCandidate(candidate, placementContext);
  const seedTypeId = seed.candidate.carton.id;

  const seeded = seed.kind === "candidate"
    ? (() => {
      const mapped = mapCandidateToRemaining(seed.candidate, remTarget);
      return mapped ? applyCandidate(mapped) : false;
    })()
    : (() => {
      const mapped = mapGapCandidateToRemaining(seed.candidate, remTarget);
      return mapped ? applySinglePlacement(mapped) : false;
    })();

  if (!seeded) {
    return null;
  }

  let seedReinforcementGuard = 0;
  while (seedReinforcementGuard < 4) {
    seedReinforcementGuard += 1;

    const sameTypeRemaining = remTarget
      .filter((carton) => carton.id === seedTypeId && carton.quantity > 0)
      .map((carton) => ({ ...carton }));
    if (sameTypeRemaining.length === 0) break;

    let reinforced = false;
    for (const profile of ["strict", "normal", "rescue"] as const) {
      const candidate = deps.tryFindCandidateOptions(
        safePallet,
        sameTypeRemaining,
        state,
        safePallet.maxWeight - totalWeightRef.value,
        patternCache,
        profile,
        zBase,
        blockedRects,
        null,
        1,
      )[0];
      if (!candidate) continue;

      const mapped = mapCandidateToRemaining(candidate, remTarget);
      if (mapped && applyCandidate(mapped)) {
        reinforced = true;
        break;
      }
    }

    if (!reinforced) {
      const sameTypeGap = deps.findGapPlacementExhaustiveOptions(
        safePallet,
        sameTypeRemaining,
        state,
        safePallet.maxWeight - totalWeightRef.value,
        blockedRects,
        zBase,
        layer.height,
        deps.hasAnyPreferredUprightCandidates(sameTypeRemaining),
        seedTypeId,
        usedTypeIds,
        undefined,
        1,
      )[0] ?? deps.findGapPlacementOptions(
        safePallet,
        sameTypeRemaining,
        state,
        safePallet.maxWeight - totalWeightRef.value,
        blockedRects,
        zBase,
        layer.height,
        deps.hasAnyPreferredUprightCandidates(sameTypeRemaining),
        seedTypeId,
        usedTypeIds,
        undefined,
        1,
      )[0];

      const mapped = sameTypeGap ? mapGapCandidateToRemaining(sameTypeGap, remTarget) : null;
      if (mapped && applySinglePlacement(mapped)) {
        reinforced = true;
      }
    }

    if (!reinforced) break;
  }

  runTopOffPhase({
    safePallet,
    rem: remTarget,
    state,
    patternCache,
    blockedRects,
    zBase,
    layer,
    applyCandidate,
    deps,
    EPS,
    currentWeight: () => totalWeightRef.value,
  });

  runGapFillPhase({
    safePallet,
    rem: remTarget,
    state,
    blockedRects,
    zBase,
    layer,
    usedTypeIds,
    applySinglePlacement,
    deps,
    EPS,
    currentWeight: () => totalWeightRef.value,
  });

  if (safePallet.packingStyle === "centerCompact" && layer.cartons.length > 0) {
    deps.tryCenterShiftLayer(layerPlacements, layer.cartons, state.prevPlacements, safePallet);
  }

  const stateAfter = cloneLayerState(state);
  updateStateAfterCommittedLayer(
    stateAfter,
    layer,
    layerPlacements,
    safePallet,
    usedTypeIds,
    remTarget,
    deps,
  );

  return {
    seeded: true,
    layer,
    layerPlacements,
    usedTypeIds,
    totalWeight: totalWeightRef.value,
    remAfter: remTarget,
    placedAfter: [...placedTarget, ...layer.cartons],
    stateAfter,
  };
}

function simulateGreedyOutcome(
  args: RunHeuristicLayerStepArgs,
  greedyRunner: GreedyLayerRunner,
): MaterializedLayerOutcome | null {
  const rem = cloneRemaining(args.rem);
  const placed = clonePlaced(args.placed);
  const greedyStep = greedyRunner({
    ...args,
    rem,
    placed,
    state: cloneLayerState(args.state),
    blockedAtZ: args.blockedAtZ.map((rect) => ({ ...rect })),
  });
  if (!greedyStep.seeded || greedyStep.layer.cartons.length === 0 || greedyStep.layer.height <= 0) {
    return null;
  }

  const stateAfter = cloneLayerState(args.state);
  updateStateAfterCommittedLayer(
    stateAfter,
    greedyStep.layer,
    greedyStep.layerPlacements,
    args.safePallet,
    greedyStep.usedTypeIds,
    rem,
    args.deps,
  );

  return {
    ...greedyStep,
    remAfter: rem,
    placedAfter: [...placed, ...greedyStep.layer.cartons],
    stateAfter,
  };
}

function evaluateBranch(
  args: RunHeuristicLayerStepArgs,
  outcome: MaterializedLayerOutcome,
  greedyRunner: GreedyLayerRunner,
): LayerBranchEvaluation {
  const rolloutRem = cloneRemaining(outcome.remAfter);
  const rolloutPlaced = clonePlaced(outcome.placedAfter);
  const rolloutState = cloneLayerState(outcome.stateAfter);
  const initialPlacedCount = args.placed.length;
  let rolloutWeight = outcome.totalWeight;
  let zBase = args.deps.findNextZBase(rolloutPlaced, args.zBase);
  let safety = 0;

  while (rolloutRem.some((carton) => carton.quantity > 0) && safety < 240) {
    safety += 1;
    if (zBase === null || zBase > args.safePallet.maxHeight + args.EPS) break;

    const remainingWeightNow = args.safePallet.maxWeight - rolloutWeight;
    if (remainingWeightNow <= args.EPS) break;

    const { supportAtZ, blockedAtZ } = collectSupportAndBlockedAtZ(rolloutPlaced, zBase, args.EPS);
    rolloutState.prevPlacements = supportAtZ;

    const step = greedyRunner({
      safePallet: args.safePallet,
      rem: rolloutRem,
      placed: rolloutPlaced,
      state: rolloutState,
      patternCache: args.patternCache,
      blockedAtZ,
      zBase,
      totalWeight: rolloutWeight,
      EPS: args.EPS,
      deps: args.deps,
    });
    rolloutWeight = step.totalWeight;

    if (!step.seeded) {
      const nextZ = args.deps.findNextZBase(rolloutPlaced, zBase);
      if (nextZ === null || nextZ > args.safePallet.maxHeight + args.EPS) break;
      zBase = nextZ;
      continue;
    }
    if (step.layer.cartons.length === 0 || step.layer.height <= 0) {
      break;
    }

    rolloutPlaced.push(...step.layer.cartons);
    updateStateAfterCommittedLayer(
      rolloutState,
      step.layer,
      step.layerPlacements,
      args.safePallet,
      step.usedTypeIds,
      rolloutRem,
      args.deps,
    );

    const nextZ = args.deps.findNextZBase(rolloutPlaced, zBase);
    if (nextZ === null || nextZ > args.safePallet.maxHeight + args.EPS) {
      break;
    }
    zBase = nextZ;
  }

  const remainingUnits = rolloutRem.reduce((sum, carton) => sum + Math.max(0, carton.quantity), 0);
  const remainingVolume = rolloutRem.reduce(
    (sum, carton) => sum + Math.max(0, carton.quantity) * carton.width * carton.length * carton.height,
    0,
  );

  return {
    remainingUnits,
    remainingVolume,
    projectedAddedCount: rolloutPlaced.length - initialPlacedCount,
    projectedTop: computeStackTop(rolloutPlaced),
    currentCount: outcome.layer.cartons.length,
    currentArea: computeLayerArea(outcome.layerPlacements),
    currentTop: computeStackTop(outcome.layer.cartons),
  };
}

function compareEvaluations(
  left: LayerBranchEvaluation,
  right: LayerBranchEvaluation,
): number {
  if (left.remainingUnits !== right.remainingUnits) {
    return right.remainingUnits - left.remainingUnits;
  }
  if (Math.abs(left.remainingVolume - right.remainingVolume) > 1e-6) {
    return right.remainingVolume - left.remainingVolume;
  }
  if (left.projectedAddedCount !== right.projectedAddedCount) {
    return left.projectedAddedCount - right.projectedAddedCount;
  }
  if (Math.abs(left.projectedTop - right.projectedTop) > 1e-6) {
    return right.projectedTop - left.projectedTop;
  }
  if (left.currentCount !== right.currentCount) {
    return left.currentCount - right.currentCount;
  }
  if (Math.abs(left.currentArea - right.currentArea) > 1e-6) {
    return left.currentArea - right.currentArea;
  }
  if (Math.abs(left.currentTop - right.currentTop) > 1e-6) {
    return right.currentTop - left.currentTop;
  }
  return 0;
}

function pickBestBranch(branches: CandidateBranch[]): CandidateBranch | null {
  let best: CandidateBranch | null = null;
  for (const branch of branches) {
    if (!best || compareEvaluations(branch.evaluation, best.evaluation) > 0) {
      best = branch;
    }
  }
  return best;
}

export function runHeuristicLayerStepExperimental(
  args: RunHeuristicLayerStepArgs,
  greedyRunner: GreedyLayerRunner,
): RunHeuristicLayerStepResult {
  const baseline = simulateGreedyOutcome(args, greedyRunner);
  if (!baseline) {
    return greedyRunner(args);
  }

  const branches: CandidateBranch[] = [{
    mode: "greedy",
    outcome: baseline,
    evaluation: evaluateBranch(args, baseline, greedyRunner),
  }];

  for (const seed of buildSeedBranches(args)) {
    const outcome = materializeSeedBranch(
      args,
      cloneRemaining(args.rem),
      clonePlaced(args.placed),
      seed,
    );
    if (!outcome || outcome.layer.cartons.length === 0 || outcome.layer.height <= 0) {
      continue;
    }

    branches.push({
      mode: "seed",
      seed,
      outcome,
      evaluation: evaluateBranch(args, outcome, greedyRunner),
    });
  }

  const best = pickBestBranch(branches);
  if (!best || best.mode === "greedy") {
    return greedyRunner(args);
  }

  const actual = materializeSeedBranch(args, args.rem, args.placed, best.seed!);
  return actual ?? greedyRunner(args);
}
