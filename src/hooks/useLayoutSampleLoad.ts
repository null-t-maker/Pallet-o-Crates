import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { WorkflowMode } from "../components/Visualizer";
import type { LoadLayoutSampleResponse, ScanSampleDatabaseResponse } from "../lib/layoutSamples";
import { hydrateLoadedLayoutSample } from "../lib/layoutSampleLoader";
import type { CartonInput, MultiPackResult, PackedCarton, PalletInput } from "../lib/packer";

interface SampleLoadStatus {
  kind: "success" | "error";
  message: string;
}

interface SampleLoadOption {
  value: string;
  label: string;
}

interface UseLayoutSampleLoadArgs {
  sampleDatabaseFolderPath: string;
  sampleDatabaseData: ScanSampleDatabaseResponse | null;
  sampleDatabaseLoading: boolean;
  sampleDatabaseError: string | null;
  handleChooseSampleDatabaseFolder: () => Promise<void>;
  handleReloadSampleDatabase: () => void;
  setPallet: (value: PalletInput) => void;
  setCartons: (value: CartonInput[]) => void;
  setResult: Dispatch<SetStateAction<MultiPackResult | null>>;
  setGenerationSeedResult: Dispatch<SetStateAction<MultiPackResult | null>>;
  setWorkflowMode: Dispatch<SetStateAction<WorkflowMode>>;
  applyManualCartons: (
    cartons: PackedCarton[],
    options?: { recordHistory?: boolean; resetHistory?: boolean },
  ) => void;
  clearManualLayout: () => void;
  setVisibleLayers: (value: number) => void;
  setManualShadowModeEnabled: Dispatch<SetStateAction<boolean>>;
  sampleLoadNoSamplesLabel: string;
  sampleLoadNoFileSelectedLabel: string;
  sampleLoadedPrefix: string;
  sampleLoadFailedPrefix: string;
}

export interface UseLayoutSampleLoadResult {
  sampleLoadFolderPath: string;
  sampleLoadOptions: readonly SampleLoadOption[];
  sampleLoadHasOptions: boolean;
  sampleLoadSelectedFilePath: string;
  setSampleLoadSelectedFilePath: Dispatch<SetStateAction<string>>;
  sampleLoadScanning: boolean;
  sampleLoadFolderError: string | null;
  sampleLoadBusy: boolean;
  sampleLoadStatus: SampleLoadStatus | null;
  handleChooseSampleLoadFolder: () => Promise<void>;
  handleReloadSampleLoadFolder: () => void;
  handleLoadLayoutSample: () => Promise<void>;
}

function toLoadSampleErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  if (typeof error === "string" && error.trim().length > 0) return error;
  return "Unknown error";
}

function relativeSamplePath(folderPath: string, filePath: string, fallback: string): string {
  const normalizedFolder = folderPath.trim().replace(/[\\/]+$/, "");
  if (!normalizedFolder) return fallback;
  const normalizedFolderLower = normalizedFolder.toLowerCase();
  const filePathLower = filePath.toLowerCase();
  if (!filePathLower.startsWith(normalizedFolderLower)) return fallback;
  const nextChar = filePath[normalizedFolder.length];
  if (nextChar && nextChar !== "\\" && nextChar !== "/") return fallback;
  const relative = filePath.slice(normalizedFolder.length).replace(/^[\\/]+/, "");
  return relative || fallback;
}

