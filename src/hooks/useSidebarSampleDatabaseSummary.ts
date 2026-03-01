import { useMemo } from "react";
import { buildSampleDatabaseSummary } from "./sidebarPropsSampleDatabase";
import type { SidebarSampleDatabaseBindingArgs } from "./sidebarBindingsTypes";

export function useSidebarSampleDatabaseSummary(
  sampleDatabaseData: SidebarSampleDatabaseBindingArgs["sampleDatabaseData"],
): ReturnType<typeof buildSampleDatabaseSummary> {
  return useMemo(
    () => buildSampleDatabaseSummary(sampleDatabaseData),
    [sampleDatabaseData],
  );
}
