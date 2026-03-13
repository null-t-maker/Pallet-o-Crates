import { useCallback } from "react";
import type { UseLayoutSampleSaveActionsArgs } from "./layoutSampleSaveTypes";
import {
  chooseSampleSaveFolderAction,
  saveLayoutSampleAction,
} from "./layoutSampleSaveActionsCore";

export function useLayoutSampleSaveActions({
  workflowMode,
  pallet,
  cartons,
  result,
  manualCartons,
  pickFolderPath,
  sampleFolderNotSelectedLabel,
  sampleSavedPrefix,
  sampleSaveFailedPrefix,
  saveSampleBlockedReason,
  sampleSaveFolderPath,
  sampleSaveName,
  sampleSavePackingStyle,
  saveSampleBusy,
  setSampleSaveFolderPath,
  setSaveSampleStatus,
  setSaveSampleBusy,
}: UseLayoutSampleSaveActionsArgs): {
  handleChooseSampleSaveFolder: () => Promise<void>;
  handleSaveLayoutSample: () => Promise<void>;
} {
  const handleChooseSampleSaveFolder = useCallback(async () => {
    await chooseSampleSaveFolderAction({
      pickFolderPath,
      sampleSaveFailedPrefix,
      setSampleSaveFolderPath,
      setSaveSampleStatus,
    });
  }, [pickFolderPath, sampleSaveFailedPrefix, setSampleSaveFolderPath, setSaveSampleStatus]);

  const handleSaveLayoutSample = useCallback(async () => {
    if (saveSampleBlockedReason) {
      setSaveSampleStatus({
        kind: "error",
        message: saveSampleBlockedReason,
      });
      return;
    }
    await saveLayoutSampleAction({
      workflowMode,
      pallet,
      cartons,
      result,
      manualCartons,
      pickFolderPath,
      sampleFolderNotSelectedLabel,
      sampleSavedPrefix,
      sampleSaveFailedPrefix,
      sampleSaveFolderPath,
    sampleSaveName,
    sampleSavePackingStyle,
    saveSampleBusy,
    saveSampleBlockedReason,
    setSampleSaveFolderPath,
    setSaveSampleStatus,
    setSaveSampleBusy,
  });
  }, [
    cartons,
    manualCartons,
    pallet,
    pickFolderPath,
    result,
    sampleFolderNotSelectedLabel,
    saveSampleBlockedReason,
    saveSampleBusy,
    sampleSaveFailedPrefix,
    sampleSaveFolderPath,
    sampleSaveName,
    sampleSavePackingStyle,
    sampleSavedPrefix,
    setSampleSaveFolderPath,
    setSaveSampleBusy,
    setSaveSampleStatus,
    workflowMode,
  ]);

  return { handleChooseSampleSaveFolder, handleSaveLayoutSample };
}
