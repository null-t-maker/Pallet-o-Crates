import { describe, expect, it } from "vitest";
import { hydrateLoadedLayoutSample } from "../layoutSampleLoader";

describe("hydrateLoadedLayoutSample", () => {
  it("hydrates a generation sample into pallet, cartons, and result", () => {
    const payload = {
      schemaVersion: 1,
      descriptor: "generation-sample",
      workflowMode: "generation",
      pallet: {
        width: 800,
        length: 1200,
        maxHeight: 1800,
        maxWeight: 1000,
        packingStyle: "edgeAligned",
        extraPalletMode: "none",
      },
      cartonTypes: [
        {
          id: "A",
          title: "Carton A",
          width: 300,
          length: 200,
          height: 150,
          weight: 2,
          quantity: 2,
          color: "#6ad28f",
        },
      ],
      palletPlacements: [{ palletIndex: 0, offsetX: 0, offsetY: 0 }],
      placements: [
        {
          id: "slot-1",
          typeId: "A",
          title: "Carton A",
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
          title: "Carton A",
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
      ],
    };

    const hydrated = hydrateLoadedLayoutSample(payload);
    expect(hydrated.ok).toBe(true);
    if (!hydrated.ok) throw new Error(hydrated.error);

    expect(hydrated.value.workflowMode).toBe("generation");
    expect(hydrated.value.descriptor).toBe("generation-sample");
    expect(hydrated.value.pallet.width).toBe(800);
    expect(hydrated.value.cartons).toHaveLength(1);
    expect(hydrated.value.result?.packedUnits ?? 0).toBe(2);
    expect(hydrated.value.manualCartons).toHaveLength(0);
  });

  it("hydrates a manual sample and preserves staging-area placements", () => {
    const payload = {
      schemaVersion: 1,
      descriptor: "manual-sample",
      workflowMode: "manual",
      pallet: {
        width: 800,
        length: 1200,
        maxHeight: 1800,
        maxWeight: 1000,
        packingStyle: "edgeAligned",
        extraPalletMode: "none",
      },
      cartonTypes: [
        {
          id: "A",
          title: "Carton A",
          width: 300,
          length: 200,
          height: 150,
          weight: 2,
          quantity: 1,
          color: "#6ad28f",
        },
      ],
      palletPlacements: [{ palletIndex: 0, offsetX: 0, offsetY: 0 }],
      placements: [
        {
          id: "manual-1",
          typeId: "A",
          title: "Carton A",
          x: 940,
          y: 50,
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
      ],
    };

    const hydrated = hydrateLoadedLayoutSample(payload);
    expect(hydrated.ok).toBe(true);
    if (!hydrated.ok) throw new Error(hydrated.error);

    expect(hydrated.value.workflowMode).toBe("manual");
    expect(hydrated.value.result).toBeNull();
    expect(hydrated.value.manualCartons).toHaveLength(1);
    expect(hydrated.value.manualCartons[0]?.x).toBe(940);
    expect(hydrated.value.manualCartons[0]?.y).toBe(50);
  });

  it("allows generation samples without placements and restores inputs only", () => {
    const payload = {
      schemaVersion: 1,
      descriptor: "empty-generation-sample",
      workflowMode: "generation",
      pallet: {
        width: 1000,
        length: 1200,
        maxHeight: 1900,
        maxWeight: 1100,
        packingStyle: "centerCompact",
        extraPalletMode: "limitsOnly",
      },
      cartonTypes: [],
      palletPlacements: [{ palletIndex: 0, offsetX: 0, offsetY: 0 }],
      placements: [],
    };

    const hydrated = hydrateLoadedLayoutSample(payload);
    expect(hydrated.ok).toBe(true);
    if (!hydrated.ok) throw new Error(hydrated.error);

    expect(hydrated.value.workflowMode).toBe("generation");
    expect(hydrated.value.result).toBeNull();
    expect(hydrated.value.manualCartons).toHaveLength(0);
    expect(hydrated.value.pallet.packingStyle).toBe("centerCompact");
    expect(hydrated.value.pallet.extraPalletMode).toBe("limitsOnly");
  });
});
