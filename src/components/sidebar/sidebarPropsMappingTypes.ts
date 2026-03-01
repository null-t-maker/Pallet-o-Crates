import { resolveSidebarLabels } from "./sidebarLabelResolver";
import type { SidebarProps } from "./sidebarTypes";
import type { useSidebarState } from "./useSidebarState";

export type SidebarState = ReturnType<typeof useSidebarState>;
export type ResolvedSidebarLabels = ReturnType<typeof resolveSidebarLabels>;

export interface BuildSidebarSectionsPropsArgs {
  props: SidebarProps;
  sidebarState: SidebarState;
  resolvedLabels: ResolvedSidebarLabels;
  showLanguageSection: boolean;
  showSampleDatabaseSection: boolean;
  showExtraPalletMode: boolean;
}

export interface SidebarFooterBindings {
  hasSecondaryAction: boolean;
  primaryButtonClass: string;
  secondaryButtonClass: string;
}
