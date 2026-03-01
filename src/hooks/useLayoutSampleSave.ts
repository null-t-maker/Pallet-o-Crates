import { useEffect, useState } from "react";
import { SampleSavePackingStyle } from "../lib/layoutSamples";
import type { UseLayoutSampleSaveArgs, UseLayoutSampleSaveResult } from "./layoutSampleSaveTypes";
import {
  getInitialSampleSaveFolderPath,
  getInitialSampleSavePackingStyle,
  persistSampleSaveFolderPath,
  persistSampleSavePackingStyle,
} from "./layoutSampleSaveStorage";
import { useLayoutSampleSaveActions } from "./useLayoutSampleSaveActions";
export type { SaveSampleStatus, UseLayoutSampleSaveArgs, UseLayoutSampleSaveResult } from "./layoutSampleSaveTypes";

export function useLayoutSampleSave({
  workflowMode,
  pallet,
  cartons,
  result,
  manualCartons,
  pickFolderPath,
  sampleFolderNotSelectedLabel,
  sampleSavedPrefix,
  sampleSaveFailedPrefix,
}: UseLayoutSampleSaveArgs): UseLayoutSampleSaveResult {
  const [sampleSaveFolderPath, setSampleSaveFolderPath] = useState<string>(getInitialSampleSaveFolderPath);
  const [sampleSaveName, setSampleSaveName] = useState("");
  const [sampleSavePackingStyle, setSampleSavePackingStyle] = useState<SampleSavePackingStyle>(
    getInitialSampleSavePackingStyle,
  );
  const [saveSampleBusy, setSaveSampleBusy] = useState(false);
  const [saveSampleStatus, setSaveSampleStatus] = useState<UseLayoutSampleSaveResult["saveSampleStatus"]>(null);

  useEffect(() => {
    persistSampleSaveFolderPath(sampleSaveFolderPath);
  }, [sampleSaveFolderPath]);

  useEffect(() => {
    persistSampleSavePackingStyle(sampleSavePackingStyle);
  }, [sampleSavePackingStyle]);

  const { handleChooseSampleSaveFolder, handleSaveLayoutSample } = useLayoutSampleSaveActions({
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
    setSampleSaveFolderPath,
    setSaveSampleStatus,
    setSaveSampleBusy,
  });

  return {
    sampleSaveFolderPath,
    setSampleSaveFolderPath,
    sampleSaveName,
    setSampleSaveName,
    sampleSavePackingStyle,
    setSampleSavePackingStyle,
    saveSampleBusy,
    saveSampleStatus,
    setSaveSampleStatus,
    handleChooseSampleSaveFolder,
    handleSaveLayoutSample,
  };
}
