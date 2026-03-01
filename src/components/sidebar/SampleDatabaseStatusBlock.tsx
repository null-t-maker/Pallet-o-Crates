import React from "react";
import type { SampleDatabaseSummary } from "./sampleDatabasePanelTypes";

interface SampleDatabaseStatusBlockProps {
  error: string | null;
  loading: boolean;
  scanningLabel: string;
  summary: SampleDatabaseSummary | null;
  summaryPrefix: string;
  guidanceSummary?: string;
}

function summaryLabel(summaryPrefix: string, summary: SampleDatabaseSummary | null): string {
  if (!summary) return `${summaryPrefix}: 0`;
  return `${summaryPrefix}: ${summary.totalFiles} (valid: ${summary.validFiles}, invalid: ${summary.invalidFiles})`;
}

export const SampleDatabaseStatusBlock: React.FC<SampleDatabaseStatusBlockProps> = ({
  error,
  loading,
  scanningLabel,
  summary,
  summaryPrefix,
  guidanceSummary,
}) => {
  return (
    <>
      <p
        className={`sample-db-status${error ? " is-error" : ""}`}
        title={error ?? undefined}
      >
        {error ? error : (loading ? scanningLabel : summaryLabel(summaryPrefix, summary))}
      </p>

      {summary && summary.firstDescriptors.length > 0 && (
        <p
          className="sample-db-preview-list"
          title={summary.firstDescriptors.join(", ")}
        >
          {summary.firstDescriptors.join(", ")}
        </p>
      )}

      {guidanceSummary && (
        <p
          className="sample-db-guidance"
          title={guidanceSummary}
        >
          {guidanceSummary}
        </p>
      )}
    </>
  );
};
