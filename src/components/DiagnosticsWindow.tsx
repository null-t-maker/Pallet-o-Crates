import { type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { X } from "lucide-react";
import { DiagnosticsSummary, type DiagnosticsTelemetry } from "../lib/diagnostics";

interface DiagnosticsWindowProps {
  modalRef: React.MutableRefObject<HTMLDivElement | null>;
  modalStyle: CSSProperties | undefined;
  diagnosticsLabel: string;
  closeDiagnosticsLabel: string;
  diagnostics: DiagnosticsSummary | null;
  diagnosticsTelemetry: DiagnosticsTelemetry;
  diagnosticsRuntimeTelemetryLabel: string;
  diagnosticsLayoutChecksLabel: string;
  fpsLabel: string;
  cpuSystemUtilizationLabel: string;
  cpuAppUtilizationLabel: string;
  memorySystemUsedLabel: string;
  memorySystemTotalLabel: string;
  workingSetAppLabel: string;
  privateMemoryAppLabel: string;
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

interface MetricRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

const STATUS_OK = "#118F38";
const STATUS_WARN = "#FFDD99";
const STATUS_CRIT = "#B3282D";

function resolveStatusColor(value: number | null, warnThreshold: number, critThreshold: number): string | undefined {
  if (value === null || Number.isNaN(value)) {
    return undefined;
  }
  if (value >= critThreshold) {
    return STATUS_CRIT;
  }
  if (value >= warnThreshold) {
    return STATUS_WARN;
  }
  return STATUS_OK;
}

function resolveInverseStatusColor(value: number | null, warnThreshold: number, critThreshold: number): string | undefined {
  if (value === null || Number.isNaN(value)) {
    return undefined;
  }
  if (value <= critThreshold) {
    return STATUS_CRIT;
  }
  if (value <= warnThreshold) {
    return STATUS_WARN;
  }
  return STATUS_OK;
}

function MetricRow({ label, value, valueColor }: MetricRowProps) {
  return (
    <p className="metric-row diagnostics-metric-row">
      <span className="metric-label" title={label}>{label}</span>
      <strong className="metric-value" style={valueColor ? { color: valueColor } : undefined}>{value}</strong>
    </p>
  );
}

function formatPercent(value: number | null): string {
  return value === null ? "--" : `${value}%`;
}

function formatFps(value: number | null): string {
  return value === null ? "--" : `${value}`;
}

function formatMemory(valueMb: number | null): string {
  if (valueMb === null) return "--";
  if (valueMb >= 1024) {
    const gb = valueMb / 1024;
    const digits = gb >= 10 ? 0 : 1;
    return `${gb.toFixed(digits).replace(/\.0$/, "")} GB`;
  }
  return `${valueMb} MB`;
}

export function DiagnosticsWindow({
  modalRef,
  modalStyle,
  diagnosticsLabel,
  closeDiagnosticsLabel,
  diagnostics,
  diagnosticsTelemetry,
  diagnosticsRuntimeTelemetryLabel,
  diagnosticsLayoutChecksLabel,
  fpsLabel,
  cpuSystemUtilizationLabel,
  cpuAppUtilizationLabel,
  memorySystemUsedLabel,
  memorySystemTotalLabel,
  workingSetAppLabel,
  privateMemoryAppLabel,
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
  const systemMemoryPercent = diagnosticsTelemetry.memorySystemUsedMb !== null
    && diagnosticsTelemetry.memorySystemTotalMb !== null
    && diagnosticsTelemetry.memorySystemTotalMb > 0
    ? (diagnosticsTelemetry.memorySystemUsedMb / diagnosticsTelemetry.memorySystemTotalMb) * 100
    : null;
  const workingSetPercent = diagnosticsTelemetry.memoryAppWorkingSetMb !== null
    && diagnosticsTelemetry.memorySystemTotalMb !== null
    && diagnosticsTelemetry.memorySystemTotalMb > 0
    ? (diagnosticsTelemetry.memoryAppWorkingSetMb / diagnosticsTelemetry.memorySystemTotalMb) * 100
    : null;
  const privateMemoryPercent = diagnosticsTelemetry.memoryAppPrivateMb !== null
    && diagnosticsTelemetry.memorySystemTotalMb !== null
    && diagnosticsTelemetry.memorySystemTotalMb > 0
    ? (diagnosticsTelemetry.memoryAppPrivateMb / diagnosticsTelemetry.memorySystemTotalMb) * 100
    : null;

  const fpsColor = resolveInverseStatusColor(diagnosticsTelemetry.fps, 60, 30);
  const cpuSystemColor = resolveStatusColor(diagnosticsTelemetry.cpuSystemUsage, 60, 85);
  const cpuAppColor = resolveStatusColor(diagnosticsTelemetry.cpuAppUsage, 60, 85);
  const systemMemoryColor = resolveStatusColor(systemMemoryPercent, 70, 90);
  const workingSetColor = resolveStatusColor(workingSetPercent, 5, 10);
  const privateMemoryColor = resolveStatusColor(privateMemoryPercent, 5, 10);

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

      <div className="section-body floating-window-body diagnostics-window-body">
        <p className="diagnostics-group-title" title={diagnosticsRuntimeTelemetryLabel}>
          {diagnosticsRuntimeTelemetryLabel}
        </p>
        <MetricRow label={fpsLabel} value={formatFps(diagnosticsTelemetry.fps)} valueColor={fpsColor} />
        <MetricRow
          label={cpuSystemUtilizationLabel}
          value={formatPercent(diagnosticsTelemetry.cpuSystemUsage)}
          valueColor={cpuSystemColor}
        />
        <MetricRow
          label={cpuAppUtilizationLabel}
          value={formatPercent(diagnosticsTelemetry.cpuAppUsage)}
          valueColor={cpuAppColor}
        />
        <MetricRow
          label={memorySystemUsedLabel}
          value={formatMemory(diagnosticsTelemetry.memorySystemUsedMb)}
          valueColor={systemMemoryColor}
        />
        <MetricRow
          label={memorySystemTotalLabel}
          value={formatMemory(diagnosticsTelemetry.memorySystemTotalMb)}
          valueColor={systemMemoryColor}
        />
        <MetricRow
          label={workingSetAppLabel}
          value={formatMemory(diagnosticsTelemetry.memoryAppWorkingSetMb)}
          valueColor={workingSetColor}
        />
        <MetricRow
          label={privateMemoryAppLabel}
          value={formatMemory(diagnosticsTelemetry.memoryAppPrivateMb)}
          valueColor={privateMemoryColor}
        />
        <MetricRow label={windowResolutionLabel} value={`${windowWidth} x ${windowHeight}`} />

        <div className="diagnostics-divider" />

        <p className="diagnostics-group-title" title={diagnosticsLayoutChecksLabel}>
          {diagnosticsLayoutChecksLabel}
        </p>

        {diagnostics ? (
          <>
            <MetricRow label={requestedUnitsLabel} value={`${diagnostics.requestedUnits}`} />
            <MetricRow label={packedUnitsLabel} value={`${diagnostics.packedUnits}`} />
            <MetricRow label={overlapCountLabel} value={`${diagnostics.overlapCount}`} />
            <MetricRow label={boundsViolationsLabel} value={`${diagnostics.boundsViolations}`} />
            <MetricRow
              label={hardChecksLabel}
              value={diagnostics.hasIssues ? checksIssuesLabel : checksOkLabel}
              valueColor={diagnostics.hasIssues ? "var(--error)" : "var(--success)"}
            />
          </>
        ) : (
          <p className="diagnostics-hint">
            {diagnosticsHint}
          </p>
        )}
      </div>
    </div>
  );
}
