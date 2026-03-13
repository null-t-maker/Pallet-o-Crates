import { describe, expect, it, vi } from "vitest";
import type { CartonInput, MultiPackResult, PackedCarton, PalletInput } from "../lib/packer";
import { applyWorkflowModeTransition } from "./workflowModeTransition";

const pallet: PalletInput = {
  width: 800,
  length: 1200,
  maxHeight: 1800,
  maxWeight: 1000,
  packingStyle: "edgeAligned",
  extraPalletMode: "none",
};

const cartons: CartonInput[] = [{
  id: "A",
  title: "Carton A",
  width: 300,
  length: 200,
  height: 150,
  weight: 2,
  quantity: 3,
  color: "#43b66f",
}];

const manualCartons: PackedCarton[] = [{
  id: "manual-a-1",
  typeId: "A",
  title: "Carton A",
  x: 0,
  y: 0,
  z: 0,
  w: 300,
  l: 200,
  h: 150,
  weight: 2,
  color: "#43b66f",
}];

function createEmptyResult(): MultiPackResult {
  return {
    pallets: [],
    totalWeight: 0,
    maxHeight: 0,
    unpacked: cartons,
    packedUnits: 0,
    requestedUnits: 3,
  };
}

describe("applyWorkflowModeTransition", () => {
  it("builds a generation seed from manual layout without clearing the manual draft", () => {
    const closeWorkflowPanel = vi.fn();
    const setVisibleLayers = vi.fn();
    const applyManualCartons = vi.fn();
    const clearManualLayout = vi.fn();
    const setResult = vi.fn();
    const setGenerationSeedResult = vi.fn();
    const setWorkflowMode = vi.fn();

    applyWorkflowModeTransition({
      workflowMode: "manual",
      nextMode: "generation",
      closeWorkflowPanel,
      setVisibleLayers,
      pallet,
      cartons,
      manualCartons,
      result: null,
      applyManualCartons,
      clearManualLayout,
      setResult,
      generationSeedResult: null,
      setGenerationSeedResult,
      setWorkflowMode,
    });

    expect(closeWorkflowPanel).toHaveBeenCalledOnce();
    expect(setVisibleLayers).toHaveBeenCalledWith(0);
    expect(clearManualLayout).not.toHaveBeenCalled();
    expect(applyManualCartons).not.toHaveBeenCalled();
    expect(setResult).toHaveBeenCalledWith(null);
    expect(setGenerationSeedResult).toHaveBeenCalledWith(expect.objectContaining({
      packedUnits: 1,
      requestedUnits: 3,
    }));
    expect(setWorkflowMode).toHaveBeenCalledWith("generation");
  });

  it("keeps the manual draft intact when switching back from generation seed without a calculated result", () => {
    const closeWorkflowPanel = vi.fn();
    const setVisibleLayers = vi.fn();
    const applyManualCartons = vi.fn();
    const clearManualLayout = vi.fn();
    const setResult = vi.fn();
    const setGenerationSeedResult = vi.fn();
    const setWorkflowMode = vi.fn();

    applyWorkflowModeTransition({
      workflowMode: "generation",
      nextMode: "manual",
      closeWorkflowPanel,
      setVisibleLayers,
      pallet,
      cartons,
      manualCartons,
      result: createEmptyResult(),
      applyManualCartons,
      clearManualLayout,
      setResult,
      generationSeedResult: {
        pallets: [{
          index: 0,
          offsetX: 0,
          offsetY: 0,
          result: {
            layers: [{
              zBase: 0,
              height: 150,
              cartons: manualCartons,
            }],
            totalWeight: 2,
            totalHeight: 150,
            unpacked: [],
          },
        }],
        totalWeight: 2,
        maxHeight: 150,
        unpacked: [{
          ...cartons[0],
          quantity: 2,
        }],
        packedUnits: 1,
        requestedUnits: 3,
      },
      setGenerationSeedResult,
      setWorkflowMode,
    });

    expect(closeWorkflowPanel).toHaveBeenCalledOnce();
    expect(setVisibleLayers).toHaveBeenCalledWith(0);
    expect(setGenerationSeedResult).toHaveBeenCalledWith(null);
    expect(applyManualCartons).not.toHaveBeenCalled();
    expect(clearManualLayout).not.toHaveBeenCalled();
    expect(setResult).toHaveBeenCalledWith(null);
    expect(setWorkflowMode).toHaveBeenCalledWith("manual");
  });
});
