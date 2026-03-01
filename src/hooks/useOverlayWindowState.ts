import { useCallback, useState } from "react";

interface UseOverlayWindowStateArgs {
  clearUiAccessPosition: () => void;
  clearDiagnosticsPosition: () => void;
}

interface UseOverlayWindowStateResult {
  uiAccessOpen: boolean;
  diagnosticsOpen: boolean;
  toggleUiAccess: () => void;
  closeUiAccess: () => void;
  toggleDiagnostics: () => void;
  closeDiagnostics: () => void;
}

export function useOverlayWindowState({
  clearUiAccessPosition,
  clearDiagnosticsPosition,
}: UseOverlayWindowStateArgs): UseOverlayWindowStateResult {
  const [uiAccessOpen, setUiAccessOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  const toggleUiAccess = useCallback(() => {
    setUiAccessOpen((prev) => {
      const next = !prev;
      if (next) clearUiAccessPosition();
      return next;
    });
  }, [clearUiAccessPosition]);

  const closeUiAccess = useCallback(() => {
    setUiAccessOpen(false);
  }, []);

  const toggleDiagnostics = useCallback(() => {
    setDiagnosticsOpen((prev) => {
      const next = !prev;
      if (next) clearDiagnosticsPosition();
      return next;
    });
  }, [clearDiagnosticsPosition]);

  const closeDiagnostics = useCallback(() => {
    setDiagnosticsOpen(false);
  }, []);

  return {
    uiAccessOpen,
    diagnosticsOpen,
    toggleUiAccess,
    closeUiAccess,
    toggleDiagnostics,
    closeDiagnostics,
  };
}
