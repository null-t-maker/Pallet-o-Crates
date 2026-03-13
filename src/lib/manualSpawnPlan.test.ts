import { describe, expect, it } from "vitest";
import type { CartonInput } from "./packer";
import { buildManualSpawnZPlan, buildStoredManualSpawnLevels } from "./manualSpawnPlan";

const BASE_CARTON: CartonInput = {
  id: "carton-1",
  title: "Carton",
  width: 300,
  length: 200,
  height: 135,
  weight: 4,
  quantity: 10,
  color: "#43b66f",
};

describe("manualSpawnPlan", () => {
  it("stores no explicit levels for the default single Z=0 spawn", () => {
    expect(buildStoredManualSpawnLevels(10, [{ quantity: 10, zLevel: 0 }])).toBeUndefined();
  });

  it("builds a Z plan from explicit spawn levels", () => {
    const plan = buildManualSpawnZPlan({
      ...BASE_CARTON,
      manualSpawnLevels: [
        { quantity: 6, zLevel: 0 },
        { quantity: 4, zLevel: 1 },
      ],
    });

    expect(plan).toEqual([0, 0, 0, 0, 0, 0, 135, 135, 135, 135]);
  });

  it("fills any remaining quantity back into Z=0", () => {
    const plan = buildManualSpawnZPlan({
      ...BASE_CARTON,
      manualSpawnLevels: [
        { quantity: 4, zLevel: 2 },
      ],
    });

    expect(plan).toEqual([0, 0, 0, 0, 0, 0, 270, 270, 270, 270]);
  });
});
