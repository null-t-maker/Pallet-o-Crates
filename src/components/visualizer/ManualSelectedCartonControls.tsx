import React from "react";
import type { PackedCarton, PalletInput } from "../../lib/packer";
import { roundMm } from "./visualizerHelpers";

interface ManualSelectedCartonControlsProps {
  selectedManualCarton: PackedCarton;
  pallet: PalletInput;
  manualMoveStepMm: number;
  setManualMoveStepMm: React.Dispatch<React.SetStateAction<number>>;
  manualHint: string | null;
  handleManualRotate: (plane: "xy" | "xz" | "yz") => void;
  handleManualAxisInput: (axis: "x" | "y" | "z", rawValue: string) => void;
  manualMoveStepLabel: string;
  manualRotateLabel: string;
  manualRotateHorizontalLabel: string;
  manualRotateVerticalXLabel: string;
  manualRotateVerticalYLabel: string;
  manualPalletAreaLabel: (width: number, length: number) => string;
}

export function ManualSelectedCartonControls({
  selectedManualCarton,
  pallet,
  manualMoveStepMm,
  setManualMoveStepMm,
  manualHint,
  handleManualRotate,
  handleManualAxisInput,
  manualMoveStepLabel,
  manualRotateLabel,
  manualRotateHorizontalLabel,
  manualRotateVerticalXLabel,
  manualRotateVerticalYLabel,
  manualPalletAreaLabel,
}: ManualSelectedCartonControlsProps) {
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
            value={roundMm(selectedManualCarton.x)}
            onChange={(event) => handleManualAxisInput("x", event.target.value)}
          />
        </label>
        <label className="manual-coord-field" title="Y (mm)">
          <span>Y</span>
          <input
            type="number"
            step={1}
            value={roundMm(selectedManualCarton.y)}
            onChange={(event) => handleManualAxisInput("y", event.target.value)}
          />
        </label>
        <label className="manual-coord-field" title="Z (mm)">
          <span>Z</span>
          <input
            type="number"
            step={1}
            value={roundMm(selectedManualCarton.z)}
            onChange={(event) => handleManualAxisInput("z", event.target.value)}
          />
        </label>
      </div>
      {manualHint && (
        <p className="manual-alert" title={manualHint}>
          {manualHint}
        </p>
      )}
    </>
  );
}
