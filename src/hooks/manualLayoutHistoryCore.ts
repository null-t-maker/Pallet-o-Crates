import type { PackedCarton } from "../lib/packer";

export interface ManualHistoryState {
  snapshots: PackedCarton[][];
  index: number;
}

export interface ApplyManualOptions {
  recordHistory?: boolean;
  resetHistory?: boolean;
}

function packedCartonSignature(carton: PackedCarton): string {
  return [
    carton.id,
    carton.typeId,
    carton.x.toFixed(3),
    carton.y.toFixed(3),
    carton.z.toFixed(3),
    carton.w.toFixed(3),
    carton.l.toFixed(3),
    carton.h.toFixed(3),
  ].join("|");
}

function packedCartonListsEqual(a: PackedCarton[], b: PackedCarton[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (packedCartonSignature(a[i]) !== packedCartonSignature(b[i])) return false;
  }
  return true;
}

export function clonePackedCartons(cartons: PackedCarton[]): PackedCarton[] {
  return cartons.map((carton) => ({ ...carton }));
}

export function createEmptyManualHistory(): ManualHistoryState {
  return {
    snapshots: [],
    index: -1,
  };
}

export function computeNextManualHistory(
  prev: ManualHistoryState,
  snapshot: PackedCarton[],
  options: ApplyManualOptions | undefined,
  historyLimit: number,
): ManualHistoryState {
  const recordHistory = options?.recordHistory ?? true;
  const resetHistory = options?.resetHistory ?? false;

  if (resetHistory) {
    if (snapshot.length === 0) {
      return createEmptyManualHistory();
    }
    return {
      snapshots: [snapshot],
      index: 0,
    };
  }
  if (!recordHistory) return prev;

  const base = prev.index >= 0
    ? prev.snapshots.slice(0, prev.index + 1)
    : [];
  const last = base.length > 0 ? base[base.length - 1] : null;
  if (last && packedCartonListsEqual(last, snapshot)) return prev;

  const pushed = [...base, snapshot];
  if (pushed.length > historyLimit) {
    const trimmed = pushed.slice(pushed.length - historyLimit);
    return {
      snapshots: trimmed,
      index: trimmed.length - 1,
    };
  }
  return {
    snapshots: pushed,
    index: pushed.length - 1,
  };
}
