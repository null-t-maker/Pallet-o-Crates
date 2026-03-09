import { describe, expect, it } from "vitest";
import { cumulativeStackLoadSafe } from "../packerLayerCumulativeLoad";
import { overlapArea } from "../packerGeometryCore";
import type { PackedCarton } from "../packerTypes";

const deps = {
  EPS: 1e-6,
  MIN_FULL_SUPPORT_RATIO: 0.76,
  overlapArea,
};

function packed(
  id: string,
  x: number,
  y: number,
  z: number,
  w = 400,
  l = 400,
  h = 100,
): PackedCarton {
  return {
    id,
    typeId: "T",
    title: id,
    x,
    y,
    z,
    w,
    l,
    h,
    weight: 1,
    color: "#cccccc",
  };
}

describe("cumulative stack load safety", () => {
  it("rejects staircase columns with cumulative center drift", () => {
    const cartons: PackedCarton[] = [
      packed("c0", 0, 0, 0),
      packed("c1", 40, 0, 100),
      packed("c2", 80, 0, 200),
      packed("c3", 120, 0, 300),
      packed("c4", 160, 0, 400),
    ];

    expect(cumulativeStackLoadSafe(cartons, deps)).toBe(false);
  });

  it("allows moderate local offsets that do not create staircase drift", () => {
    const cartons: PackedCarton[] = [
      packed("c0", 0, 0, 0),
      packed("c1", 40, 0, 100),
      packed("c2", 80, 0, 200),
      packed("c3", 40, 0, 300),
    ];

    expect(cumulativeStackLoadSafe(cartons, deps)).toBe(true);
  });
});
