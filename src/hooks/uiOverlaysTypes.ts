import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { DragPanel } from "./useOverlayDrag";
import type { ShortcutConfig, ShortcutTarget } from "./uiOverlayShortcuts";

export interface WindowSize {
  width: number;
  height: number;
}

export interface UseUiOverlaysResult {
  windowSize: WindowSize;
  uiAccessOpen: boolean;
  diagnosticsOpen: boolean;
  uiAccessShortcutDraft: ShortcutConfig;
  diagnosticsShortcutDraft: ShortcutConfig;
  capturingShortcutTarget: ShortcutTarget | null;
  setCapturingShortcutTarget: React.Dispatch<React.SetStateAction<ShortcutTarget | null>>;
  setUiAccessShortcutDraft: React.Dispatch<React.SetStateAction<ShortcutConfig>>;
  setDiagnosticsShortcutDraft: React.Dispatch<React.SetStateAction<ShortcutConfig>>;
  sampleDatabasePanelVisible: boolean;
  setSampleDatabasePanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
  settingsDirty: boolean;
  saveSettings: () => void;
  toggleUiAccess: () => void;
  closeUiAccess: () => void;
  toggleDiagnostics: () => void;
  closeDiagnostics: () => void;
  uiAccessModalRef: React.MutableRefObject<HTMLDivElement | null>;
  diagnosticsModalRef: React.MutableRefObject<HTMLDivElement | null>;
  beginDrag: (panel: DragPanel, event: ReactPointerEvent<HTMLDivElement>) => void;
  handleDragPointerMove: (panel: DragPanel, event: ReactPointerEvent<HTMLDivElement>) => void;
  endDragPointer: (event: ReactPointerEvent<HTMLDivElement>) => void;
  uiAccessModalStyle: CSSProperties | undefined;
  diagnosticsModalStyle: CSSProperties | undefined;
}
