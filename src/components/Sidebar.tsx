import React from "react";
import { SidebarFooterActions } from "./sidebar/SidebarFooterActions";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import {
  buildSidebarFooterBindings,
  buildSidebarSectionsProps,
  resolveSidebarClassName,
  resolveSidebarLabelsFromProps,
} from "./sidebar/sidebarPropsMapping";
import { SidebarSections } from "./sidebar/SidebarSections";
import type { SidebarProps } from "./sidebar/sidebarTypes";
import { useSidebarState } from "./sidebar/useSidebarState";

export { LanguagePickerPanel } from "./sidebar/LanguagePickerPanel";
export type { SidebarProps } from "./sidebar/sidebarTypes";

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const {
    cartons,
    setCartons,
    onPrimaryAction,
    primaryActionLabel,
    onSecondaryAction,
    secondaryActionLabel,
    t,
    showHeader = true,
    showLanguageSection = true,
    showSampleDatabaseSection = false,
    showExtraPalletMode = true,
  } = props;

  const sidebarState = useSidebarState({ cartons, setCartons });
  const sidebarClassName = resolveSidebarClassName(props.className);
  const resolvedLabels = resolveSidebarLabelsFromProps(props);
  const { hasSecondaryAction, primaryButtonClass, secondaryButtonClass } = buildSidebarFooterBindings({
    secondaryActionLabel,
    onSecondaryAction,
    dualActionPrimaryAccent: props.dualActionPrimaryAccent,
  });
  const sectionsProps = buildSidebarSectionsProps({
    props,
    sidebarState,
    resolvedLabels,
    showLanguageSection,
    showSampleDatabaseSection,
    showExtraPalletMode,
  });

  return (
    <aside className={sidebarClassName}>
      {showHeader && (
        <SidebarHeader appTagline={t.appTagline} />
      )}

      <SidebarSections {...sectionsProps} />

      <SidebarFooterActions
        hasSecondaryAction={hasSecondaryAction}
        onSecondaryAction={onSecondaryAction}
        secondaryActionLabel={secondaryActionLabel}
        onPrimaryAction={onPrimaryAction}
        primaryActionLabel={primaryActionLabel}
        primaryButtonClass={primaryButtonClass}
        secondaryButtonClass={secondaryButtonClass}
      />
    </aside>
  );
};
