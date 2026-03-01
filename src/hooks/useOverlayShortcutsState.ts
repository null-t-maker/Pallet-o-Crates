import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadStoredShortcut,
  shortcutEquals,
  type ShortcutConfig,
  type ShortcutTarget,
} from "./uiOverlayShortcuts";
import {
  DEFAULT_DIAGNOSTICS_SHORTCUT,
  DEFAULT_UI_ACCESS_SHORTCUT,
  DIAGNOSTICS_SHORTCUT_STORAGE_KEY,
  UI_ACCESS_SHORTCUT_STORAGE_KEY,
} from "./overlayShortcutDefaults";
import { useGlobalOverlayShortcuts } from "./useGlobalOverlayShortcuts";
import { useOverlayShortcutCapture } from "./useOverlayShortcutCapture";

interface UseOverlayShortcutsStateArgs {
  toggleUiAccess: () => void;
  toggleDiagnostics: () => void;
}

export function useOverlayShortcutsState({
  toggleUiAccess,
  toggleDiagnostics,
}: UseOverlayShortcutsStateArgs): {
  uiAccessShortcutDraft: ShortcutConfig;
  diagnosticsShortcutDraft: ShortcutConfig;
  capturingShortcutTarget: ShortcutTarget | null;
  setCapturingShortcutTarget: React.Dispatch<React.SetStateAction<ShortcutTarget | null>>;
  setUiAccessShortcutDraft: React.Dispatch<React.SetStateAction<ShortcutConfig>>;
  setDiagnosticsShortcutDraft: React.Dispatch<React.SetStateAction<ShortcutConfig>>;
  settingsDirty: boolean;
  saveSettings: () => void;
} {
  const [uiAccessShortcut, setUiAccessShortcut] = useState<ShortcutConfig>(() =>
    loadStoredShortcut(UI_ACCESS_SHORTCUT_STORAGE_KEY, DEFAULT_UI_ACCESS_SHORTCUT),
  );
  const [uiAccessShortcutDraft, setUiAccessShortcutDraft] = useState<ShortcutConfig>(() =>
    loadStoredShortcut(UI_ACCESS_SHORTCUT_STORAGE_KEY, DEFAULT_UI_ACCESS_SHORTCUT),
  );
  const [diagnosticsShortcut, setDiagnosticsShortcut] = useState<ShortcutConfig>(() =>
    loadStoredShortcut(DIAGNOSTICS_SHORTCUT_STORAGE_KEY, DEFAULT_DIAGNOSTICS_SHORTCUT),
  );
  const [diagnosticsShortcutDraft, setDiagnosticsShortcutDraft] = useState<ShortcutConfig>(() =>
    loadStoredShortcut(DIAGNOSTICS_SHORTCUT_STORAGE_KEY, DEFAULT_DIAGNOSTICS_SHORTCUT),
  );
  const [capturingShortcutTarget, setCapturingShortcutTarget] = useState<ShortcutTarget | null>(null);

  useEffect(() => {
    window.localStorage.setItem(UI_ACCESS_SHORTCUT_STORAGE_KEY, JSON.stringify(uiAccessShortcut));
  }, [uiAccessShortcut]);

  useEffect(() => {
    window.localStorage.setItem(DIAGNOSTICS_SHORTCUT_STORAGE_KEY, JSON.stringify(diagnosticsShortcut));
  }, [diagnosticsShortcut]);

  useGlobalOverlayShortcuts({
    capturingShortcutTarget,
    diagnosticsShortcut,
    toggleDiagnostics,
    toggleUiAccess,
    uiAccessShortcut,
  });
  useOverlayShortcutCapture({
    capturingShortcutTarget,
    setCapturingShortcutTarget,
    setUiAccessShortcutDraft,
    setDiagnosticsShortcutDraft,
  });

  const settingsDirty = useMemo(
    () => !shortcutEquals(uiAccessShortcutDraft, uiAccessShortcut)
      || !shortcutEquals(diagnosticsShortcutDraft, diagnosticsShortcut),
    [diagnosticsShortcut, diagnosticsShortcutDraft, uiAccessShortcut, uiAccessShortcutDraft],
  );

  const saveSettings = useCallback(() => {
    setUiAccessShortcut(uiAccessShortcutDraft);
    setDiagnosticsShortcut(diagnosticsShortcutDraft);
  }, [diagnosticsShortcutDraft, uiAccessShortcutDraft]);

  return {
    uiAccessShortcutDraft,
    diagnosticsShortcutDraft,
    capturingShortcutTarget,
    setCapturingShortcutTarget,
    setUiAccessShortcutDraft,
    setDiagnosticsShortcutDraft,
    settingsDirty,
    saveSettings,
  };
}
