import React from "react";
import { Play } from "lucide-react";

interface SidebarFooterActionsProps {
  hasSecondaryAction: boolean;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  onPrimaryAction: () => void;
  primaryActionLabel: string;
  onWorkflowModeAction?: () => void;
  workflowModeActionLabel?: string;
  primaryButtonClass: string;
  secondaryButtonClass: string;
  actionsDisabled?: boolean;
}

export const SidebarFooterActions: React.FC<SidebarFooterActionsProps> = ({
  hasSecondaryAction,
  onSecondaryAction,
  secondaryActionLabel,
  onPrimaryAction,
  primaryActionLabel,
  onWorkflowModeAction,
  workflowModeActionLabel,
  primaryButtonClass,
  secondaryButtonClass,
  actionsDisabled = false,
}) => {
  return (
    <div className="sidebar-footer">
      {hasSecondaryAction && (
        <button
          className={secondaryButtonClass}
          onClick={onSecondaryAction}
          title={secondaryActionLabel}
          disabled={actionsDisabled}
        >
          <Play size={16} fill="currentColor" /> {secondaryActionLabel}
        </button>
      )}
      <button
        className={primaryButtonClass}
        onClick={onPrimaryAction}
        title={primaryActionLabel}
        disabled={actionsDisabled}
      >
        <Play size={16} fill="currentColor" /> {primaryActionLabel}
      </button>
      {workflowModeActionLabel && onWorkflowModeAction && (
        <button
          className="sidebar-calc-btn sidebar-secondary-btn"
          onClick={onWorkflowModeAction}
          title={workflowModeActionLabel}
          disabled={actionsDisabled}
        >
          <Play size={16} fill="currentColor" /> {workflowModeActionLabel}
        </button>
      )}
    </div>
  );
};
