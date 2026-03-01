import { useEffect } from "react";
import { normalizeShortcutKey, type ShortcutTarget } from "./useUiOverlays";
import type { WorkflowMode } from "../components/Visualizer";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

interface UseManualUndoRedoShortcutsArgs {
  workflowMode: WorkflowMode;
  capturingShortcutTarget: ShortcutTarget | null;
  undoManualEdit: () => void;
  redoManualEdit: () => void;
}

export function useManualUndoRedoShortcuts({
  workflowMode,
  capturingShortcutTarget,
  undoManualEdit,
  redoManualEdit,
}: UseManualUndoRedoShortcutsArgs): void {
  useEffect(() => {
    const handleManualUndoRedo = (event: KeyboardEvent) => {
      if (workflowMode !== "manual") return;
      if (capturingShortcutTarget !== null) return;
      if (isEditableTarget(event.target)) return;

      const ctrlOrMeta = event.ctrlKey || event.metaKey;
      if (!ctrlOrMeta) return;
      const key = normalizeShortcutKey(event.key);

      if (key === "Z" && !event.shiftKey) {
        event.preventDefault();
        undoManualEdit();
        return;
      }

      if (key === "Y" || (key === "Z" && event.shiftKey)) {
        event.preventDefault();
        redoManualEdit();
      }
    };

    window.addEventListener("keydown", handleManualUndoRedo);
    return () => {
      window.removeEventListener("keydown", handleManualUndoRedo);
    };
  }, [capturingShortcutTarget, redoManualEdit, undoManualEdit, workflowMode]);
}
