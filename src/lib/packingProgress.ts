export type PackingProgressKind = "calculate" | "calculateMissing";

export type PackingProgressStage =
  | "preparing"
  | "analyzingManualSeed"
  | "tryingTemplateLock"
  | "templateContinuation"
  | "packingLayout"
  | "comparingFallback"
  | "packingSupplementary";

export interface PackingProgressSnapshot {
  kind: PackingProgressKind;
  stage: PackingProgressStage;
  requestedUnits: number;
  packedUnits: number;
  elapsedMs: number;
  detail?: string;
  palletIndex?: number;
  trialIndex?: number;
  trialCount?: number;
  layerIndex?: number;
}

export type PackingProgressCallback = (snapshot: PackingProgressSnapshot | null) => void;

interface CreatePackingProgressReporterArgs {
  kind: PackingProgressKind;
  requestedUnits: number;
  onProgress?: PackingProgressCallback;
  signal?: AbortSignal | null;
}

interface PackingProgressReportOptions {
  force?: boolean;
  yieldToUi?: boolean;
}

export interface PackingProgressReporter {
  signal?: AbortSignal | null;
  throwIfCancelled: () => void;
  report: (
    update: Omit<Partial<PackingProgressSnapshot>, "kind" | "requestedUnits" | "elapsedMs"> & {
      stage: PackingProgressStage;
    },
    options?: PackingProgressReportOptions,
  ) => Promise<void>;
}

const EMIT_INTERVAL_MS = 48;
const YIELD_INTERVAL_MS = 64;

export class PackingCancelledError extends Error {
  constructor() {
    super("Packing workflow cancelled");
    this.name = "PackingCancelledError";
  }
}

export function isPackingCancelledError(error: unknown): error is PackingCancelledError {
  return error instanceof PackingCancelledError
    || (error instanceof Error && error.name === "PackingCancelledError");
}

export function throwIfPackingCancelled(signal?: AbortSignal | null): void {
  if (signal?.aborted) {
    throw new PackingCancelledError();
  }
}

function nowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function hasVisibleChange(
  previous: PackingProgressSnapshot | null,
  next: PackingProgressSnapshot,
): boolean {
  if (!previous) return true;
  return previous.stage !== next.stage
    || previous.packedUnits !== next.packedUnits
    || previous.detail !== next.detail
    || previous.palletIndex !== next.palletIndex
    || previous.trialIndex !== next.trialIndex
    || previous.trialCount !== next.trialCount
    || previous.layerIndex !== next.layerIndex;
}

function nextTick(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export function createPackingProgressReporter({
  kind,
  requestedUnits,
  onProgress,
  signal,
}: CreatePackingProgressReporterArgs): PackingProgressReporter {
  const startedAt = nowMs();
  let snapshot: PackingProgressSnapshot | null = null;
  let lastEmitAt = 0;
  let lastYieldAt = 0;
  const throwIfCancelled = () => {
    throwIfPackingCancelled(signal);
  };

  return {
    signal,
    throwIfCancelled,
    async report(update, options) {
      throwIfCancelled();
      const currentAt = nowMs();
      const nextSnapshot: PackingProgressSnapshot = {
        kind,
        requestedUnits,
        packedUnits: snapshot?.packedUnits ?? 0,
        elapsedMs: currentAt - startedAt,
        ...snapshot,
        ...update,
      };
      const force = options?.force === true;
      const changed = hasVisibleChange(snapshot, nextSnapshot);
      snapshot = nextSnapshot;

      if (onProgress && (force || changed || currentAt - lastEmitAt >= EMIT_INTERVAL_MS)) {
        lastEmitAt = currentAt;
        onProgress({ ...nextSnapshot });
      }

      if (onProgress && (options?.yieldToUi === true || currentAt - lastYieldAt >= YIELD_INTERVAL_MS)) {
        lastYieldAt = currentAt;
        await nextTick();
        throwIfCancelled();
      }
    },
  };
}
