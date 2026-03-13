import { describe, expect, it } from "vitest";
import type { CartonInput, PackedCarton, PalletInput } from "../packer";
import { generateManualCartons, generateMoreManualCartons } from "../manualLayout";

const pallet: PalletInput = {
  width: 1000,
  length: 1200,
  maxHeight: 1800,
  maxWeight: 1000,
  packingStyle: "edgeAligned",
  extraPalletMode: "none",
};

const legacyManualStagingRightEdge = pallet.width + 120 + 1200;

function cartonInput(
  overrides: Partial<CartonInput> & Pick<CartonInput, "id" | "title">,
): CartonInput {
  return {
    id: overrides.id,
    title: overrides.title,
    width: overrides.width ?? 155,
    length: overrides.length ?? 425,
    height: overrides.height ?? 135,
    weight: overrides.weight ?? 12,
    quantity: overrides.quantity ?? 1,
    color: overrides.color ?? "#8ee0a8",
  };
}

function packedCarton(
  overrides: Partial<PackedCarton> & Pick<PackedCarton, "id" | "typeId" | "title">,
): PackedCarton {
  return {
    id: overrides.id,
    typeId: overrides.typeId,
    title: overrides.title,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    z: overrides.z ?? 0,
    w: overrides.w ?? 155,
    l: overrides.l ?? 425,
    h: overrides.h ?? 135,
    weight: overrides.weight ?? 12,
    color: overrides.color ?? "#8ee0a8",
  };
}

describe("manualLayout staging", () => {
  it("spreads large manual batches wider before wrapping into depth", () => {
    const cartons: CartonInput[] = [
      cartonInput({ id: "A", title: "Carton A", quantity: 55 }),
      cartonInput({ id: "B", title: "Carton B", width: 200, length: 300, quantity: 10, color: "#225ce0" }),
      cartonInput({ id: "C", title: "Carton C", width: 200, length: 300, quantity: 10, color: "#f09b47" }),
    ];

    const generated = generateManualCartons(pallet, cartons);
    const firstRowCount = generated.filter((carton) => carton.y === 0).length;

    expect(firstRowCount).toBeGreaterThan(6);
    expect(generated.some((carton) => carton.x + carton.w > legacyManualStagingRightEdge)).toBe(true);
  });

  it("reuses the same wider staging width when generating missing manual cartons", () => {
    const cartons: CartonInput[] = [
      cartonInput({ id: "A", title: "Carton A", quantity: 55 }),
      cartonInput({ id: "B", title: "Carton B", width: 200, length: 300, quantity: 10, color: "#225ce0" }),
      cartonInput({ id: "C", title: "Carton C", width: 200, length: 300, quantity: 10, color: "#f09b47" }),
    ];
    const existing: PackedCarton[] = [
      packedCarton({
        id: "manual-A-1",
        typeId: "A",
        title: "Carton A",
        x: pallet.width + 120,
        y: 0,
      }),
    ];

    const next = generateMoreManualCartons(pallet, cartons, existing);
    const additions = next.slice(existing.length);

    expect(additions.length).toBe(74);
    expect(additions[0]?.y).toBe(existing[0].l + 30);
    expect(additions.some((carton) => carton.x + carton.w > legacyManualStagingRightEdge)).toBe(true);
  });
});
