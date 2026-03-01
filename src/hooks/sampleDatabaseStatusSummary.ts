import type { BuildSampleDatabaseStatusSummaryArgs } from "./sampleDatabaseControlsTypes";

export function buildSampleDatabaseStatusSummary({
  sampleGuidance,
  sampleGuidanceEnabled,
  sampleTemplateLockEnabled,
  sampleTemplateLockStatus,
  templateLockCandidate,
  sampleGuidanceActiveLabel,
  sampleGuidanceCenterLabel,
  sampleGuidanceEdgeLabel,
  sampleGuidanceOffManualLabel,
  sampleGuidanceOffNoDirectionalLabel,
  templateLockReadyLabel,
  templateLockNoMatchLabel,
  templateLockShapeMatchLabel,
  templateLockExactMatchLabel,
  templateLockDisabledLabel,
}: BuildSampleDatabaseStatusSummaryArgs): string {
  const templateLockStateText = sampleTemplateLockEnabled
    ? (sampleTemplateLockStatus ?? (
      templateLockCandidate
        ? `${templateLockReadyLabel} (${templateLockCandidate.sample.fileName}, ${
          templateLockCandidate.matchKind === "exact" ? templateLockExactMatchLabel : templateLockShapeMatchLabel
        })`
        : templateLockNoMatchLabel
    ))
    : templateLockDisabledLabel;

  const sampleGuidanceSummaryText = sampleGuidance
    ? `${sampleGuidanceActiveLabel}: ${
      sampleGuidance.preferredMode === "center" ? sampleGuidanceCenterLabel : sampleGuidanceEdgeLabel
    } (${Math.round((sampleGuidance.confidence ?? 0) * 100)}%, n=${sampleGuidance.sourceSampleCount ?? 0}, cfg=${(sampleGuidance.cfgScale ?? 1).toFixed(2)}, steps=${Math.max(1, Math.floor(sampleGuidance.searchSteps ?? 1))}, filter=${sampleGuidance.sampleFilter ?? "all"})`
    : `${sampleGuidanceActiveLabel}: ${sampleGuidanceEnabled ? sampleGuidanceOffNoDirectionalLabel : sampleGuidanceOffManualLabel}`;

  return `${sampleGuidanceSummaryText} | ${templateLockStateText}`;
}
