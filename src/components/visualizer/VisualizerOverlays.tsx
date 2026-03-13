import React from "react";
import type { MultiPackResult, PackedCarton, PalletInput } from "../../lib/packer";
import type { Translations } from "../../i18n";
import type { ManualPatch } from "./manualCartonEditingCore";
import { CartonInfoStack } from "./CartonInfoStack";
import { PackingStatsCard } from "./PackingStatsCard";

interface VisualizerOverlaysProps {
  t: Translations;
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
  result: MultiPackResult | null;
  layerCount: number;
  palletsUsed: number;
  unpackedCount: number;
  limitsExceeded: boolean;
  unpackedMessage: string;
  manualTotalWeight: number;
  manualMaxHeight: number;
  manualCartonsCount: number;
  palletCountLabel: string;
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
  manualPlacedCartonsLabel: string;
}

export function VisualizerOverlays({
  t,
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
  result,
  layerCount,
  palletsUsed,
  unpackedCount,
  limitsExceeded,
  unpackedMessage,
  manualTotalWeight,
  manualMaxHeight,
  manualCartonsCount,
  palletCountLabel,
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
  manualPlacedCartonsLabel,
}: VisualizerOverlaysProps) {
  return (
    <>
      <div className="glass overlay info-banner">
        <strong>{t.infoBannerTitle}</strong>
        <p>{t.infoBannerLine1}</p>
        <p>{t.infoBannerLine2}</p>
        <p>{t.infoBannerLine3}</p>
      </div>

      <div className="overlay bottom-left-stack">
        <CartonInfoStack
          mode={mode}
          hovered={hovered}
          selectedCarton={selectedCarton}
          selectedManualCarton={selectedManualCarton}
          onClearSelected={onClearSelected}
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
          manualClearSelectedCartonAriaLabel={manualClearSelectedCartonAriaLabel}
        />

        <PackingStatsCard
          t={t}
          mode={mode}
          result={result}
          pallet={pallet}
          layerCount={layerCount}
          palletsUsed={palletsUsed}
          unpackedCount={unpackedCount}
          limitsExceeded={limitsExceeded}
          unpackedMessage={unpackedMessage}
          manualTotalWeight={manualTotalWeight}
          manualMaxHeight={manualMaxHeight}
          manualCartonsCount={manualCartonsCount}
          palletCountLabel={palletCountLabel}
          manualPlacedCartonsLabel={manualPlacedCartonsLabel}
        />
      </div>
    </>
  );
}
