import { describe, expect, it } from "vitest";
import { CartonInput, PalletInput, packPallets } from "../packer";

function carton(overrides: Partial<CartonInput> & Pick<CartonInput, "id" | "title">): CartonInput {
  return {
    id: overrides.id,
    title: overrides.title,
    width: overrides.width ?? 300,
    length: overrides.length ?? 200,
    height: overrides.height ?? 150,
    weight: overrides.weight ?? 2,
    quantity: overrides.quantity ?? 1,
    color: overrides.color ?? "#74cc91",
    uprightPolicy: overrides.uprightPolicy ?? "tailOnly",
  };
}

function unpackedUnits(result: ReturnType<typeof packPallets>): number {
  return result.unpacked.reduce((sum, entry) => sum + Math.max(0, Math.trunc(entry.quantity)), 0);
}

describe("packer guidance workflow", () => {
  it("more searchSteps is never worse than a single-step guided run", () => {
    const cartons: CartonInput[] = [
      carton({ id: "A", title: "A", quantity: 90 }),
      carton({ id: "B", title: "B", width: 250, length: 200, height: 120, weight: 1.8, quantity: 60 }),
    ];

    const basePallet: Omit<PalletInput, "sampleGuidance"> = {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 900,
      packingStyle: "edgeAligned",
      extraPalletMode: "full",
    };

    const oneStep = packPallets(
      {
        ...basePallet,
        sampleGuidance: {
          preferredMode: "center",
          preferredPackingStyle: "centerCompact",
          confidence: 1.2,
          sourceSampleCount: 8,
          cfgScale: 1.4,
          searchSteps: 1,
          randomSeed: 1337,
          sampleFilter: "dims",
        },
      },
      cartons,
    );

    const multiStep = packPallets(
      {
        ...basePallet,
        sampleGuidance: {
          preferredMode: "center",
          preferredPackingStyle: "centerCompact",
          confidence: 1.2,
          sourceSampleCount: 8,
          cfgScale: 1.4,
          searchSteps: 6,
          randomSeed: 1337,
          sampleFilter: "dims",
        },
      },
      cartons,
    );

    expect(multiStep.packedUnits).toBeGreaterThanOrEqual(oneStep.packedUnits);
    if (multiStep.packedUnits === oneStep.packedUnits) {
      expect(multiStep.maxHeight).toBeLessThanOrEqual(oneStep.maxHeight + 1e-6);
    }
  }, 15000);

  it("guidance with zero confidence behaves like unguided packing", () => {
    const cartons: CartonInput[] = [
      carton({ id: "A", title: "A", quantity: 80 }),
      carton({ id: "B", title: "B", width: 400, length: 300, height: 200, weight: 4, quantity: 20 }),
    ];
    const basePallet: PalletInput = {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 1000,
      packingStyle: "edgeAligned",
      extraPalletMode: "full",
    };

    const unguided = packPallets(basePallet, cartons);
    const zeroConfidence = packPallets(
      {
        ...basePallet,
        sampleGuidance: {
          preferredMode: "center",
          preferredPackingStyle: "centerCompact",
          confidence: 0,
          sourceSampleCount: 16,
          cfgScale: 2,
          searchSteps: 12,
          randomSeed: 2026,
          sampleFilter: "exact",
        },
      },
      cartons,
    );

    expect(zeroConfidence.packedUnits).toBe(unguided.packedUnits);
    expect(zeroConfidence.pallets.length).toBe(unguided.pallets.length);
    expect(unpackedUnits(zeroConfidence)).toBe(unpackedUnits(unguided));
  });
});
