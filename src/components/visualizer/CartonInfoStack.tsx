import React from "react";
import type { PackedCarton, PalletInput } from "../../lib/packer";
import { ManualSelectedCartonControls } from "./ManualSelectedCartonControls";

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
              <ManualSelectedCartonControls
                selectedManualCarton={selectedManualCarton}
                pallet={pallet}
                manualMoveStepMm={manualMoveStepMm}
                setManualMoveStepMm={setManualMoveStepMm}
                manualHint={manualHint}
                handleManualRotate={handleManualRotate}
                handleManualAxisInput={handleManualAxisInput}
                manualMoveStepLabel={manualMoveStepLabel}
                manualRotateLabel={manualRotateLabel}
                manualRotateHorizontalLabel={manualRotateHorizontalLabel}
                manualRotateVerticalXLabel={manualRotateVerticalXLabel}
                manualRotateVerticalYLabel={manualRotateVerticalYLabel}
                manualPalletAreaLabel={manualPalletAreaLabel}
              />
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
