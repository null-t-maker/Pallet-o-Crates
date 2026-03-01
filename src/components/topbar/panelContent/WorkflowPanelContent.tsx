import type { WorkflowMode } from "../../Visualizer";

interface WorkflowPanelContentProps {
  workflowMode: WorkflowMode;
  switchWorkflowMode: (mode: WorkflowMode) => void;
  workflowGenerationLabel: string;
  workflowManualLabel: string;
}

export function WorkflowPanelContent({
  workflowMode,
  switchWorkflowMode,
  workflowGenerationLabel,
  workflowManualLabel,
}: WorkflowPanelContentProps) {
  return (
    <div className="section-body topbar-dropdown-body">
      <div className="language-select-options">
        <button
          type="button"
          className={`language-select-option ${workflowMode === "generation" ? "is-active" : ""}`}
          onClick={() => switchWorkflowMode("generation")}
          title={workflowGenerationLabel}
        >
          <span className="language-select-primary">{workflowGenerationLabel}</span>
        </button>
        <button
          type="button"
          className={`language-select-option ${workflowMode === "manual" ? "is-active" : ""}`}
          onClick={() => switchWorkflowMode("manual")}
          title={workflowManualLabel}
        >
          <span className="language-select-primary">{workflowManualLabel}</span>
        </button>
      </div>
    </div>
  );
}
