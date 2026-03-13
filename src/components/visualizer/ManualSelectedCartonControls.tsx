import React from "react";
import type { PackedCarton, PalletInput } from "../../lib/packer";
import type { ManualPatch } from "./manualCartonEditingCore";
import {
  buildManualAxisDraftValues,
  buildManualAxisPatchFromDraft,
  hasManualAxisDraftChanges,
  type ManualAxisDraftValues,
} from "./manualAxisDraft";
import { roundMm } from "./visualizerHelpers";

interface ManualSelectedCartonControlsProps {
  selectedManualCarton: PackedCarton;
  pallet: PalletInput;
  manualMoveStepMm: number;
  setManualMoveStepMm: React.Dispatch<React.SetStateAction<number>>;
  manualHint: string | null;
  manualShadowModeEnabled: boolean;
  handleManualRotate: (plane: "xy" | "xz" | "yz") => void;
  handleManualShadowModeChange: (enabled: boolean) => boolean;
  handleManualAlignToSupportEdgeX: () => void;
  handleManualAlignToSupportEdgeY: () => void;
  handleManualAxisInput: (axis: "x" | "y" | "z", rawValue: string) => void;
  handleManualAxisPatchInput: (patch: ManualPatch) => boolean;
  manualMoveStepLabel: string;
  manualRotateLabel: string;
  manualRotateHorizontalLabel: string;
  manualRotateVerticalXLabel: string;
  manualRotateVerticalYLabel: string;
  manualShadowModeLabel: string;
  manualShadowModeOnLabel: string;
  manualShadowModeOffLabel: string;
  manualAlignSectionLabel: string;
  manualAlignXButtonLabel: string;
  manualAlignYButtonLabel: string;
  manualAxisInputModeLabel: string;
  manualAxisInputAutoLabel: string;
  manualAxisInputManualLabel: string;
  manualAxisApplyLabel: string;
  manualPalletAreaLabel: (width: number, length: number) => string;
}

