import { describe, expect, it } from "vitest";
import type { CartonInput, PackedCarton, PalletInput } from "../packer";
import { buildManualGenerationSeedResult } from "../manualGenerationSeed";

const pallet: PalletInput = {
  width: 800,
  length: 1200,
  maxHeight: 1800,
  maxWeight: 1000,
  packingStyle: "edgeAligned",
  extraPalletMode: "none",
};

function cartonInput(
  overrides: Partial<CartonInput> & Pick<CartonInput, "id" | "title">,
): CartonInput {
  return {
    id: overrides.id,
    title: overrides.title,
    width: overrides.width ?? 300,
    length: overrides.length ?? 200,
    height: overrides.height ?? 150,
    weight: overrides.weight ?? 2,
    quantity: overrides.quantity ?? 1,
    color: overrides.color ?? "#43b66f",
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
    w: overrides.w ?? 300,
    l: overrides.l ?? 200,
    h: overrides.h ?? 150,
    weight: overrides.weight ?? 2,
    color: overrides.color ?? "#43b66f",
  };
}

describe("buildManualGenerationSeedResult", () => {
  it("keeps only on-pallet supported cartons and leaves the rest as missing demand", () => {
    const cartons: CartonInput[] = [cartonInput({
      id: "A",
      title: "Carton A",
      quantity: 5,
    })];
    const manualCartons: PackedCarton[] = [
      packedCarton({ id: "base-left", typeId: "A", title: "A", x: 0, y: 0, z: 0 }),
      packedCarton({ id: "base-right", typeId: "A", title: "A", x: 300.0004, y: 0, z: 0.04 }),
      packedCarton({ id: "top-valid", typeId: "A", title: "A", x: 0, y: 0, z: 150.04 }),
      packedCarton({ id: "staging", typeId: "A", title: "A", x: 920, y: 0, z: 0 }),
      packedCarton({ id: "floating", typeId: "A", title: "A", x: 300, y: 0, z: 151.04 }),
      packedCarton({ id: "overlap", typeId: "A", title: "A", x: 0, y: 0, z: 0 }),
    ];

    const seeded = buildManualGenerationSeedResult({
      pallet,
      cartons,
      manualCartons,
    });

    expect(seeded.lockedCartons.map((carton) => carton.id)).toEqual([
      "base-left",
      "base-right",
      "top-valid",
    ]);
    expect(seeded.ignoredCartons.map((carton) => carton.id)).toEqual([
      "overlap",
      "staging",
      "floating",
    ]);
    expect(seeded.seedResult).not.toBeNull();
    expect(seeded.seedResult?.packedUnits).toBe(3);
    expect(seeded.seedResult?.requestedUnits).toBe(5);
    expect(seeded.seedResult?.unpacked[0]?.quantity).toBe(2);
    expect(seeded.seedResult?.pallets[0]?.result.layers).toHaveLength(2);
    expect(seeded.seedResult?.pallets[0]?.result.layers[1]?.cartons[0]?.z).toBe(150);
  });

  it("normalizes micro noise before checking support and bounds", () => {
    const cartons: CartonInput[] = [cartonInput({
      id: "A",
      title: "Carton A",
      quantity: 2,
    })];
    const manualCartons: PackedCarton[] = [
      packedCarton({ id: "base", typeId: "A", title: "A", x: -0.04, y: 0.03, z: 0.04 }),
      packedCarton({ id: "top", typeId: "A", title: "A", x: 0.02, y: -0.01, z: 150.04 }),
    ];

    const seeded = buildManualGenerationSeedResult({
      pallet,
      cartons,
      manualCartons,
    });

    expect(seeded.lockedCartons).toHaveLength(2);
    expect(Math.abs(seeded.lockedCartons[0]?.x ?? Number.NaN)).toBe(0);
    expect(Math.abs(seeded.lockedCartons[0]?.z ?? Number.NaN)).toBe(0);
    expect(seeded.lockedCartons[1]?.z).toBe(150);
    expect(seeded.seedResult?.packedUnits).toBe(2);
    expect(seeded.seedResult?.unpacked).toHaveLength(0);
  });

  it("syncs locked seed cartons to the current carton type metadata", () => {
    const cartons: CartonInput[] = [cartonInput({
      id: "A",
      title: "Carton A renamed",
      color: "#ff7755",
      weight: 7,
      quantity: 1,
    })];
    const manualCartons: PackedCarton[] = [
      packedCarton({
        id: "base",
        typeId: "A",
        title: "Old title",
        color: "#43b66f",
        weight: 2,
      }),
    ];

    const seeded = buildManualGenerationSeedResult({
      pallet,
      cartons,
      manualCartons,
    });

    expect(seeded.lockedCartons).toHaveLength(1);
    expect(seeded.lockedCartons[0]).toMatchObject({
      id: "base",
      title: "Carton A renamed",
      color: "#ff7755",
      weight: 7,
    });
  });

  it("accepts bridged support that matches generation support rules", () => {
    const cartons: CartonInput[] = [
      cartonInput({
        id: "LEFT",
        title: "Left support",
        width: 180,
        length: 200,
        weight: 5,
      }),
      cartonInput({
        id: "RIGHT",
        title: "Right support",
        width: 80,
        length: 200,
        weight: 5,
      }),
      cartonInput({
        id: "TOP",
        title: "Top carton",
        width: 300,
        length: 200,
        weight: 2,
      }),
    ];
    const manualCartons: PackedCarton[] = [
      packedCarton({
        id: "base-left",
        typeId: "LEFT",
        title: "Left support",
        x: 0,
        y: 0,
        z: 0,
        w: 180,
        weight: 5,
      }),
      packedCarton({
        id: "base-right",
        typeId: "RIGHT",
        title: "Right support",
        x: 180,
        y: 0,
        z: 0,
        w: 80,
        weight: 5,
      }),
      packedCarton({
        id: "bridge-top",
        typeId: "TOP",
        title: "Top carton",
        x: 0,
        y: 0,
        z: 150,
        w: 300,
        weight: 2,
      }),
    ];

    const seeded = buildManualGenerationSeedResult({
      pallet,
      cartons,
      manualCartons,
    });

    expect(seeded.lockedCartons.map((carton) => carton.id)).toEqual([
      "base-left",
      "base-right",
      "bridge-top",
    ]);
    expect(seeded.ignoredCartons).toHaveLength(0);
    expect(seeded.seedResult?.packedUnits).toBe(3);
    expect(seeded.seedResult?.requestedUnits).toBe(3);
    expect(seeded.seedResult?.unpacked).toHaveLength(0);
  });

  it("ignores manual placements whose geometry no longer matches the current carton type", () => {
    const cartons: CartonInput[] = [cartonInput({
      id: "A",
      title: "Carton A",
      width: 310,
      quantity: 1,
    })];
    const manualCartons: PackedCarton[] = [
      packedCarton({
        id: "stale-geometry",
        typeId: "A",
        title: "Carton A",
        w: 300,
      }),
    ];

    const seeded = buildManualGenerationSeedResult({
      pallet,
      cartons,
      manualCartons,
    });

    expect(seeded.seedResult).toBeNull();
    expect(seeded.lockedCartons).toHaveLength(0);
    expect(seeded.ignoredCartons.map((carton) => carton.id)).toEqual(["stale-geometry"]);
  });

  it("ignores placements beyond the requested quantity for a carton type", () => {
    const cartons: CartonInput[] = [cartonInput({
      id: "A",
      title: "Carton A",
      quantity: 2,
    })];
    const manualCartons: PackedCarton[] = [
      packedCarton({ id: "base-1", typeId: "A", title: "A", x: 0, y: 0, z: 0 }),
      packedCarton({ id: "base-2", typeId: "A", title: "A", x: 300, y: 0, z: 0 }),
      packedCarton({ id: "base-3", typeId: "A", title: "A", x: 0, y: 200, z: 0 }),
    ];

    const seeded = buildManualGenerationSeedResult({
      pallet,
      cartons,
      manualCartons,
    });

    expect(seeded.lockedCartons.map((carton) => carton.id)).toEqual([
      "base-1",
      "base-2",
    ]);
    expect(seeded.ignoredCartons.map((carton) => carton.id)).toEqual(["base-3"]);
    expect(seeded.seedResult?.packedUnits).toBe(2);
    expect(seeded.seedResult?.unpacked).toHaveLength(0);
  });
});
