import { describe, expect, it } from "vitest";
import { CartonInput, PalletInput, packPallets } from "../packer";

function carton(overrides: Partial<CartonInput> & Pick<CartonInput, "id" | "title">): CartonInput {
  return {
    id: overrides.id,
    title: overrides.title,
    width: overrides.width ?? 200,
    length: overrides.length ?? 200,
    height: overrides.height ?? 200,
    weight: overrides.weight ?? 10,
    quantity: overrides.quantity ?? 1,
    color: overrides.color ?? "#78c88d",
    uprightPolicy: overrides.uprightPolicy ?? "tailOnly",
  };
}

function units(cartons: CartonInput[]): number {
  return cartons.reduce((sum, entry) => sum + Math.max(0, Math.trunc(entry.quantity)), 0);
}

describe("packer multi-pallet workflow", () => {
  it("uses deterministic cross offsets for supplementary pallets in full mode", () => {
    const pallet: PalletInput = {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 10,
      packingStyle: "edgeAligned",
      extraPalletMode: "full",
    };
    const cartons: CartonInput[] = [carton({ id: "A", title: "A", quantity: 6 })];

    const result = packPallets(pallet, cartons);
    const stepX = pallet.width + 250;
    const stepY = pallet.length + 250;
    const expectedOffsets: Array<[number, number]> = [
      [0, 0],
      [stepX, 0],
      [-stepX, 0],
      [0, stepY],
      [0, -stepY],
      [2 * stepX, 0],
    ];

    expect(result.pallets).toHaveLength(6);
    expect(result.packedUnits).toBe(6);
    expect(units(result.unpacked)).toBe(0);
    for (let i = 0; i < expectedOffsets.length; i++) {
      expect(result.pallets[i].offsetX).toBe(expectedOffsets[i][0]);
      expect(result.pallets[i].offsetY).toBe(expectedOffsets[i][1]);
    }
  });

  it("lets limitsOnly continue like full when first pallet reaches hard limit", () => {
    const cartons: CartonInput[] = [carton({ id: "B", title: "B", quantity: 5 })];
    const basePallet: Omit<PalletInput, "extraPalletMode"> = {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 10,
      packingStyle: "edgeAligned",
    };

    const none = packPallets({ ...basePallet, extraPalletMode: "none" }, cartons);
    const limitsOnly = packPallets({ ...basePallet, extraPalletMode: "limitsOnly" }, cartons);
    const full = packPallets({ ...basePallet, extraPalletMode: "full" }, cartons);

    expect(none.pallets).toHaveLength(1);
    expect(none.packedUnits).toBe(1);

    expect(limitsOnly.pallets).toHaveLength(5);
    expect(limitsOnly.packedUnits).toBe(5);

    expect(full.pallets).toHaveLength(5);
    expect(full.packedUnits).toBe(5);
    expect(units(full.unpacked)).toBe(0);
  });

  it("keeps first pallet entry even when carton set is impossible to place", () => {
    const pallet: PalletInput = {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 1000,
      packingStyle: "edgeAligned",
      extraPalletMode: "full",
    };
    const cartons: CartonInput[] = [
      carton({
        id: "X",
        title: "Too large",
        width: 2000,
        length: 400,
        height: 200,
        weight: 5,
        quantity: 3,
      }),
    ];

    const result = packPallets(pallet, cartons);

    expect(result.pallets).toHaveLength(1);
    expect(result.pallets[0].result.layers).toHaveLength(0);
    expect(result.packedUnits).toBe(0);
    expect(result.requestedUnits).toBe(3);
    expect(units(result.unpacked)).toBe(3);
  });
});
