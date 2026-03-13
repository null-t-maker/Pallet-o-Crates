import type { SidebarProps } from "./sidebarTypes";
import type { SidebarFooterBindings } from "./sidebarPropsMappingTypes";

export function buildSidebarFooterBindings({
  secondaryActionLabel,
  onSecondaryAction,
  dualActionPrimaryAccent = false,
}: Pick<SidebarProps, "secondaryActionLabel" | "onSecondaryAction" | "dualActionPrimaryAccent">): SidebarFooterBindings {
  const hasSecondaryAction = Boolean(secondaryActionLabel && onSecondaryAction);
  const secondaryButtonClass = `sidebar-calc-btn${hasSecondaryAction && dualActionPrimaryAccent ? " sidebar-secondary-btn" : ""}`;
  const primaryButtonClass = `sidebar-calc-btn${hasSecondaryAction && !dualActionPrimaryAccent ? " sidebar-warning-btn" : ""}`;
  return { hasSecondaryAction, primaryButtonClass, secondaryButtonClass };
}
