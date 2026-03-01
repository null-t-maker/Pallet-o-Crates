import type { Dispatch, SetStateAction } from "react";
import type { SampleSavePackingStyle } from "../../lib/layoutSamples";
import type { ShortcutConfig, ShortcutTarget } from "../../hooks/useUiOverlays";

export interface SaveSampleStatus {
  kind: "success" | "error";
  message: string;
}

export interface SampleSaveControls {
  sampleSaveFolderPath: string;
  sampleSaveName: string;
  setSampleSaveName: Dispatch<SetStateAction<string>>;
  sampleSavePackingStyle: SampleSavePackingStyle;
  setSampleSavePackingStyle: Dispatch<SetStateAction<SampleSavePackingStyle>>;
  saveSampleBusy: boolean;
  saveSampleStatus: SaveSampleStatus | null;
  handleChooseSampleSaveFolder: () => Promise<void>;
  handleSaveLayoutSample: () => Promise<void>;
}

export interface SettingsControls {
  settingsDirty: boolean;
  saveSettings: () => void;
  capturingShortcutTarget: ShortcutTarget | null;
  setCapturingShortcutTarget: Dispatch<SetStateAction<ShortcutTarget | null>>;
  uiAccessShortcutDraft: ShortcutConfig;
  diagnosticsShortcutDraft: ShortcutConfig;
  uiAccessOpen: boolean;
  diagnosticsOpen: boolean;
  toggleUiAccess: () => void;
  toggleDiagnostics: () => void;
  restoreUiAccessDefaults: () => void;
}
