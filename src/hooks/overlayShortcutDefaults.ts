import type { ShortcutConfig } from "./uiOverlayShortcuts";

export const UI_ACCESS_SHORTCUT_STORAGE_KEY = "palletocrates.uiAccessShortcut";
export const DIAGNOSTICS_SHORTCUT_STORAGE_KEY = "palletocrates.diagnosticsShortcut";

export const DEFAULT_UI_ACCESS_SHORTCUT: ShortcutConfig = {
  alt: true,
  ctrl: false,
  shift: false,
  meta: false,
  key: "S",
};

export const DEFAULT_DIAGNOSTICS_SHORTCUT: ShortcutConfig = {
  alt: true,
  ctrl: false,
  shift: false,
  meta: false,
  key: "I",
};
