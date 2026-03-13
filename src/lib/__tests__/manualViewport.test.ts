import { describe, expect, it } from "vitest";
import type { PackedCarton, PalletInput } from "../packer";
import { resolveNextManualViewSeed } from "../../components/visualizer/visualizerManualViewSeed";
import { computeManualViewportMaxDim } from "../../components/visualizer/visualizerManualViewport";

const pallet: PalletInput = {
  width: 1000,
  length: 1200,
  maxHeight: 1800,
  maxWeight: 1000,
  packingStyle: "edgeAligned",
  extraPalletMode: "none",
};

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
    w: overrides.w ?? 200,
    l: overrides.l ?? 300,
    h: overrides.h ?? 150,
    weight: overrides.weight ?? 5,
    color: overrides.color ?? "#8ee0a8",
  };
}

describe("manual viewport helpers", () => {
  it("expands manual view size to include off-pallet staged cartons while keeping pallet center stable", () => {
    const manualCartons: PackedCarton[] = [
      packedCarton({
        id: "staging-a",
        typeId: "A",
        title: "Carton A",
        x: 2480,
        y: 1500,
      }),
    ];

    expect(computeManualViewportMaxDim(pallet, manualCartons)).toBe(4360);
  });

  it("only grows the manual view seed and clears it outside manual mode", () => {
    const initialSeed = resolveNextManualViewSeed(null, "manual", 1200, 200);
    const expandedSeed = resolveNextManualViewSeed(initialSeed, "manual", 4360, 260);
    const unchangedSeed = resolveNextManualViewSeed(expandedSeed, "manual", 1800, 220);

    expect(initialSeed).toEqual({ maxDim: 1200, orbitTargetY: 200 });
    expect(expandedSeed).toEqual({ maxDim: 4360, orbitTargetY: 260 });
    expect(unchangedSeed).toBe(expandedSeed);
    expect(resolveNextManualViewSeed(expandedSeed, "generation", 800, 100)).toBeNull();
  });
});
