import { WorkflowPanelContent } from "./TopbarPanelContent";
import { TopbarActionWithPanel } from "./TopbarActionWithPanel";
import type { TopbarCorePanelsProps } from "./TopbarCorePanels.types";

type TopbarWorkflowPanelActionProps = Pick<
  TopbarCorePanelsProps,
  | "topbarPanels"
  | "workflowLabel"
  | "currentWorkflowLabel"
  | "workflowMode"
  | "switchWorkflowMode"
  | "workflowGenerationLabel"
  | "workflowManualLabel"
>;

export function TopbarWorkflowPanelAction({
  topbarPanels,
  workflowLabel,
  currentWorkflowLabel,
  workflowMode,
  switchWorkflowMode,
  workflowGenerationLabel,
  workflowManualLabel,
}: TopbarWorkflowPanelActionProps) {
  return (
    <TopbarActionWithPanel
      wrapperClassName="topbar-workflow-wrap"
      navRef={topbarPanels.workflowNavRef}
      isOpen={topbarPanels.workflowPanelOpen}
      title={workflowLabel}
      onToggle={topbarPanels.toggleWorkflowPanel}
      dropdownClassName="workflow-dropdown"
      dropdownStyle={topbarPanels.workflowDropdownStyle}
      buttonContent={(
        <span className="topbar-action-label" title={workflowLabel}>
          {workflowLabel}: {currentWorkflowLabel}
        </span>
      )}
    >
      <WorkflowPanelContent
        workflowMode={workflowMode}
        switchWorkflowMode={switchWorkflowMode}
        workflowGenerationLabel={workflowGenerationLabel}
        workflowManualLabel={workflowManualLabel}
      />
    </TopbarActionWithPanel>
  );
}
