import { describe, expect, it } from "vitest";
import { buildDiagnosticsSummary } from "../diagnostics";
import { CartonInput, MultiPackResult, PalletInput } from "../packer";
import {
  buildTemplateResultFromPayload,
  mergeTemplateWithSupplementaryPallets,
  packTemplateRemainderAdaptive,
} from "../templateLock";

const BASE_PALLET: PalletInput = {
  width: 800,
  length: 1200,
  maxHeight: 1800,
  maxWeight: 1000,
  packingStyle: "edgeAligned",
  extraPalletMode: "full",
};

function carton(overrides: Partial<CartonInput> & Pick<CartonInput, "id" | "title">): CartonInput {
  return {
    id: overrides.id,
    title: overrides.title,
    width: overrides.width ?? 300,
    length: overrides.length ?? 200,
    height: overrides.height ?? 150,
    weight: overrides.weight ?? 2,
    quantity: overrides.quantity ?? 1,
    color: overrides.color ?? "#6ad28f",
    uprightPolicy: overrides.uprightPolicy ?? "tailOnly",
  };
}

function templatePayload(placements: unknown[]): unknown {
  return {
    descriptor: "template-test",
    palletPlacements: [{ palletIndex: 0, offsetX: 0, offsetY: 0 }],
    placements,
  };
}

function assertHardInvariants(result: MultiPackResult, pallet: PalletInput): void {
  const diagnostics = buildDiagnosticsSummary(result, pallet);
  expect(diagnostics).not.toBeNull();
  expect(diagnostics?.overlapCount ?? -1).toBe(0);
  expect(diagnostics?.boundsViolations ?? -1).toBe(0);
  expect(diagnostics?.limitsExceeded ?? true).toBe(false);
}

