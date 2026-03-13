import { describe, expect, it } from "vitest";
import {
  buildManualAxisDraftValues,
  buildManualAxisPatchFromDraft,
  hasManualAxisDraftChanges,
} from "./manualAxisDraft";

describe("manualAxisDraft", () => {
  it("formats current carton coordinates as rounded strings", () => {
    expect(buildManualAxisDraftValues({ x: 610.4, y: 725.0009, z: 300.49 })).toEqual({
      x: "610.4",
      y: "725",
      z: "300.5",
    });
  });

  it("builds a full axis patch from manual draft values", () => {
    expect(
      buildManualAxisPatchFromDraft(
        { x: "645", y: "725", z: "450" },
        { x: 610, y: 725, z: 300 },
      ),
    ).toEqual({
      x: 645,
      y: 725,
      z: 450,
    });
  });

  it("falls back to current values for blank or invalid draft fields", () => {
    expect(
      buildManualAxisPatchFromDraft(
        { x: "", y: "abc", z: "450" },
        { x: 610, y: 725, z: 300 },
      ),
    ).toEqual({
      x: 610,
      y: 725,
      z: 450,
    });
  });

  it("detects whether the manual draft differs from current coordinates", () => {
    expect(hasManualAxisDraftChanges(
      { x: "610", y: "725", z: "300" },
      { x: 610, y: 725, z: 300 },
    )).toBe(false);
    expect(hasManualAxisDraftChanges(
      { x: "645", y: "725", z: "300" },
      { x: 610, y: 725, z: 300 },
    )).toBe(true);
  });
});
