import { describe, expect, it } from "vitest";
import { CartonInput, PalletInput, packPallet } from "../packer";

function carton(overrides: Partial<CartonInput> & Pick<CartonInput, "id" | "title">): CartonInput {
  return {
    id: overrides.id,
    title: overrides.title,
    width: overrides.width ?? 300,
    length: overrides.length ?? 200,
    height: overrides.height ?? 150,
    weight: overrides.weight ?? 2,
    quantity: overrides.quantity ?? 1,
    color: overrides.color ?? "#73c98f",
    uprightPolicy: overrides.uprightPolicy ?? "tailOnly",
  };
}

function units(cartons: CartonInput[]): number {
  return cartons.reduce((sum, entry) => sum + Math.max(0, Math.trunc(entry.quantity)), 0);
}

describe("packer single-pallet workflow", () => {
  it("keeps oversized cartons unpacked with zero layers", () => {
    const pallet: PalletInput = {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 1000,
      packingStyle: "edgeAligned",
      extraPalletMode: "none",
    };
    const cartons: CartonInput[] = [
      carton({
        id: "X",
        title: "Too wide",
        width: 2000,
        length: 300,
        height: 150,
        weight: 5,
        quantity: 3,
      }),
    ];

    const result = packPallet(pallet, cartons);
    expect(result.layers).toHaveLength(0);
    expect(result.totalWeight).toBe(0);
    expect(result.totalHeight).toBe(0);
    expect(units(result.unpacked)).toBe(3);
  });

  it(
    "centerCompact is never worse than edgeAligned for same input",
    () => {
      const cartons: CartonInput[] = [
        carton({
          id: "A",
          title: "A",
          width: 300,
          length: 200,
          height: 150,
          weight: 2,
          quantity: 90,
        }),
        carton({
          id: "B",
          title: "B",
          width: 250,
          length: 200,
          height: 120,
          weight: 1.8,
          quantity: 60,
        }),
      ];

      const basePallet: Omit<PalletInput, "packingStyle"> = {
        width: 800,
        length: 1200,
        maxHeight: 1800,
        maxWeight: 900,
        extraPalletMode: "none",
      };

      const edge = packPallet({ ...basePallet, packingStyle: "edgeAligned" }, cartons);
      const center = packPallet({ ...basePallet, packingStyle: "centerCompact" }, cartons);

      const edgeUnpacked = units(edge.unpacked);
      const centerUnpacked = units(center.unpacked);
      expect(centerUnpacked).toBeLessThanOrEqual(edgeUnpacked);
      if (centerUnpacked === edgeUnpacked) {
        expect(center.layers.length).toBeLessThanOrEqual(edge.layers.length);
      }
    },
    15_000,
  );

  it("respects single-layer height cap", () => {
    const pallet: PalletInput = {
      width: 800,
      length: 1200,
      maxHeight: 150,
      maxWeight: 1000,
      packingStyle: "edgeAligned",
      extraPalletMode: "none",
    };
    const cartons: CartonInput[] = [
      carton({
        id: "S",
        title: "Single-layer",
        width: 300,
        length: 200,
        height: 150,
        weight: 2,
        quantity: 40,
      }),
    ];

    const result = packPallet(pallet, cartons);
    expect(result.layers.length).toBeLessThanOrEqual(1);
    expect(result.totalHeight).toBeLessThanOrEqual(150);
    const allCartons = result.layers.flatMap((layer) => layer.cartons);
    expect(allCartons.length).toBeGreaterThan(0);
    for (const placed of allCartons) {
      expect(placed.z).toBe(0);
    }
  });

  it("prefers an interlock-ready base layer for multi-layer single-type stacks", () => {
    const pallet: PalletInput = {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 1000,
      packingStyle: "edgeAligned",
      extraPalletMode: "none",
    };
    const cartons: CartonInput[] = [
      carton({
        id: "A",
        title: "Carton A",
        width: 300,
        length: 200,
        height: 150,
        weight: 2,
        quantity: 48,
      }),
    ];

    const result = packPallet(pallet, cartons);
    expect(result.layers).toHaveLength(3);

    const baseLayerVariants = new Set(
      result.layers[0]?.cartons.map((placed) => `${placed.w}x${placed.l}`) ?? [],
    );
    expect(baseLayerVariants.size).toBeGreaterThan(1);
  });

  it("prefers an interlock-ready base layer for centerCompact multi-layer single-type stacks", () => {
    const pallet: PalletInput = {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 1000,
      packingStyle: "centerCompact",
      extraPalletMode: "none",
    };
    const cartons: CartonInput[] = [
      carton({
        id: "A",
        title: "Carton A",
        width: 300,
        length: 200,
        height: 150,
        weight: 2,
        quantity: 48,
      }),
    ];

    const result = packPallet(pallet, cartons);
    expect(result.layers).toHaveLength(3);

    const baseLayerVariants = new Set(
      result.layers[0]?.cartons.map((placed) => `${placed.w}x${placed.l}`) ?? [],
    );
    expect(baseLayerVariants.size).toBeGreaterThan(1);
  });

  it("uses lower same-type supports before jumping to higher mixed supports", () => {
    const pallet: PalletInput = {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 1000,
      packingStyle: "edgeAligned",
      extraPalletMode: "none",
    };
    const cartons: CartonInput[] = [
      carton({
        id: "A",
        title: "A",
        width: 300,
        length: 200,
        height: 150,
        weight: 4,
        quantity: 32,
      }),
      carton({
        id: "B",
        title: "B",
        width: 500,
        length: 150,
        height: 250,
        weight: 3,
        quantity: 16,
      }),
      carton({
        id: "C",
        title: "C",
        width: 250,
        length: 400,
        height: 100,
        weight: 1,
        quantity: 32,
      }),
    ];

    const result = packPallet(pallet, cartons);
    const cAt650 = result.layers
      .flatMap((layer) => layer.cartons)
      .filter((placed) => placed.typeId === "C" && Math.abs(placed.z - 650) <= 1e-6);

    expect(cAt650.length).toBeGreaterThan(0);
    expect(result.totalHeight).toBeLessThan(1400);
  });

  it(
    "does not leave large late-stage cartons behind when legal shelf space exists",
    () => {
      const pallet: PalletInput = {
        width: 800,
        length: 1200,
        maxHeight: 1800,
        maxWeight: 1000,
        packingStyle: "edgeAligned",
        extraPalletMode: "none",
      };
      const cartons: CartonInput[] = [
        carton({
          id: "A",
          title: "A",
          width: 300,
          length: 200,
          height: 150,
          weight: 4,
          quantity: 32,
        }),
        carton({
          id: "B",
          title: "B",
          width: 500,
          length: 150,
          height: 250,
          weight: 3,
          quantity: 10,
        }),
        carton({
          id: "C",
          title: "C",
          width: 250,
          length: 400,
          height: 100,
          weight: 1,
          quantity: 32,
        }),
        carton({
          id: "D",
          title: "D",
          width: 400,
          length: 350,
          height: 400,
          weight: 2,
          quantity: 8,
        }),
      ];

      const result = packPallet(pallet, cartons);
      const packedD = result.layers
        .flatMap((layer) => layer.cartons)
        .filter((placed) => placed.typeId === "D").length;
      const unpackedD = result.unpacked.find((entry) => entry.id === "D")?.quantity ?? 0;

      expect(packedD).toBeGreaterThanOrEqual(6);
      expect(unpackedD).toBeLessThanOrEqual(2);
      expect(result.totalHeight).toBeLessThanOrEqual(1800);
    },
    15_000,
  );
});