describe("template lock regression", () => {
  it("rejects payload with out-of-bounds placement", () => {
    const cartons = [carton({ id: "A", title: "A", quantity: 1 })];
    const payload = templatePayload([
      {
        id: "p1",
        typeId: "A",
        title: "A",
        x: 650,
        y: 0,
        z: 0,
        w: 300,
        l: 200,
        h: 150,
        weight: 2,
        color: "#6ad28f",
        palletIndex: 0,
        offsetX: 0,
        offsetY: 0,
      },
    ]);

    const result = buildTemplateResultFromPayload(payload, BASE_PALLET, cartons);
    expect(result).toBeNull();
  });

  it("builds a valid template result for exact shape request", () => {
    const cartons = [carton({ id: "A", title: "A", quantity: 2 })];
    const payload = templatePayload([
      {
        id: "slot-1",
        typeId: "A",
        title: "A",
        x: 0,
        y: 0,
        z: 0,
        w: 300,
        l: 200,
        h: 150,
        weight: 2,
        color: "#6ad28f",
        palletIndex: 0,
        offsetX: 0,
        offsetY: 0,
      },
      {
        id: "slot-2",
        typeId: "A",
        title: "A",
        x: 300,
        y: 0,
        z: 0,
        w: 300,
        l: 200,
        h: 150,
        weight: 2,
        color: "#6ad28f",
        palletIndex: 0,
        offsetX: 0,
        offsetY: 0,
      },
    ]);

    const result = buildTemplateResultFromPayload(payload, BASE_PALLET, cartons);
    expect(result).not.toBeNull();
    expect(result?.result.packedUnits).toBe(2);
    expect(result?.result.unpacked.length).toBe(0);
    assertHardInvariants(result!.result, BASE_PALLET);
  });

  it("extends single-shape template cycles when requested quantity exceeds sample slots", () => {
    const cartons = [carton({ id: "A", title: "A", quantity: 4 })];
    const payload = templatePayload([
      {
        id: "slot-1",
        typeId: "A",
        title: "A",
        x: 0,
        y: 0,
        z: 0,
        w: 300,
        l: 200,
        h: 150,
        weight: 2,
        color: "#6ad28f",
        palletIndex: 0,
        offsetX: 0,
        offsetY: 0,
      },
      {
        id: "slot-2",
        typeId: "A",
        title: "A",
        x: 300,
        y: 0,
        z: 0,
        w: 300,
        l: 200,
        h: 150,
        weight: 2,
        color: "#6ad28f",
        palletIndex: 0,
        offsetX: 0,
        offsetY: 0,
      },
    ]);

    const result = buildTemplateResultFromPayload(payload, BASE_PALLET, cartons);
    expect(result).not.toBeNull();
    expect(result?.result.packedUnits).toBe(4);
    expect(result?.result.unpacked.length).toBe(0);
    expect(result?.result.pallets[0]?.result.layers.length).toBeGreaterThanOrEqual(2);
    assertHardInvariants(result!.result, BASE_PALLET);
  });

  it("rejects template when required shapes are missing in payload", () => {
    const cartons = [
      carton({ id: "A", title: "A", quantity: 1 }),
      carton({ id: "B", title: "B", width: 400, length: 300, height: 200, weight: 4, quantity: 1 }),
    ];
    const payload = templatePayload([
      {
        id: "slot-1",
        typeId: "A",
        title: "A",
        x: 0,
        y: 0,
        z: 0,
        w: 300,
        l: 200,
        h: 150,
        weight: 2,
        color: "#6ad28f",
        palletIndex: 0,
        offsetX: 0,
        offsetY: 0,
      },
    ]);

    const result = buildTemplateResultFromPayload(payload, BASE_PALLET, cartons);
    expect(result).toBeNull();
  });

  it("merges template with supplementary pallets using non-overlapping shifted offsets", () => {
    const templateResult: MultiPackResult = {
      pallets: [
        {
          index: 0,
          offsetX: 0,
          offsetY: 0,
          result: {
            layers: [],
            totalWeight: 100,
            totalHeight: 300,
            unpacked: [],
          },
        },
      ],
      totalWeight: 100,
      maxHeight: 300,
      unpacked: [carton({ id: "A", title: "A", quantity: 2 })],
      packedUnits: 8,
      requestedUnits: 10,
    };

    const supplementaryResult: MultiPackResult = {
      pallets: [
        {
          index: 0,
          offsetX: 0,
          offsetY: 0,
          result: {
            layers: [],
            totalWeight: 40,
            totalHeight: 200,
            unpacked: [],
          },
        },
      ],
      totalWeight: 40,
      maxHeight: 200,
      unpacked: [],
      packedUnits: 2,
      requestedUnits: 2,
    };

    const merged = mergeTemplateWithSupplementaryPallets(
      templateResult,
      supplementaryResult,
      BASE_PALLET,
    );

    expect(merged.pallets.length).toBe(2);
    expect(merged.pallets[1].index).toBe(1);
    expect(merged.pallets[1].offsetX).toBeGreaterThan(BASE_PALLET.width);
    expect(merged.packedUnits).toBe(10);
    expect(merged.unpacked.length).toBe(0);
  });

  it("packs remainder adaptively without violating hard diagnostics", () => {
    const cartons = [
      carton({ id: "A", title: "A", quantity: 80 }),
      carton({ id: "B", title: "B", width: 400, length: 300, height: 200, weight: 4, quantity: 24 }),
    ];

    const adaptive = packTemplateRemainderAdaptive(BASE_PALLET, cartons);
    expect(adaptive.result.packedUnits).toBeGreaterThan(0);
    expect(adaptive.result.packedUnits).toBeLessThanOrEqual(
      cartons.reduce((sum, c) => sum + c.quantity, 0),
    );
    expect(adaptive.usedStyles.length).toBe(adaptive.result.pallets.length);
    for (const style of adaptive.usedStyles) {
      expect(["edgeAligned", "centerCompact"]).toContain(style);
    }

    assertHardInvariants(adaptive.result, BASE_PALLET);
  });
});
