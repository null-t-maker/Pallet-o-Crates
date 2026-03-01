import type { SampleSavePackingStyle } from "../lib/layoutSamples";
import { isSampleSavePackingStyle } from "../lib/layoutSamples";

const SAMPLE_SAVE_FOLDER_STORAGE_KEY = "palletocrates.sampleSaveFolder";
const SAMPLE_SAVE_STRATEGY_STORAGE_KEY = "palletocrates.sampleSaveStrategy";

export function getInitialSampleSaveFolderPath(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SAMPLE_SAVE_FOLDER_STORAGE_KEY) ?? "";
}

export function getInitialSampleSavePackingStyle(): SampleSavePackingStyle {
  if (typeof window === "undefined") return "edgeAligned";
  const stored = window.localStorage.getItem(SAMPLE_SAVE_STRATEGY_STORAGE_KEY);
  return isSampleSavePackingStyle(stored) ? stored : "edgeAligned";
}

export function persistSampleSaveFolderPath(folderPath: string): void {
  if (typeof window === "undefined") return;
  if (!folderPath) {
    window.localStorage.removeItem(SAMPLE_SAVE_FOLDER_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(SAMPLE_SAVE_FOLDER_STORAGE_KEY, folderPath);
}

export function persistSampleSavePackingStyle(packingStyle: SampleSavePackingStyle): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAMPLE_SAVE_STRATEGY_STORAGE_KEY, packingStyle);
}
