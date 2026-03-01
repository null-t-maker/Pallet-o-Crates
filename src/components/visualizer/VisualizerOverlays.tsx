import React from "react";
import type { MultiPackResult, PackedCarton, PalletInput } from "../../lib/packer";
import type { Translations } from "../../i18n";
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
  handleManualRotate: (plane: "xy" | "xz" | "yz") => void;
  handleManualAxisInput: (axis: "x" | "y" | "z", rawValue: string) => void;
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
  handleManualRotate,
  handleManualAxisInput,
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
          handleManualRotate={handleManualRotate}
          handleManualAxisInput={handleManualAxisInput}
          manualMoveStepLabel={manualMoveStepLabel}
          manualRotateLabel={manualRotateLabel}
          manualRotateHorizontalLabel={manualRotateHorizontalLabel}
          manualRotateVerticalXLabel={manualRotateVerticalXLabel}
          manualRotateVerticalYLabel={manualRotateVerticalYLabel}
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
