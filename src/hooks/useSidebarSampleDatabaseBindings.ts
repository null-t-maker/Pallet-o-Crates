import { buildSampleDatabaseSidebarBindings } from "./sidebarPropsSampleDatabase";
import type { SidebarSampleDatabaseBindingArgs } from "./sidebarBindingsTypes";
import { useSidebarSampleDatabaseBindingMemo } from "./useSidebarSampleDatabaseBindingMemo";
import { useSidebarSampleDatabaseSummary } from "./useSidebarSampleDatabaseSummary";

export function useSidebarSampleDatabaseBindings(
  args: SidebarSampleDatabaseBindingArgs,
): ReturnType<typeof buildSampleDatabaseSidebarBindings> {
  const sampleDatabaseSummary = useSidebarSampleDatabaseSummary(args.sampleDatabaseData);
  return useSidebarSampleDatabaseBindingMemo({ ...args, sampleDatabaseSummary });
}
