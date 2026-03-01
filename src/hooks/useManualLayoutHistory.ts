import { useCallback, useState } from "react";
import { PackedCarton } from "../lib/packer";

interface ManualHistoryState {
  snapshots: PackedCarton[][];
  index: number;
}

interface ApplyManualOptions {
  recordHistory?: boolean;
  resetHistory?: boolean;
}

interface UseManualLayoutHistoryResult {
  manualCartons: PackedCarton[];
  applyManualCartons: (nextCartons: PackedCarton[], options?: ApplyManualOptions) => void;
  clearManualLayout: () => void;
  undoManualEdit: () => void;
  redoManualEdit: () => void;
}

function clonePackedCartons(cartons: PackedCarton[]): PackedCarton[] {
  return cartons.map((carton) => ({ ...carton }));
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

export function useManualLayoutHistory(historyLimit = 200): UseManualLayoutHistoryResult {
  const [manualCartons, setManualCartons] = useState<PackedCarton[]>([]);
  const [, setManualHistory] = useState<ManualHistoryState>({
    snapshots: [],
    index: -1,
  });

  const applyManualCartons = useCallback((
    nextCartons: PackedCarton[],
    options?: ApplyManualOptions,
  ) => {
    const snapshot = clonePackedCartons(nextCartons);
    const recordHistory = options?.recordHistory ?? true;
    const resetHistory = options?.resetHistory ?? false;

    setManualCartons(snapshot);
    setManualHistory((prev) => {
      if (resetHistory) {
        if (snapshot.length === 0) {
          return { snapshots: [], index: -1 };
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
    });
  }, [historyLimit]);

  const clearManualLayout = useCallback(() => {
    setManualCartons([]);
    setManualHistory({ snapshots: [], index: -1 });
  }, []);

  const undoManualEdit = useCallback(() => {
    setManualHistory((prev) => {
      if (prev.index <= 0) return prev;
      const nextIndex = prev.index - 1;
      const snapshot = clonePackedCartons(prev.snapshots[nextIndex] ?? []);
      setManualCartons(snapshot);
      return {
        ...prev,
        index: nextIndex,
      };
    });
  }, []);

  const redoManualEdit = useCallback(() => {
    setManualHistory((prev) => {
      if (prev.index < 0 || prev.index >= prev.snapshots.length - 1) return prev;
      const nextIndex = prev.index + 1;
      const snapshot = clonePackedCartons(prev.snapshots[nextIndex] ?? []);
      setManualCartons(snapshot);
      return {
        ...prev,
        index: nextIndex,
      };
    });
  }, []);

  return {
    manualCartons,
    applyManualCartons,
    clearManualLayout,
    undoManualEdit,
    redoManualEdit,
  };
}
