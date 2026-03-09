import { useCallback, useState } from "react";
import { PackedCarton } from "../lib/packer";
import {
  clonePackedCartons,
  computeNextManualHistory,
  createEmptyManualHistory,
  type ApplyManualOptions,
  type ManualHistoryState,
} from "./manualLayoutHistoryCore";

interface UseManualLayoutHistoryResult {
  manualCartons: PackedCarton[];
  applyManualCartons: (nextCartons: PackedCarton[], options?: ApplyManualOptions) => void;
  clearManualLayout: () => void;
  undoManualEdit: () => void;
  redoManualEdit: () => void;
}

export function useManualLayoutHistory(historyLimit = 200): UseManualLayoutHistoryResult {
  const [manualCartons, setManualCartons] = useState<PackedCarton[]>([]);
  const [, setManualHistory] = useState<ManualHistoryState>(createEmptyManualHistory);

  const applyManualCartons = useCallback((
    nextCartons: PackedCarton[],
    options?: ApplyManualOptions,
  ) => {
    const snapshot = clonePackedCartons(nextCartons);

    setManualCartons(snapshot);
    setManualHistory((prev) => computeNextManualHistory(prev, snapshot, options, historyLimit));
  }, [historyLimit]);

  const clearManualLayout = useCallback(() => {
    setManualCartons([]);
    setManualHistory(createEmptyManualHistory());
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
