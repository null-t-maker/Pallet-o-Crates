export { buildSidebarFooterBindings } from "./sidebarFooterBindings";
export { resolveSidebarLabelsFromProps } from "./sidebarLabelPropsResolver";
export { buildSidebarSectionsProps } from "./sidebarSectionsPropsBuilder";
export type { BuildSidebarSectionsPropsArgs, ResolvedSidebarLabels, SidebarFooterBindings, SidebarState } from "./sidebarPropsMappingTypes";

export function resolveSidebarClassName(className?: string): string {
  return className ? `sidebar ${className}` : "sidebar";
}
