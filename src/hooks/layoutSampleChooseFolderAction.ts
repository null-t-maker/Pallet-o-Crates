import type { SaveSampleStatus } from "./layoutSampleSaveTypes";
import { toSaveSampleErrorMessage } from "./layoutSampleSaveUtils";

type SaveSampleStatusSetter = React.Dispatch<React.SetStateAction<SaveSampleStatus | null>>;

export interface ChooseSampleSaveFolderActionArgs {
  pickFolderPath: () => Promise<string | null>;
  sampleSaveFailedPrefix: string;
  setSampleSaveFolderPath: React.Dispatch<React.SetStateAction<string>>;
  setSaveSampleStatus: SaveSampleStatusSetter;
}

export async function chooseSampleSaveFolderAction({
  pickFolderPath,
  sampleSaveFailedPrefix,
  setSampleSaveFolderPath,
  setSaveSampleStatus,
}: ChooseSampleSaveFolderActionArgs): Promise<void> {
  try {
    const selectedPath = await pickFolderPath();
    if (!selectedPath) return;
    setSampleSaveFolderPath(selectedPath);
    setSaveSampleStatus(null);
  } catch (error) {
    setSaveSampleStatus({
      kind: "error",
      message: `${sampleSaveFailedPrefix} ${toSaveSampleErrorMessage(error)}`,
    });
  }
}
