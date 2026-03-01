import type { SidebarProps } from "../components/Sidebar";
import type { ScanSampleDatabaseResponse } from "../lib/layoutSamples";

export function buildSampleDatabaseSummary(
  sampleDatabaseData: ScanSampleDatabaseResponse | null,
): SidebarProps["sampleDatabaseSummary"] {
  if (!sampleDatabaseData) return null;
  return {
    totalFiles: sampleDatabaseData.totalFiles,
    validFiles: sampleDatabaseData.validFiles,
    invalidFiles: sampleDatabaseData.invalidFiles,
    firstDescriptors: sampleDatabaseData.samples
      .filter((sample) => sample.valid && sample.descriptor)
      .slice(0, 3)
      .map((sample) => sample.descriptor as string),
  };
}
