import { type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { X } from "lucide-react";
import { DiagnosticsSummary } from "../lib/diagnostics";

interface DiagnosticsWindowProps {
  modalRef: React.MutableRefObject<HTMLDivElement | null>;
  modalStyle: CSSProperties | undefined;
  diagnosticsLabel: string;
  closeDiagnosticsLabel: string;
  diagnostics: DiagnosticsSummary | null;
  requestedUnitsLabel: string;
  packedUnitsLabel: string;
  overlapCountLabel: string;
  boundsViolationsLabel: string;
  windowResolutionLabel: string;
  hardChecksLabel: string;
  checksIssuesLabel: string;
  checksOkLabel: string;
  diagnosticsHint: string;
  windowWidth: number;
  windowHeight: number;
  onClose: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

export function DiagnosticsWindow({
  modalRef,
  modalStyle,
  diagnosticsLabel,
  closeDiagnosticsLabel,
  diagnostics,
  requestedUnitsLabel,
  packedUnitsLabel,
  overlapCountLabel,
  boundsViolationsLabel,
  windowResolutionLabel,
  hardChecksLabel,
  checksIssuesLabel,
  checksOkLabel,
  diagnosticsHint,
  windowWidth,
  windowHeight,
  onClose,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: DiagnosticsWindowProps) {
  return (
    <div
      ref={modalRef}
      className="overlay section-card floating-window diagnostics-modal"
      style={modalStyle}
      aria-label={diagnosticsLabel}
    >
      <div
        className="floating-window-title"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <span className="section-title" title={diagnosticsLabel}>{diagnosticsLabel}</span>
        <button
          type="button"
          className="floating-window-close"
          title={closeDiagnosticsLabel}
          aria-label={closeDiagnosticsLabel}
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      {diagnostics ? (
        <div className="section-body floating-window-body diagnostics-window-body">
          <p className="metric-row" style={{ margin: "3px 0", fontSize: "0.83rem" }}>
            <span className="metric-label" title={requestedUnitsLabel}>{requestedUnitsLabel}</span>
            <strong className="metric-value">{diagnostics.requestedUnits}</strong>
          </p>
          <p className="metric-row" style={{ margin: "3px 0", fontSize: "0.83rem" }}>
            <span className="metric-label" title={packedUnitsLabel}>{packedUnitsLabel}</span>
            <strong className="metric-value">{diagnostics.packedUnits}</strong>
          </p>
          <p className="metric-row" style={{ margin: "3px 0", fontSize: "0.83rem" }}>
            <span className="metric-label" title={overlapCountLabel}>{overlapCountLabel}</span>
            <strong className="metric-value">{diagnostics.overlapCount}</strong>
          </p>
          <p className="metric-row" style={{ margin: "3px 0", fontSize: "0.83rem" }}>
            <span className="metric-label" title={boundsViolationsLabel}>{boundsViolationsLabel}</span>
            <strong className="metric-value">{diagnostics.boundsViolations}</strong>
          </p>
          <p className="metric-row" style={{ margin: "3px 0", fontSize: "0.83rem" }}>
            <span className="metric-label" title={windowResolutionLabel}>{windowResolutionLabel}</span>
            <strong className="metric-value">{windowWidth} x {windowHeight}</strong>
          </p>
          <p style={{
            margin: "4px 0 0",
            fontSize: "0.82rem",
            color: diagnostics.hasIssues ? "var(--error)" : "var(--success)",
          }}>
            <strong title={`${hardChecksLabel}: ${diagnostics.hasIssues ? checksIssuesLabel : checksOkLabel}`}>
              {hardChecksLabel}: {diagnostics.hasIssues ? checksIssuesLabel : checksOkLabel}
            </strong>
          </p>
        </div>
      ) : (
        <div className="section-body floating-window-body diagnostics-window-body">
          <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-muted)" }}>
            {diagnosticsHint}
          </p>
        </div>
      )}
    </div>
  );
}
