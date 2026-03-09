import { invoke } from "@tauri-apps/api/core";
import { buildLayoutSamplePayload } from "../lib/layoutSamplePayload";
import type { SaveLayoutSampleResponse } from "../lib/layoutSamples";
import type { UseLayoutSampleSaveActionsArgs } from "./layoutSampleSaveTypes";
import { toSaveSampleErrorMessage } from "./layoutSampleSaveUtils";

export async function saveLayoutSampleAction({
  workflowMode,
  pallet,
  cartons,
  result,
  manualCartons,
  sampleFolderNotSelectedLabel,
  sampleSavedPrefix,
  sampleSaveFailedPrefix,
  sampleSaveFolderPath,
  sampleSaveName,
  sampleSavePackingStyle,
  saveSampleBusy,
  setSaveSampleStatus,
  setSaveSampleBusy,
}: UseLayoutSampleSaveActionsArgs): Promise<void> {
  if (saveSampleBusy) return;
  if (!sampleSaveFolderPath) {
    setSaveSampleStatus({
      kind: "error",
      message: `${sampleSaveFailedPrefix} ${sampleFolderNotSelectedLabel}`,
    });
    return;
  }

  setSaveSampleBusy(true);
  setSaveSampleStatus(null);
  try {
    const payload = buildLayoutSamplePayload({
      descriptorInput: sampleSaveName,
      packingStyle: sampleSavePackingStyle,
      workflowMode,
      pallet,
      cartons,
      result,
      manualCartons,
    });
    const response = await invoke<SaveLayoutSampleResponse>("save_layout_sample", {
      request: {
        folderPath: sampleSaveFolderPath,
        sampleName: sampleSaveName,
        payload,
      },
    });
    setSaveSampleStatus({
      kind: "success",
      message: `${sampleSavedPrefix} ${response.filePath}`,
    });
  } catch (error) {
    setSaveSampleStatus({
      kind: "error",
      message: `${sampleSaveFailedPrefix} ${toSaveSampleErrorMessage(error)}`,
    });
  } finally {
    setSaveSampleBusy(false);
  }
}