export function useLayoutSampleLoad({
  sampleDatabaseFolderPath,
  sampleDatabaseData,
  sampleDatabaseLoading,
  sampleDatabaseError,
  handleChooseSampleDatabaseFolder,
  handleReloadSampleDatabase,
  setPallet,
  setCartons,
  setResult,
  setGenerationSeedResult,
  setWorkflowMode,
  applyManualCartons,
  clearManualLayout,
  setVisibleLayers,
  setManualShadowModeEnabled,
  sampleLoadNoSamplesLabel,
  sampleLoadNoFileSelectedLabel,
  sampleLoadedPrefix,
  sampleLoadFailedPrefix,
}: UseLayoutSampleLoadArgs): UseLayoutSampleLoadResult {
  const [sampleLoadSelectedFilePath, setSampleLoadSelectedFilePath] = useState("");
  const [sampleLoadBusy, setSampleLoadBusy] = useState(false);
  const [sampleLoadStatus, setSampleLoadStatus] = useState<SampleLoadStatus | null>(null);

  const validSamples = useMemo(
    () => (sampleDatabaseData?.samples ?? []).filter((sample) => sample.valid),
    [sampleDatabaseData],
  );

  const sampleLoadHasOptions = validSamples.length > 0;
  const sampleLoadOptions = useMemo<readonly SampleLoadOption[]>(() => {
    if (!sampleLoadHasOptions) {
      return [{ value: "", label: sampleLoadNoSamplesLabel }];
    }
    return validSamples.map((sample) => {
      const relativePathLabel = relativeSamplePath(
        sampleDatabaseFolderPath,
        sample.filePath,
        sample.fileName,
      );
      return {
        value: sample.filePath,
        label: sample.descriptor
          ? `${sample.descriptor} (${relativePathLabel})`
          : relativePathLabel,
      };
    });
  }, [sampleDatabaseFolderPath, sampleLoadHasOptions, sampleLoadNoSamplesLabel, validSamples]);

  useEffect(() => {
    if (!sampleLoadHasOptions) {
      if (sampleLoadSelectedFilePath !== "") {
        setSampleLoadSelectedFilePath("");
      }
      return;
    }
    if (validSamples.some((sample) => sample.filePath === sampleLoadSelectedFilePath)) {
      return;
    }
    setSampleLoadSelectedFilePath(validSamples[0]?.filePath ?? "");
  }, [sampleLoadHasOptions, sampleLoadSelectedFilePath, validSamples]);

  useEffect(() => {
    setSampleLoadStatus(null);
  }, [sampleDatabaseFolderPath, sampleLoadSelectedFilePath]);

  const handleChooseSampleLoadFolder = useCallback(async () => {
    setSampleLoadStatus(null);
    await handleChooseSampleDatabaseFolder();
  }, [handleChooseSampleDatabaseFolder]);

  const handleReloadSampleLoadFolder = useCallback(() => {
    setSampleLoadStatus(null);
    handleReloadSampleDatabase();
  }, [handleReloadSampleDatabase]);

  const handleLoadLayoutSample = useCallback(async () => {
    if (sampleLoadBusy) return;
    if (!sampleLoadSelectedFilePath) {
      setSampleLoadStatus({
        kind: "error",
        message: `${sampleLoadFailedPrefix} ${sampleLoadNoFileSelectedLabel}`,
      });
      return;
    }

    setSampleLoadBusy(true);
    setSampleLoadStatus(null);
    try {
      const loaded = await invoke<LoadLayoutSampleResponse>("load_layout_sample", {
        request: { filePath: sampleLoadSelectedFilePath },
      });
      const hydrated = hydrateLoadedLayoutSample(loaded.payload);
      if (!hydrated.ok) {
        throw new Error(hydrated.error);
      }

      setPallet(hydrated.value.pallet);
      setCartons(hydrated.value.cartons);
      setGenerationSeedResult(null);
      setVisibleLayers(0);
      setManualShadowModeEnabled(false);

      if (hydrated.value.workflowMode === "manual") {
        setResult(null);
        applyManualCartons(hydrated.value.manualCartons, { resetHistory: true });
        setWorkflowMode("manual");
      } else {
        clearManualLayout();
        setResult(hydrated.value.result);
        setWorkflowMode("generation");
      }

      const selectedSample = validSamples.find((sample) => sample.filePath === sampleLoadSelectedFilePath);
      const loadedLabel = hydrated.value.descriptor
        ?? selectedSample?.descriptor
        ?? selectedSample?.fileName
        ?? loaded.filePath;
      setSampleLoadStatus({
        kind: "success",
        message: `${sampleLoadedPrefix} ${loadedLabel}`,
      });
    } catch (error) {
      setSampleLoadStatus({
        kind: "error",
        message: `${sampleLoadFailedPrefix} ${toLoadSampleErrorMessage(error)}`,
      });
    } finally {
      setSampleLoadBusy(false);
    }
  }, [
    applyManualCartons,
    clearManualLayout,
    sampleLoadBusy,
    sampleLoadFailedPrefix,
    sampleLoadNoFileSelectedLabel,
    sampleLoadSelectedFilePath,
    sampleLoadedPrefix,
    setCartons,
    setGenerationSeedResult,
    setManualShadowModeEnabled,
    setPallet,
    setResult,
    setVisibleLayers,
    setWorkflowMode,
    validSamples,
  ]);

  return {
    sampleLoadFolderPath: sampleDatabaseFolderPath,
    sampleLoadOptions,
    sampleLoadHasOptions,
    sampleLoadSelectedFilePath,
    setSampleLoadSelectedFilePath,
    sampleLoadScanning: sampleDatabaseLoading,
    sampleLoadFolderError: sampleDatabaseError,
    sampleLoadBusy,
    sampleLoadStatus,
    handleChooseSampleLoadFolder,
    handleReloadSampleLoadFolder,
    handleLoadLayoutSample,
  };
}
