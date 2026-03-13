import type { CartonInput, MultiPackResult, PackedCarton, PalletInput, PalletPackingStyle } from "./packerTypes";
import { LayoutSampleDocument, LayoutSamplePlacement, SampleSavePackingStyle, isPalletPackingStyle } from "./layoutSamples";
import { normalizeManualCartonsForSampleSave } from "./layoutSampleSaveNormalization";

interface BuildLayoutSamplePayloadArgs {
  descriptorInput: string;
  packingStyle: SampleSavePackingStyle;
  workflowMode: "generation" | "manual";
  pallet: PalletInput;
  cartons: CartonInput[];
  result: MultiPackResult | null;
  manualCartons: PackedCarton[];
}

const SAMPLE_LAYOUT_SCHEMA_VERSION = 1;

export function buildLayoutSamplePayload({
  descriptorInput,
  packingStyle,
  workflowMode,
  pallet,
  cartons,
  result,
  manualCartons,
}: BuildLayoutSamplePayloadArgs): LayoutSampleDocument {
  const descriptor = descriptorInput.trim().length > 0
    ? descriptorInput.trim()
    : `${workflowMode}-sample-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}`;
  const requestedUnitsFromInputs = cartons.reduce(
    (sum, carton) => sum + Math.max(0, Math.floor(carton.quantity)),
    0,
  );

  const serializedPalletStyle: PalletPackingStyle = packingStyle === "both"
    ? (isPalletPackingStyle(pallet.packingStyle) ? pallet.packingStyle : "edgeAligned")
    : packingStyle;

  if (workflowMode === "generation") {
    const placements: LayoutSamplePlacement[] = [];
    const palletPlacements = result && result.pallets.length > 0
      ? result.pallets.map((placed) => ({
        palletIndex: placed.index,
        offsetX: placed.offsetX,
        offsetY: placed.offsetY,
      }))
      : [{ palletIndex: 0, offsetX: 0, offsetY: 0 }];

    if (result) {
      for (const placed of result.pallets) {
        for (const layer of placed.result.layers) {
          for (const carton of layer.cartons) {
            placements.push({
              id: carton.id,
              typeId: carton.typeId,
              title: carton.title,
              x: carton.x,
              y: carton.y,
              z: carton.z,
              w: carton.w,
              l: carton.l,
              h: carton.h,
              weight: carton.weight,
              color: carton.color,
              palletIndex: placed.index,
              offsetX: placed.offsetX,
              offsetY: placed.offsetY,
            });
          }
        }
      }
    }

    const unpackedUnits = result
      ? result.unpacked.reduce((sum, carton) => sum + Math.max(0, Math.floor(carton.quantity)), 0)
      : Math.max(0, requestedUnitsFromInputs - placements.length);
    const packedUnits = result ? result.packedUnits : placements.length;

    return {
      schemaVersion: SAMPLE_LAYOUT_SCHEMA_VERSION,
      app: "Pallet-o-Crates",
      appVersion: "0.1.0",
      descriptor,
      createdAt: new Date().toISOString(),
      workflowMode,
      packingStyle,
      pallet: { ...pallet, packingStyle: serializedPalletStyle },
      cartonTypes: cartons.map((carton) => ({ ...carton })),
      palletPlacements,
      placements,
      stats: {
        requestedUnits: result?.requestedUnits ?? requestedUnitsFromInputs,
        packedUnits,
        unpackedUnits,
        palletsUsed: result?.pallets.length ?? 1,
      },
    };
  }

  const normalizedManualCartons = normalizeManualCartonsForSampleSave(manualCartons);

  const placements: LayoutSamplePlacement[] = normalizedManualCartons.map((carton) => ({
    id: carton.id,
    typeId: carton.typeId,
    title: carton.title,
    x: carton.x,
    y: carton.y,
    z: carton.z,
    w: carton.w,
    l: carton.l,
    h: carton.h,
    weight: carton.weight,
    color: carton.color,
    palletIndex: 0,
    offsetX: 0,
    offsetY: 0,
  }));
  const packedUnits = placements.length;

  return {
    schemaVersion: SAMPLE_LAYOUT_SCHEMA_VERSION,
    app: "Pallet-o-Crates",
    appVersion: "0.1.0",
    descriptor,
    createdAt: new Date().toISOString(),
    workflowMode,
    packingStyle,
    pallet: { ...pallet, packingStyle: serializedPalletStyle },
    cartonTypes: cartons.map((carton) => ({ ...carton })),
    palletPlacements: [{ palletIndex: 0, offsetX: 0, offsetY: 0 }],
    placements,
    stats: {
      requestedUnits: requestedUnitsFromInputs,
      packedUnits,
      unpackedUnits: Math.max(0, requestedUnitsFromInputs - packedUnits),
      palletsUsed: 1,
    },
  };
}
