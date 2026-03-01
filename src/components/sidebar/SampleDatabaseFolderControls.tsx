import React from "react";

interface SampleDatabaseFolderControlsProps {
  folderLabel: string;
  folderPath: string;
  folderNotSelectedLabel: string;
  chooseFolderLabel: string;
  reloadLabel: string;
  onChooseFolder?: () => void;
  onReload?: () => void;
  loading: boolean;
}

export const SampleDatabaseFolderControls: React.FC<SampleDatabaseFolderControlsProps> = ({
  folderLabel,
  folderPath,
  folderNotSelectedLabel,
  chooseFolderLabel,
  reloadLabel,
  onChooseFolder,
  onReload,
  loading,
}) => {
  return (
    <>
      <div className="field">
        <label title={folderLabel}>{folderLabel}</label>
        <input
          type="text"
          value={folderPath || ""}
          readOnly
          placeholder={folderNotSelectedLabel}
        />
      </div>

      <div className="row sample-db-actions-row" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="outline sample-db-action-btn"
          onClick={onChooseFolder}
        >
          {chooseFolderLabel}
        </button>
        <button
          type="button"
          className="outline sample-db-action-btn"
          onClick={onReload}
          disabled={loading || !folderPath}
        >
          {reloadLabel}
        </button>
      </div>
    </>
  );
};
