import { describe, expect, it } from "vitest";
import { buildDiagnosticsSummary } from "../diagnostics";
import { CartonInput, MultiPackResult, PackedCarton, PalletInput, packPallets } from "../packer";

const EPS = 1e-6;
const MIN_SUPPORT_RATIO = 0.985;

function carton(overrides: Partial<CartonInput> & Pick<CartonInput, "id" | "title">): CartonInput {
  return {
    id: overrides.id,
    title: overrides.title,
    width: overrides.width ?? 300,
    length: overrides.length ?? 200,
    height: overrides.height ?? 150,
    weight: overrides.weight ?? 2,
    quantity: overrides.quantity ?? 1,
    color: overrides.color ?? "#7ccf8a",
    uprightPolicy: overrides.uprightPolicy ?? "tailOnly",
  };
}

function requestedUnits(cartons: CartonInput[]): number {
  return cartons.reduce((sum, entry) => sum + Math.max(0, Math.trunc(entry.quantity)), 0);
}

function unpackedUnits(result: MultiPackResult): number {
  return result.unpacked.reduce((sum, entry) => sum + Math.max(0, Math.trunc(entry.quantity)), 0);
}

function overlapArea2D(a: PackedCarton, b: PackedCarton): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.l, b.y + b.l);
  return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
}

function supportRatio(top: PackedCarton, all: PackedCarton[]): number {
  if (top.z <= EPS) return 1;

  const touchingBelow = all.filter((candidate) => {
    if (candidate.id === top.id) return false;
    const candidateTop = candidate.z + candidate.h;
    return Math.abs(candidateTop - top.z) <= 1e-3;
  });

  if (touchingBelow.length === 0) return 0;

  const area = touchingBelow.reduce((sum, below) => sum + overlapArea2D(top, below), 0);
  return area / Math.max(top.w * top.l, EPS);
}

function assertNoFloatingCartons(result: MultiPackResult): void {
  for (const placed of result.pallets) {
    const localCartons = placed.result.layers.flatMap((layer) => layer.cartons);
    for (const top of localCartons) {
      if (top.z <= EPS) continue;
      const ratio = supportRatio(top, localCartons);
      expect(ratio).toBeGreaterThanOrEqual(MIN_SUPPORT_RATIO - 1e-3);
    }
  }
}

function assertHardInvariants(pallet: PalletInput, result: MultiPackResult): void {
  const diagnostics = buildDiagnosticsSummary(result, pallet);
  expect(diagnostics).not.toBeNull();
  expect(diagnostics?.overlapCount ?? -1).toBe(0);
  expect(diagnostics?.boundsViolations ?? -1).toBe(0);
  expect(diagnostics?.limitsExceeded ?? true).toBe(false);

  for (const placed of result.pallets) {
    expect(placed.result.totalWeight).toBeLessThanOrEqual(pallet.maxWeight + EPS);
    expect(placed.result.totalHeight).toBeLessThanOrEqual(pallet.maxHeight + EPS);
  }

  assertNoFloatingCartons(result);
}

describe("packer hard invariants", () => {
  it("keeps no-overlap/no-bounds-violation for dense mono-SKU packing", () => {
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
        quantity: 200,
      }),
    ];

    const result = packPallets(pallet, cartons);
    assertHardInvariants(pallet, result);
    expect(result.pallets.length).toBe(1);
    expect(result.packedUnits).toBeGreaterThan(150);
    expect(result.packedUnits).toBeLessThanOrEqual(requestedUnits(cartons));
  });

  it("respects extra pallet modes under hard weight limits", () => {
    const cartons: CartonInput[] = [
      carton({
        id: "W",
        title: "Weight limited",
        width: 200,
        length: 200,
        height: 200,
        weight: 10,
        quantity: 30,
      }),
    ];

    const basePallet: Omit<PalletInput, "extraPalletMode"> = {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 100,
      packingStyle: "edgeAligned",
    };

    const none = packPallets({ ...basePallet, extraPalletMode: "none" }, cartons);
    const limitsOnly = packPallets({ ...basePallet, extraPalletMode: "limitsOnly" }, cartons);
    const full = packPallets({ ...basePallet, extraPalletMode: "full" }, cartons);

    assertHardInvariants({ ...basePallet, extraPalletMode: "none" }, none);
    assertHardInvariants({ ...basePallet, extraPalletMode: "limitsOnly" }, limitsOnly);
    assertHardInvariants({ ...basePallet, extraPalletMode: "full" }, full);

    expect(none.pallets.length).toBe(1);
    expect(unpackedUnits(none)).toBeGreaterThan(0);

    expect(limitsOnly.packedUnits).toBeGreaterThanOrEqual(none.packedUnits);
    expect(full.packedUnits).toBeGreaterThanOrEqual(limitsOnly.packedUnits);
    expect(unpackedUnits(full)).toBe(0);
  });

  it("keeps support and bounds for mixed carton sets", () => {
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
        id: "A",
        title: "Carton A",
        width: 300,
        length: 200,
        height: 150,
        weight: 2,
        quantity: 120,
      }),
      carton({
        id: "B",
        title: "Carton B",
        width: 400,
        length: 300,
        height: 200,
        weight: 4,
        quantity: 40,
      }),
    ];

    const result = packPallets(pallet, cartons);
    assertHardInvariants(pallet, result);
    expect(result.packedUnits).toBeGreaterThan(0);
    expect(result.packedUnits).toBeLessThanOrEqual(requestedUnits(cartons));
  });

  it("maintains hard invariants with sample guidance enabled", () => {
    const pallet: PalletInput = {
      width: 800,
      length: 1200,
      maxHeight: 1800,
      maxWeight: 900,
      packingStyle: "edgeAligned",
      extraPalletMode: "full",
      sampleGuidance: {
        preferredMode: "center",
        preferredPackingStyle: "centerCompact",
        confidence: 1.2,
        sourceSampleCount: 12,
        cfgScale: 1.6,
        searchSteps: 4,
        randomSeed: 42,
        sampleFilter: "dims",
      },
    };
    const cartons: CartonInput[] = [
      carton({
        id: "G1",
        title: "Guided A",
        width: 300,
        length: 200,
        height: 150,
        weight: 2,
        quantity: 90,
      }),
      carton({
        id: "G2",
        title: "Guided B",
        width: 250,
        length: 200,
        height: 120,
        weight: 1.8,
        quantity: 60,
      }),
    ];

    const result = packPallets(pallet, cartons);
    assertHardInvariants(pallet, result);
    expect(result.packedUnits).toBeGreaterThan(0);
  });
});
