import {
  useRef,
} from "react";
import { useOverlayDrag } from "./useOverlayDrag";
import { useOverlayShortcutsState } from "./useOverlayShortcutsState";
import { useOverlayWindowState } from "./useOverlayWindowState";
import { type UseUiOverlaysResult } from "./uiOverlaysTypes";
import { useViewportWindowSize } from "./useViewportWindowSize";

export { normalizeShortcutKey, shortcutToLabel } from "./uiOverlayShortcuts";
export type { ShortcutConfig, ShortcutTarget } from "./uiOverlayShortcuts";
export type { UseUiOverlaysResult } from "./uiOverlaysTypes";

export function useUiOverlays(): UseUiOverlaysResult {
  const windowSize = useViewportWindowSize();
  const uiAccessModalRef = useRef<HTMLDivElement | null>(null);
  const diagnosticsModalRef = useRef<HTMLDivElement | null>(null);
  const {
    clearUiAccessPosition,
    clearDiagnosticsPosition,
    beginDrag,
    handleDragPointerMove,
    endDragPointer,
    uiAccessModalStyle,
    diagnosticsModalStyle,
  } = useOverlayDrag({
    uiAccessModalRef,
    diagnosticsModalRef,
  });
  const {
    uiAccessOpen,
    diagnosticsOpen,
    toggleUiAccess,
    closeUiAccess,
    toggleDiagnostics,
    closeDiagnostics,
  } = useOverlayWindowState({
    clearUiAccessPosition,
    clearDiagnosticsPosition,
  });

  const {
    uiAccessShortcutDraft,
    diagnosticsShortcutDraft,
    capturingShortcutTarget,
    setCapturingShortcutTarget,
    setUiAccessShortcutDraft,
    setDiagnosticsShortcutDraft,
    settingsDirty,
    saveSettings,
  } = useOverlayShortcutsState({
    toggleUiAccess,
    toggleDiagnostics,
  });

  return {
    windowSize,
    uiAccessOpen,
    diagnosticsOpen,
    uiAccessShortcutDraft,
    diagnosticsShortcutDraft,
    capturingShortcutTarget,
    setCapturingShortcutTarget,
    setUiAccessShortcutDraft,
    setDiagnosticsShortcutDraft,
    settingsDirty,
    saveSettings,
    toggleUiAccess,
    closeUiAccess,
    toggleDiagnostics,
    closeDiagnostics,
    uiAccessModalRef,
    diagnosticsModalRef,
    beginDrag,
    handleDragPointerMove,
    endDragPointer,
    uiAccessModalStyle,
    diagnosticsModalStyle,
  };
}
