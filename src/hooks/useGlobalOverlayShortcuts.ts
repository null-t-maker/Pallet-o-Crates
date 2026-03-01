import { useEffect } from "react";
import type { ShortcutConfig, ShortcutTarget } from "./uiOverlayShortcuts";
import { eventMatchesShortcut } from "./uiOverlayShortcuts";

interface UseGlobalOverlayShortcutsArgs {
  capturingShortcutTarget: ShortcutTarget | null;
  uiAccessShortcut: ShortcutConfig;
  diagnosticsShortcut: ShortcutConfig;
  toggleUiAccess: () => void;
  toggleDiagnostics: () => void;
}

export function useGlobalOverlayShortcuts({
  capturingShortcutTarget,
  uiAccessShortcut,
  diagnosticsShortcut,
  toggleUiAccess,
  toggleDiagnostics,
}: UseGlobalOverlayShortcutsArgs): void {
  useEffect(() => {
    const handleGlobalShortcut = (event: KeyboardEvent) => {
      if (capturingShortcutTarget !== null) return;
      if (event.repeat) return;
      if (eventMatchesShortcut(event, uiAccessShortcut)) {
        event.preventDefault();
        toggleUiAccess();
        return;
      }
      if (eventMatchesShortcut(event, diagnosticsShortcut)) {
        event.preventDefault();
        toggleDiagnostics();
      }
    };

    window.addEventListener("keydown", handleGlobalShortcut);
    return () => {
      window.removeEventListener("keydown", handleGlobalShortcut);
    };
  }, [
    capturingShortcutTarget,
    diagnosticsShortcut,
    toggleDiagnostics,
    toggleUiAccess,
    uiAccessShortcut,
  ]);
}
