import { describe, expect, it } from "vitest";
import { buildLayoutSamplePayload } from "../layoutSamplePayload";
import { normalizeManualCartonsForSampleSave } from "../layoutSampleSaveNormalization";
import { hasAnyManualCartonOverlap } from "../manualCartonOverlap";
import type { CartonInput, PackedCarton, PalletInput } from "../packerTypes";

const pallet: PalletInput = {
  width: 1200,
  length: 800,
  maxHeight: 1800,
  maxWeight: 1000,
  packingStyle: "edgeAligned",
  extraPalletMode: "none",
};

const cartons: CartonInput[] = [{
  id: "type-a",
  title: "Carton A",
  width: 300,
  length: 200,
  height: 150,
  weight: 5,
  quantity: 2,
  color: "#43b66f",
}];

describe("normalizeManualCartonsForSampleSave", () => {
  it("rounds manual sample positions to visualizer save precision", () => {
    const manualCartons: PackedCarton[] = [{
      id: "a-1",
      typeId: "type-a",
      title: "Carton A",
      x: 490.0009619481563,
      y: 464.9971489414874,
      z: 134.99900079490203,
      w: 300,
      l: 200,
      h: 150,
      weight: 5,
      color: "#43b66f",
    }];

    expect(normalizeManualCartonsForSampleSave(manualCartons)).toEqual([{
      ...manualCartons[0],
      x: 490,
      y: 465,
      z: 135,
    }]);
  });

  it("keeps meaningful manual offsets while still trimming float tails", () => {
    const manualCartons: PackedCarton[] = [{
      id: "a-1",
      typeId: "type-a",
      title: "Carton A",
      x: 155.62426134970408,
      y: 310.08002703274093,
      z: 271.2382812228502,
      w: 300,
      l: 200,
      h: 150,
      weight: 5,
      color: "#43b66f",
    }];

    expect(normalizeManualCartonsForSampleSave(manualCartons)).toEqual([{
      ...manualCartons[0],
      x: 155.6,
      y: 310.1,
      z: 271.2,
    }]);
  });

  it("removes micro-overlap noise before sample-save validation", () => {
    const manualCartons: PackedCarton[] = [
      {
        id: "a-1",
        typeId: "type-a",
        title: "Carton A",
        x: 0,
        y: 0,
        z: 0,
        w: 300,
        l: 200,
        h: 150,
        weight: 5,
        color: "#43b66f",
      },
      {
        id: "a-2",
        typeId: "type-a",
        title: "Carton A",
        x: 299.9989,
        y: 0,
        z: 0,
        w: 300,
        l: 200,
        h: 150,
        weight: 5,
        color: "#43b66f",
      },
    ];

    expect(hasAnyManualCartonOverlap(manualCartons)).toBe(true);
    expect(hasAnyManualCartonOverlap(normalizeManualCartonsForSampleSave(manualCartons))).toBe(false);
  });

  it("uses normalized manual positions in saved layout payloads", () => {
    const manualCartons: PackedCarton[] = [{
      id: "a-1",
      typeId: "type-a",
      title: "Carton A",
      x: 0.00042,
      y: 298.900432,
      z: 149.9502,
      w: 300,
      l: 200,
      h: 150,
      weight: 5,
      color: "#43b66f",
    }];

    const payload = buildLayoutSamplePayload({
      descriptorInput: "manual-save-normalization",
      packingStyle: "both",
      workflowMode: "manual",
      pallet,
      cartons,
      result: null,
      manualCartons,
    });

    expect(payload.placements).toHaveLength(1);
    expect(payload.placements[0]).toMatchObject({
      x: 0,
      y: 298.9,
      z: 150,
    });
  });
});