export function ManualSelectedCartonControls({
  selectedManualCarton,
  pallet,
  manualMoveStepMm,
  setManualMoveStepMm,
  manualHint,
  manualShadowModeEnabled,
  handleManualRotate,
  handleManualShadowModeChange,
  handleManualAlignToSupportEdgeX,
  handleManualAlignToSupportEdgeY,
  handleManualAxisInput,
  handleManualAxisPatchInput,
  manualMoveStepLabel,
  manualRotateLabel,
  manualRotateHorizontalLabel,
  manualRotateVerticalXLabel,
  manualRotateVerticalYLabel,
  manualShadowModeLabel,
  manualShadowModeOnLabel,
  manualShadowModeOffLabel,
  manualAlignSectionLabel,
  manualAlignXButtonLabel,
  manualAlignYButtonLabel,
  manualAxisInputModeLabel,
  manualAxisInputAutoLabel,
  manualAxisInputManualLabel,
  manualAxisApplyLabel,
  manualPalletAreaLabel,
}: ManualSelectedCartonControlsProps) {
  const [axisInputMode, setAxisInputMode] = React.useState<"auto" | "manual">("auto");
  const [draft, setDraft] = React.useState<ManualAxisDraftValues>(
    () => buildManualAxisDraftValues(selectedManualCarton),
  );

  React.useEffect(() => {
    setDraft(buildManualAxisDraftValues(selectedManualCarton));
  }, [
    selectedManualCarton.id,
    selectedManualCarton.x,
    selectedManualCarton.y,
    selectedManualCarton.z,
  ]);

  const applyManualAxisDraft = React.useCallback(() => {
    const patch = buildManualAxisPatchFromDraft(draft, selectedManualCarton);
    const committed = handleManualAxisPatchInput(patch);
    if (committed) {
      setDraft(buildManualAxisDraftValues({
        x: patch.x ?? selectedManualCarton.x,
        y: patch.y ?? selectedManualCarton.y,
        z: patch.z ?? selectedManualCarton.z,
      }));
    }
    return committed;
  }, [draft, handleManualAxisPatchInput, selectedManualCarton]);

  const hasDraftChanges = hasManualAxisDraftChanges(draft, selectedManualCarton);

  const handleDraftChange = React.useCallback((axis: "x" | "y" | "z", rawValue: string) => {
    setDraft((current) => ({
      ...current,
      [axis]: rawValue,
    }));
  }, []);

  const handleAxisModeChange = React.useCallback((nextMode: "auto" | "manual") => {
    if (nextMode === axisInputMode) return;
    if (nextMode === "manual") {
      setDraft(buildManualAxisDraftValues(selectedManualCarton));
    }
    setAxisInputMode(nextMode);
  }, [axisInputMode, selectedManualCarton]);

  const handleManualKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (axisInputMode !== "manual") return;
    if (event.key !== "Enter") return;
    event.preventDefault();
    applyManualAxisDraft();
  }, [applyManualAxisDraft, axisInputMode]);

  return (
    <>
      <p style={{ margin: "2px 0 4px", fontSize: "0.77rem", color: "var(--text-muted)" }}>
        {manualPalletAreaLabel(pallet.width, pallet.length)}
      </p>
      <div className="manual-toolbar-row">
        <span className="manual-toolbar-label">{manualMoveStepLabel}</span>
        <div className="manual-step-input-wrap">
          <input
            type="number"
            min={0}
            step={1}
            value={manualMoveStepMm}
            onChange={(event) => {
              const next = Number.parseFloat(event.target.value);
              if (!Number.isFinite(next)) {
                setManualMoveStepMm(0);
                return;
              }
              setManualMoveStepMm(Math.max(0, roundMm(next)));
            }}
          />
        </div>
      </div>
      <div className="manual-toolbar-row">
        <span className="manual-toolbar-label">{manualShadowModeLabel}</span>
        <div className="manual-toolbar-actions">
          <button
            type="button"
            className={`manual-mini-btn${manualShadowModeEnabled ? " is-active" : ""}`}
            onClick={() => handleManualShadowModeChange(true)}
          >
            {manualShadowModeOnLabel}
          </button>
          <button
            type="button"
            className={`manual-mini-btn${!manualShadowModeEnabled ? " is-active" : ""}`}
            onClick={() => handleManualShadowModeChange(false)}
          >
            {manualShadowModeOffLabel}
          </button>
        </div>
      </div>
      <div className="manual-toolbar-row">
        <span className="manual-toolbar-label">{manualAlignSectionLabel}</span>
        <div className="manual-toolbar-actions">
          <button
            type="button"
            className="manual-mini-btn"
            onClick={handleManualAlignToSupportEdgeX}
          >
            {manualAlignXButtonLabel}
          </button>
          <button
            type="button"
            className="manual-mini-btn"
            onClick={handleManualAlignToSupportEdgeY}
          >
            {manualAlignYButtonLabel}
          </button>
        </div>
      </div>
      <div className="manual-toolbar-row">
        <span className="manual-toolbar-label">{manualRotateLabel}</span>
        <div className="manual-toolbar-actions">
          <button
            type="button"
            className="manual-mini-btn"
            title={manualRotateHorizontalLabel}
            onClick={() => handleManualRotate("xy")}
          >
            H 90
          </button>
          <button
            type="button"
            className="manual-mini-btn"
            title={manualRotateVerticalXLabel}
            onClick={() => handleManualRotate("xz")}
          >
            VX 90
          </button>
          <button
            type="button"
            className="manual-mini-btn"
            title={manualRotateVerticalYLabel}
            onClick={() => handleManualRotate("yz")}
          >
            VY 90
          </button>
        </div>
      </div>
      <div className="manual-coord-grid">
        <label className="manual-coord-field" title="X (mm)">
          <span>X</span>
          <input
            type="number"
            step={1}
            value={axisInputMode === "manual" ? draft.x : roundMm(selectedManualCarton.x)}
            onChange={(event) => (
              axisInputMode === "manual"
                ? handleDraftChange("x", event.target.value)
                : handleManualAxisInput("x", event.target.value)
            )}
            onKeyDown={handleManualKeyDown}
          />
        </label>
        <label className="manual-coord-field" title="Y (mm)">
          <span>Y</span>
          <input
            type="number"
            step={1}
            value={axisInputMode === "manual" ? draft.y : roundMm(selectedManualCarton.y)}
            onChange={(event) => (
              axisInputMode === "manual"
                ? handleDraftChange("y", event.target.value)
                : handleManualAxisInput("y", event.target.value)
            )}
            onKeyDown={handleManualKeyDown}
          />
        </label>
        <label className="manual-coord-field" title="Z (mm)">
          <span>Z</span>
          <input
            type="number"
            step={1}
            value={axisInputMode === "manual" ? draft.z : roundMm(selectedManualCarton.z)}
            onChange={(event) => (
              axisInputMode === "manual"
                ? handleDraftChange("z", event.target.value)
                : handleManualAxisInput("z", event.target.value)
            )}
            onKeyDown={handleManualKeyDown}
          />
        </label>
      </div>
      <div className="manual-toolbar-row">
        <span className="manual-toolbar-label">{manualAxisInputModeLabel}</span>
        <div className="manual-toolbar-actions manual-axis-mode-actions">
          <button
            type="button"
            className={`manual-mini-btn${axisInputMode === "auto" ? " is-active" : ""}`}
            onClick={() => handleAxisModeChange("auto")}
          >
            {manualAxisInputAutoLabel}
          </button>
          <button
            type="button"
            className={`manual-mini-btn${axisInputMode === "manual" ? " is-active" : ""}`}
            onClick={() => handleAxisModeChange("manual")}
          >
            {manualAxisInputManualLabel}
          </button>
          {axisInputMode === "manual" && (
            <button
              type="button"
              className="manual-mini-btn manual-mini-btn-primary"
              onClick={applyManualAxisDraft}
              disabled={!hasDraftChanges}
            >
              {manualAxisApplyLabel}
            </button>
          )}
        </div>
      </div>
      {manualHint && (
        <p className="manual-alert" title={manualHint}>
          {manualHint}
        </p>
      )}
    </>
  );
}
