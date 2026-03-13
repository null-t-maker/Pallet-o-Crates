import { describe, expect, it } from "vitest";
import type { CartonInput, MultiPackResult, PackedCarton, PalletInput } from "../packer";
import { buildDiagnosticsSummary } from "../diagnostics";
import {
  calculateMissingCartonsFromGenerationSeedAsync,
  calculateMissingCartonsFromManualSeed,
} from "../packingWorkflowLockedSeed";

const pallet: PalletInput = {
  width: 800,
  length: 1200,
  maxHeight: 1800,
  maxWeight: 1000,
  packingStyle: "edgeAligned",
  extraPalletMode: "full",
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

function generationResultFrom(cartons: PackedCarton[]): MultiPackResult {
  return {
    pallets: [{
      index: 0,
      offsetX: 0,
      offsetY: 0,
      result: {
        layers: [{
          zBase: 0,
          height: 150,
          cartons,
        }],
        totalWeight: cartons.reduce((sum, carton) => sum + carton.weight, 0),
        totalHeight: cartons.reduce((max, carton) => Math.max(max, carton.z + carton.h), 0),
        unpacked: [],
      },
    }],
    totalWeight: cartons.reduce((sum, carton) => sum + carton.weight, 0),
    maxHeight: cartons.reduce((max, carton) => Math.max(max, carton.z + carton.h), 0),
    unpacked: [],
    packedUnits: cartons.length,
    requestedUnits: cartons.length,
  };
}

describe("calculateMissingCartonsFromManualSeed", () => {
  it("preserves locked manual placements and calculates the remaining cartons around them", () => {
    const cartons: CartonInput[] = [
      cartonInput({ id: "A", title: "Carton A", quantity: 1 }),
      cartonInput({ id: "B", title: "Carton B", quantity: 10 }),
    ];
    const manualCartons: PackedCarton[] = [
      packedCarton({ id: "locked-a", typeId: "A", title: "Carton A", x: 0, y: 0, z: 0 }),
      packedCarton({ id: "locked-b", typeId: "B", title: "Carton B", x: 0, y: 0, z: 150 }),
    ];

    const calculated = calculateMissingCartonsFromManualSeed({
      pallet,
      cartons,
      manualCartons,
      sampleGuidance: null,
    });

    expect(calculated.lockedStatus).toBe("Locked manual seed: preserved 2");
    expect(calculated.result.packedUnits).toBe(11);
    expect(calculated.result.requestedUnits).toBe(11);
    expect(calculated.result.unpacked).toHaveLength(0);

    const firstPalletCartons = calculated.result.pallets[0]?.result.layers.flatMap((layer) => layer.cartons) ?? [];
    expect(firstPalletCartons.find((carton) => carton.id === "locked-a")).toMatchObject({
      x: 0,
      y: 0,
      z: 0,
    });
    expect(firstPalletCartons.find((carton) => carton.id === "locked-b")).toMatchObject({
      x: 0,
      y: 0,
      z: 150,
    });

    const diagnostics = buildDiagnosticsSummary(calculated.result, pallet);
    expect(diagnostics?.hasIssues).toBe(false);
    expect(diagnostics?.overlapCount).toBe(0);
    expect(diagnostics?.boundsViolations).toBe(0);
  });
});

describe("calculateMissingCartonsFromGenerationSeedAsync", () => {
  it("preserves the current generation layout and calculates only missing cartons", async () => {
    const cartons: CartonInput[] = [
      cartonInput({ id: "A", title: "Carton A", quantity: 2 }),
      cartonInput({ id: "B", title: "Carton B", quantity: 3 }),
    ];
    const current = generationResultFrom([
      packedCarton({ id: "generated-a-1", typeId: "A", title: "Carton A", x: 0, y: 0, z: 0 }),
      packedCarton({ id: "generated-a-2", typeId: "A", title: "Carton A", x: 300, y: 0, z: 0 }),
      packedCarton({ id: "generated-b-1", typeId: "B", title: "Carton B", x: 0, y: 200, z: 0 }),
    ]);

    const calculated = await calculateMissingCartonsFromGenerationSeedAsync({
      pallet,
      cartons,
      generationResult: current,
      sampleGuidance: null,
    });

    expect(calculated.lockedStatus).toBe("Locked generation seed: preserved 3");
    expect(calculated.result.packedUnits).toBe(5);
    expect(calculated.result.requestedUnits).toBe(5);
    expect(calculated.result.unpacked).toHaveLength(0);

    const firstPalletCartons = calculated.result.pallets[0]?.result.layers.flatMap((layer) => layer.cartons) ?? [];
    expect(firstPalletCartons.find((carton) => carton.id === "generated-a-1")).toMatchObject({
      x: 0,
      y: 0,
      z: 0,
    });
    expect(firstPalletCartons.find((carton) => carton.id === "generated-a-2")).toMatchObject({
      x: 300,
      y: 0,
      z: 0,
    });
    expect(firstPalletCartons.find((carton) => carton.id === "generated-b-1")).toMatchObject({
      x: 0,
      y: 200,
      z: 0,
    });

    const diagnostics = buildDiagnosticsSummary(calculated.result, pallet);
    expect(diagnostics?.hasIssues).toBe(false);
  });
});
