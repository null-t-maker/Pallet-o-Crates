import { buildSidebarActionBindings } from "./sidebarPropsActions";
import { buildSampleDatabaseSidebarBindings } from "./sidebarPropsSampleDatabase";
import type { SidebarBindingArgs } from "./sidebarBindingsTypes";
import { useSidebarActionBindings } from "./useSidebarActionBindings";
import { useSidebarSampleDatabaseBindings } from "./useSidebarSampleDatabaseBindings";

export function useSidebarBindings(args: SidebarBindingArgs): {
  actionBindings: ReturnType<typeof buildSidebarActionBindings>;
  sampleDatabaseBindings: ReturnType<typeof buildSampleDatabaseSidebarBindings>;
} {
  const actionBindings = useSidebarActionBindings(args);
  const sampleDatabaseBindings = useSidebarSampleDatabaseBindings(args);
  return { actionBindings, sampleDatabaseBindings };
}
