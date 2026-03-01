interface UpdateCheckModalProps {
  updateCheckTitle: string;
  updateCheckQuestion: string;
  updateCheckYesLabel: string;
  updateCheckNoLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function UpdateCheckModal({
  updateCheckTitle,
  updateCheckQuestion,
  updateCheckYesLabel,
  updateCheckNoLabel,
  onConfirm,
  onClose,
}: UpdateCheckModalProps) {
  return (
    <div
      className="update-check-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="section-card update-check-modal"
        role="dialog"
        aria-modal="true"
        aria-label={updateCheckTitle}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="section-body update-check-body">
          <h2 className="update-check-title">{updateCheckTitle}</h2>
          <p className="update-check-question">{updateCheckQuestion}</p>
          <div className="update-check-actions">
            <button
              type="button"
              className="update-check-btn update-check-btn-yes"
              onClick={onConfirm}
            >
              {updateCheckYesLabel}
            </button>
            <button
              type="button"
              className="update-check-btn"
              onClick={onClose}
            >
              {updateCheckNoLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
