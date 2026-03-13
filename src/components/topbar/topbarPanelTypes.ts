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
  saveSampleBlockedReason: string | null;
  saveSampleStatus: SaveSampleStatus | null;
  handleChooseSampleSaveFolder: () => Promise<void>;
  handleSaveLayoutSample: () => Promise<void>;
}

export interface SampleLoadControls {
  sampleLoadFolderPath: string;
  sampleLoadOptions: readonly { value: string; label: string }[];
  sampleLoadHasOptions: boolean;
  sampleLoadSelectedFilePath: string;
  setSampleLoadSelectedFilePath: Dispatch<SetStateAction<string>>;
  sampleLoadScanning: boolean;
  sampleLoadFolderError: string | null;
  sampleLoadBusy: boolean;
  sampleLoadStatus: SaveSampleStatus | null;
  handleChooseSampleLoadFolder: () => Promise<void>;
  handleReloadSampleLoadFolder: () => void;
  handleLoadLayoutSample: () => Promise<void>;
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
  sampleDatabasePanelVisible: boolean;
  toggleUiAccess: () => void;
  toggleDiagnostics: () => void;
  toggleSampleDatabasePanelVisible: () => void;
  restoreUiAccessDefaults: () => void;
}
