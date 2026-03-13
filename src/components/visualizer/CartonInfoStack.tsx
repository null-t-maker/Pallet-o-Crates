import React from "react";
import type { PackedCarton, PalletInput } from "../../lib/packer";
import type { ManualPatch } from "./manualCartonEditingCore";
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
                manualShadowModeEnabled={manualShadowModeEnabled}
                handleManualRotate={handleManualRotate}
                handleManualShadowModeChange={handleManualShadowModeChange}
                handleManualAlignToSupportEdgeX={handleManualAlignToSupportEdgeX}
                handleManualAlignToSupportEdgeY={handleManualAlignToSupportEdgeY}
                handleManualAxisInput={handleManualAxisInput}
                handleManualAxisPatchInput={handleManualAxisPatchInput}
                manualMoveStepLabel={manualMoveStepLabel}
                manualRotateLabel={manualRotateLabel}
                manualRotateHorizontalLabel={manualRotateHorizontalLabel}
                manualRotateVerticalXLabel={manualRotateVerticalXLabel}
                manualRotateVerticalYLabel={manualRotateVerticalYLabel}
                manualShadowModeLabel={manualShadowModeLabel}
                manualShadowModeOnLabel={manualShadowModeOnLabel}
                manualShadowModeOffLabel={manualShadowModeOffLabel}
                manualAlignSectionLabel={manualAlignSectionLabel}
                manualAlignXButtonLabel={manualAlignXButtonLabel}
                manualAlignYButtonLabel={manualAlignYButtonLabel}
                manualAxisInputModeLabel={manualAxisInputModeLabel}
                manualAxisInputAutoLabel={manualAxisInputAutoLabel}
                manualAxisInputManualLabel={manualAxisInputManualLabel}
                manualAxisApplyLabel={manualAxisApplyLabel}
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
