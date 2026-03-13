import { describe, expect, it } from "vitest";
import type { PackedCarton, PalletInput } from "../../lib/packer";
import { clampPatchInsidePalletIfPartiallyOverlapping } from "./manualCartonTransformEnd";

const PALLET: PalletInput = {
  width: 800,
  length: 1200,
  maxHeight: 1800,
  maxWeight: 1000,
  packingStyle: "edgeAligned",
  extraPalletMode: "none",
};

const SOURCE: PackedCarton = {
  id: "manual-1",
  typeId: "c1",
  title: "Carton 1",
  x: 100,
  y: 100,
  z: 0,
  w: 300,
  l: 200,
  h: 150,
  weight: 4,
  color: "#43b66f",
};

describe("clampPatchInsidePalletIfPartiallyOverlapping", () => {
  it("pulls a partially overhanging carton back inside the pallet", () => {
    const patch = clampPatchInsidePalletIfPartiallyOverlapping(
      { x: 560, y: 100, z: 0 },
      SOURCE,
      PALLET,
    );

    expect(patch.x).toBe(500);
    expect(patch.y).toBe(100);
  });

  it("keeps a fully removed carton outside the pallet unchanged", () => {
    const patch = clampPatchInsidePalletIfPartiallyOverlapping(
      { x: 850, y: 100, z: 0 },
      SOURCE,
      PALLET,
    );

    expect(patch.x).toBe(850);
    expect(patch.y).toBe(100);
  });

  it("clamps both axes when the carton still overlaps a pallet corner", () => {
    const patch = clampPatchInsidePalletIfPartiallyOverlapping(
      { x: 650, y: 1080, z: 0 },
      SOURCE,
      PALLET,
    );

    expect(patch.x).toBe(500);
    expect(patch.y).toBe(1000);
  });
});
