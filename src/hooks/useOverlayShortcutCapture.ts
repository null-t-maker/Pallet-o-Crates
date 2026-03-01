import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { ShortcutConfig, ShortcutTarget } from "./uiOverlayShortcuts";
import { isModifierOnlyKey, normalizeShortcutKey } from "./uiOverlayShortcuts";

interface UseOverlayShortcutCaptureArgs {
  capturingShortcutTarget: ShortcutTarget | null;
  setCapturingShortcutTarget: Dispatch<SetStateAction<ShortcutTarget | null>>;
  setUiAccessShortcutDraft: Dispatch<SetStateAction<ShortcutConfig>>;
  setDiagnosticsShortcutDraft: Dispatch<SetStateAction<ShortcutConfig>>;
}

export function useOverlayShortcutCapture({
  capturingShortcutTarget,
  setCapturingShortcutTarget,
  setUiAccessShortcutDraft,
  setDiagnosticsShortcutDraft,
}: UseOverlayShortcutCaptureArgs): void {
  useEffect(() => {
    if (capturingShortcutTarget === null) return;

    const handleCapture = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setCapturingShortcutTarget(null);
        return;
      }

      const capturedKey = normalizeShortcutKey(event.key);
      if (!capturedKey || isModifierOnlyKey(capturedKey)) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      const nextShortcut: ShortcutConfig = {
        alt: event.altKey,
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        meta: event.metaKey,
        key: capturedKey,
      };

      if (capturingShortcutTarget === "uiAccess") {
        setUiAccessShortcutDraft(nextShortcut);
      } else {
        setDiagnosticsShortcutDraft(nextShortcut);
      }
      setCapturingShortcutTarget(null);
    };

    window.addEventListener("keydown", handleCapture, true);
    return () => {
      window.removeEventListener("keydown", handleCapture, true);
    };
  }, [
    capturingShortcutTarget,
    setCapturingShortcutTarget,
    setDiagnosticsShortcutDraft,
    setUiAccessShortcutDraft,
  ]);
}
