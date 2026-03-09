import {
  SAMPLE_GUIDANCE_CFG_SCALE_MAX,
  SAMPLE_GUIDANCE_CFG_SCALE_MIN,
  SAMPLE_GUIDANCE_STEPS_MAX,
  SAMPLE_GUIDANCE_STEPS_MIN,
  clamp,
  toErrorMessage,
} from "./sampleIntelligenceLogic";

interface ChooseSampleDatabaseFolderActionArgs {
  pickFolderPath: () => Promise<string | null>;
  setSampleDatabaseFolderPath: React.Dispatch<React.SetStateAction<string>>;
  setSampleDatabaseError: React.Dispatch<React.SetStateAction<string | null>>;
}

export async function chooseSampleDatabaseFolderAction({
  pickFolderPath,
  setSampleDatabaseFolderPath,
  setSampleDatabaseError,
}: ChooseSampleDatabaseFolderActionArgs): Promise<void> {
  try {
    const selectedPath = await pickFolderPath();
    if (!selectedPath) return;
    setSampleDatabaseFolderPath(selectedPath);
  } catch (error) {
    setSampleDatabaseError(toErrorMessage(error));
  }
}

export function reloadSampleDatabaseAction(
  sampleDatabaseFolderPath: string,
  scanSampleDatabaseFolder: (folderPath: string) => Promise<void>,
): void {
  if (!sampleDatabaseFolderPath) return;
  void scanSampleDatabaseFolder(sampleDatabaseFolderPath);
}

export function normalizeSampleGuidanceCfgScalePercent(value: number): number {
  return Math.round(clamp(
    value,
    SAMPLE_GUIDANCE_CFG_SCALE_MIN,
    SAMPLE_GUIDANCE_CFG_SCALE_MAX,
  ));
}

export function normalizeSampleGuidanceSteps(value: number): number {
  return Math.round(clamp(
    value,
    SAMPLE_GUIDANCE_STEPS_MIN,
    SAMPLE_GUIDANCE_STEPS_MAX,
  ));
}

export function normalizeSampleGuidanceSeed(value: number): number {
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}
