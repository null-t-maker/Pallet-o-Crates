import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef } from "react";
import type { ScanSampleDatabaseResponse } from "../lib/layoutSamples";
import { toErrorMessage } from "./sampleIntelligenceLogic";

interface UseSampleDatabaseScannerArgs {
  sampleDatabaseFolderPath: string;
  setSampleDatabaseData: React.Dispatch<React.SetStateAction<ScanSampleDatabaseResponse | null>>;
  setSampleDatabaseLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setSampleDatabaseError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useSampleDatabaseScanner({
  sampleDatabaseFolderPath,
  setSampleDatabaseData,
  setSampleDatabaseLoading,
  setSampleDatabaseError,
}: UseSampleDatabaseScannerArgs): {
  scanSampleDatabaseFolder: (folderPath: string) => Promise<void>;
} {
  const sampleDatabaseScanRef = useRef(0);

  const scanSampleDatabaseFolder = useCallback(async (folderPath: string) => {
    const normalized = folderPath.trim();
    if (!normalized) {
      setSampleDatabaseData(null);
      setSampleDatabaseError(null);
      return;
    }

    const requestId = sampleDatabaseScanRef.current + 1;
    sampleDatabaseScanRef.current = requestId;
    setSampleDatabaseLoading(true);
    setSampleDatabaseError(null);

    try {
      const scanned = await invoke<ScanSampleDatabaseResponse>("scan_sample_database", {
        request: { folderPath: normalized },
      });
      if (sampleDatabaseScanRef.current !== requestId) return;
      setSampleDatabaseData(scanned);
      setSampleDatabaseError(null);
    } catch (error) {
      if (sampleDatabaseScanRef.current !== requestId) return;
      setSampleDatabaseData(null);
      setSampleDatabaseError(toErrorMessage(error));
    } finally {
      if (sampleDatabaseScanRef.current === requestId) {
        setSampleDatabaseLoading(false);
      }
    }
  }, [setSampleDatabaseData, setSampleDatabaseError, setSampleDatabaseLoading]);

  useEffect(() => {
    if (!sampleDatabaseFolderPath) {
      setSampleDatabaseData(null);
      setSampleDatabaseError(null);
      setSampleDatabaseLoading(false);
      return;
    }
    void scanSampleDatabaseFolder(sampleDatabaseFolderPath);
  }, [
    sampleDatabaseFolderPath,
    scanSampleDatabaseFolder,
    setSampleDatabaseData,
    setSampleDatabaseError,
    setSampleDatabaseLoading,
  ]);

  return { scanSampleDatabaseFolder };
}
