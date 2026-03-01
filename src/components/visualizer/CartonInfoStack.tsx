import React from "react";
import type { PackedCarton, PalletInput } from "../../lib/packer";
import { roundMm } from "./visualizerHelpers";

interface CartonInfoStackProps {
  mode: "generation" | "manual";
  hovered: PackedCarton | null;
  selectedCarton: PackedCarton | null;
  selectedManualCarton: PackedCarton | null;
  onClearSelected: () => void;
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
  manualClearSelectedCartonAriaLabel: string;
}

export function CartonInfoStack({
  mode,
  hovered,
  selectedCarton,
  selectedManualCarton,
  onClearSelected,
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
  manualClearSelectedCartonAriaLabel,
}: CartonInfoStackProps) {
  return (
    <>
      {hovered && (
        <div className="glass hover-card in-stack">
          <strong className="truncate-text" style={{ display: "block", marginBottom: 2 }} title={hovered.title}>{hovered.title}</strong>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {hovered.w}x{hovered.l}x{hovered.h} mm
            <span className="meta-separator">|</span>
            {hovered.weight} kg
          </span>
        </div>
      )}
      {selectedCarton && (
        <div className="glass selected-card in-stack">
          <div className="selected-card-head">
            <strong className="truncate-text" title={selectedCarton.title}>{selectedCarton.title}</strong>
            <button
              type="button"
              className="selected-card-close"
              aria-label={manualClearSelectedCartonAriaLabel}
              onClick={onClearSelected}
            >
              x
            </button>
          </div>
          <p style={{ margin: "5px 0 2px", fontSize: "0.83rem", color: "var(--text-muted)" }}>
            {selectedCarton.w}x{selectedCarton.l}x{selectedCarton.h} mm
            <span className="meta-separator">|</span>
            {selectedCarton.weight} kg
          </p>
          {mode === "manual" && selectedManualCarton ? (
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
          ) : (
            <p style={{ margin: "0", fontSize: "0.77rem", color: "var(--text-muted)" }}>
              x:{selectedCarton.x.toFixed(0)} y:{selectedCarton.y.toFixed(0)} z:{selectedCarton.z.toFixed(0)} mm
            </p>
          )}
        </div>
      )}
    </>
  );
}
