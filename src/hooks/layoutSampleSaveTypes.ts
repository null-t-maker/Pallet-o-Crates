import type { CartonInput, MultiPackResult, PackedCarton, PalletInput } from "../lib/packer";
import type { SampleSavePackingStyle } from "../lib/layoutSamples";

export interface SaveSampleStatus {
  kind: "success" | "error";
  message: string;
}

export interface UseLayoutSampleSaveArgs {
  workflowMode: "generation" | "manual";
  pallet: PalletInput;
  cartons: CartonInput[];
  result: MultiPackResult | null;
  manualCartons: PackedCarton[];
  pickFolderPath: () => Promise<string | null>;
  sampleFolderNotSelectedLabel: string;
  sampleSavedPrefix: string;
  sampleSaveFailedPrefix: string;
}

export interface UseLayoutSampleSaveResult {
  sampleSaveFolderPath: string;
  setSampleSaveFolderPath: React.Dispatch<React.SetStateAction<string>>;
  sampleSaveName: string;
  setSampleSaveName: React.Dispatch<React.SetStateAction<string>>;
  sampleSavePackingStyle: SampleSavePackingStyle;
  setSampleSavePackingStyle: React.Dispatch<React.SetStateAction<SampleSavePackingStyle>>;
  saveSampleBusy: boolean;
  saveSampleStatus: SaveSampleStatus | null;
  setSaveSampleStatus: React.Dispatch<React.SetStateAction<SaveSampleStatus | null>>;
  handleChooseSampleSaveFolder: () => Promise<void>;
  handleSaveLayoutSample: () => Promise<void>;
}

export interface UseLayoutSampleSaveActionsArgs extends UseLayoutSampleSaveArgs {
  sampleSaveFolderPath: string;
  sampleSaveName: string;
  sampleSavePackingStyle: SampleSavePackingStyle;
  saveSampleBusy: boolean;
  setSampleSaveFolderPath: React.Dispatch<React.SetStateAction<string>>;
  setSaveSampleStatus: React.Dispatch<React.SetStateAction<SaveSampleStatus | null>>;
  setSaveSampleBusy: React.Dispatch<React.SetStateAction<boolean>>;
}
