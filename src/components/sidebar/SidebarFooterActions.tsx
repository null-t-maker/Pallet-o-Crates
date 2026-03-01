import React from "react";
import { Play } from "lucide-react";

interface SidebarFooterActionsProps {
  hasSecondaryAction: boolean;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  onPrimaryAction: () => void;
  primaryActionLabel: string;
  primaryButtonClass: string;
  secondaryButtonClass: string;
}

export const SidebarFooterActions: React.FC<SidebarFooterActionsProps> = ({
  hasSecondaryAction,
  onSecondaryAction,
  secondaryActionLabel,
  onPrimaryAction,
  primaryActionLabel,
  primaryButtonClass,
  secondaryButtonClass,
}) => {
  return (
    <div className="sidebar-footer">
      {hasSecondaryAction && (
        <button className={secondaryButtonClass} onClick={onSecondaryAction} title={secondaryActionLabel}>
          <Play size={16} fill="currentColor" /> {secondaryActionLabel}
        </button>
      )}
      <button
        className={primaryButtonClass}
        onClick={onPrimaryAction}
        title={primaryActionLabel}
      >
        <Play size={16} fill="currentColor" /> {primaryActionLabel}
      </button>
    </div>
  );
};
