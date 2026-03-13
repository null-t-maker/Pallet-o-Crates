import { useEffect } from "react";
import type { PackingProgressSnapshot } from "../lib/packingProgress";

interface WorkflowProgressModalProps {
  progress: PackingProgressSnapshot;
  title: string;
  cancelLabel: string;
  onCancel: () => void;
  statusLabel: string;
  elapsedLabel: string;
  packedLabel: string;
  trialLabel: string;
  palletLabel: string;
  layerLabel: string;
  stagePreparingLabel: string;
  stageAnalyzingManualSeedLabel: string;
  stageTryingTemplateLockLabel: string;
  stageTemplateContinuationLabel: string;
  stagePackingLayoutLabel: string;
  stageComparingFallbackLabel: string;
  stagePackingSupplementaryLabel: string;
}

function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function resolveStageLabel(
  progress: PackingProgressSnapshot,
  props: WorkflowProgressModalProps,
): string {
  switch (progress.stage) {
    case "preparing":
      return props.stagePreparingLabel;
    case "analyzingManualSeed":
      return props.stageAnalyzingManualSeedLabel;
    case "tryingTemplateLock":
      return props.stageTryingTemplateLockLabel;
    case "templateContinuation":
      return props.stageTemplateContinuationLabel;
    case "packingLayout":
      return props.stagePackingLayoutLabel;
    case "comparingFallback":
      return props.stageComparingFallbackLabel;
    case "packingSupplementary":
      return props.stagePackingSupplementaryLabel;
    default:
      return props.stagePackingLayoutLabel;
  }
}

export function WorkflowProgressModal(props: WorkflowProgressModalProps) {
  const { progress } = props;
  const packedPercent = progress.requestedUnits > 0
    ? Math.round((progress.packedUnits / progress.requestedUnits) * 100)
    : 0;
  const hasTrialProgress = typeof progress.trialIndex === "number"
    && typeof progress.trialCount === "number"
    && progress.trialCount > 1;
  const trialPercent = hasTrialProgress
    ? Math.round((progress.trialIndex! / progress.trialCount!) * 100)
    : 0;
  const stageLabel = resolveStageLabel(progress, props);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      props.onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [props.onCancel]);

  return (
    <div
      className="update-check-backdrop"
      role="presentation"
    >
      <div
        className="section-card update-check-modal workflow-progress-modal"
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
      >
        <button
          type="button"
          className="workflow-progress-close"
          onClick={props.onCancel}
          aria-label={props.cancelLabel}
          title={props.cancelLabel}
        >
          ×
        </button>
        <div className="section-body update-check-body workflow-progress-body">
          <h2 className="update-check-title">{props.title}</h2>
          <p className="workflow-progress-status">
            <span className="workflow-progress-label">{props.statusLabel}</span>
            <strong>{stageLabel}</strong>
          </p>
          {progress.detail && (
            <p
              className="workflow-progress-detail"
              title={progress.detail}
            >
              {progress.detail}
            </p>
          )}
          {hasTrialProgress && (
            <div className="workflow-progress-block">
              <p className="workflow-progress-item">
                <span className="workflow-progress-label">{props.trialLabel}</span>
                <strong>{`${progress.trialIndex} / ${progress.trialCount} (${trialPercent}%)`}</strong>
              </p>
              <div className="workflow-progress-meter workflow-progress-meter-secondary">
                <div
                  className="workflow-progress-meter-fill workflow-progress-meter-fill-secondary"
                  style={{ width: `${Math.max(0, Math.min(100, trialPercent))}%` }}
                />
              </div>
            </div>
          )}
          <div className="workflow-progress-block">
            <p className="workflow-progress-item">
              <span className="workflow-progress-label">{props.packedLabel}</span>
              <strong>{`${progress.packedUnits} / ${progress.requestedUnits} (${packedPercent}%)`}</strong>
            </p>
            <div className="workflow-progress-meter">
              <div
                className="workflow-progress-meter-fill"
                style={{ width: `${Math.max(0, Math.min(100, packedPercent))}%` }}
              />
            </div>
          </div>
          <div className="workflow-progress-grid">
            <p className="workflow-progress-item">
              <span className="workflow-progress-label">{props.elapsedLabel}</span>
              <strong>{formatElapsed(progress.elapsedMs)}</strong>
            </p>
            {typeof progress.palletIndex === "number" && (
              <p className="workflow-progress-item">
                <span className="workflow-progress-label">{props.palletLabel}</span>
                <strong>{progress.palletIndex}</strong>
              </p>
            )}
            {typeof progress.layerIndex === "number" && (
              <p className="workflow-progress-item">
                <span className="workflow-progress-label">{props.layerLabel}</span>
                <strong>{progress.layerIndex}</strong>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
