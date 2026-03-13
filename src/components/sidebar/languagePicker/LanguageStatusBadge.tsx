import approvedStatusIcon from "../../../assets/language-status-approved.svg";
import type { LanguageReviewStatus } from "../../../i18n-language-review-status";

interface LanguageStatusBadgeProps {
  status: LanguageReviewStatus;
  label: string;
}

export function LanguageStatusBadge({
  status,
  label,
}: LanguageStatusBadgeProps) {
  if (status === "none") {
    return null;
  }

  if (status === "approved") {
    return (
      <span
        className="language-status-badge is-approved"
        role="img"
        aria-label={label}
        title={label}
      >
        <img
          src={approvedStatusIcon}
          alt=""
          aria-hidden="true"
          className="language-status-approved-icon"
        />
      </span>
    );
  }

  return (
    <span
      className="language-status-badge is-machine"
      aria-label={label}
      title={label}
    >
      AI
    </span>
  );
}
