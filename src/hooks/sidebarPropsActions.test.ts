import { describe, expect, it, vi } from "vitest";
import type { MultiPackResult } from "../lib/packer";
import { buildSidebarActionBindings } from "./sidebarPropsActions";

function createGenerationSeedResult(): MultiPackResult {
  return {
    pallets: [{
      index: 0,
      offsetX: 0,
      offsetY: 0,
      result: {
        layers: [{
          zBase: 0,
          height: 150,
          cartons: [{
            id: "locked-a",
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
          }],
        }],
        totalWeight: 2,
        totalHeight: 150,
        unpacked: [],
      },
    }],
    totalWeight: 2,
    maxHeight: 150,
    unpacked: [{
      id: "B",
      title: "Carton B",
      width: 300,
      length: 200,
      height: 150,
      weight: 2,
      quantity: 9,
      color: "#43b66f",
    }],
    packedUnits: 2,
    requestedUnits: 11,
  };
}

describe("buildSidebarActionBindings", () => {
  it("keeps calculate missing cartons available above full layout in generation", () => {
    const handleCalculate = vi.fn();
    const handleCalculateMissing = vi.fn();
    const handleGenerateManualAgain = vi.fn();
    const handleGenerateManualMore = vi.fn();
    const switchWorkflowMode = vi.fn();

    const bindings = buildSidebarActionBindings({
      workflowMode: "generation",
      manualCartonCount: 0,
      result: createGenerationSeedResult(),
      generationSeedResult: createGenerationSeedResult(),
      labels: {
        calculateFullLayoutLabel: "Calculate full layout",
        calculateMissingCartonsLabel: "Calculate missing cartons",
        generateCartonsLabel: "Generate cartons",
        regenerateAllCartonsLabel: "Regenerate all cartons",
        generateMoreCartonsLabel: "Generate missing cartons",
        switchToManualEditingLabel: "Switch to manual editing",
        switchToPalletGenerationLabel: "Switch to pallet generation",
      } as any,
      handleCalculate,
      handleCalculateMissing,
      handleGenerateManualAgain,
      handleGenerateManualMore,
      workflowBusyKind: null,
      switchWorkflowMode,
    });

    expect(bindings.primaryActionLabel).toBe("Calculate full layout");
    expect(bindings.secondaryActionLabel).toBe("Calculate missing cartons");
    expect(bindings.dualActionPrimaryAccent).toBe(false);
    expect(bindings.actionsDisabled).toBe(false);
    bindings.onPrimaryAction();
    bindings.onSecondaryAction?.();
    expect(handleCalculate).toHaveBeenCalledOnce();
    expect(handleCalculateMissing).toHaveBeenCalledOnce();
  });

  it("marks generation actions as busy while full layout calculation is running", () => {
    const bindings = buildSidebarActionBindings({
      workflowMode: "generation",
      manualCartonCount: 0,
      result: createGenerationSeedResult(),
      generationSeedResult: createGenerationSeedResult(),
      labels: {
        calculateFullLayoutLabel: "Calculate full layout",
        calculateMissingCartonsLabel: "Calculate missing cartons",
        generateCartonsLabel: "Generate cartons",
        regenerateAllCartonsLabel: "Regenerate all cartons",
        generateMoreCartonsLabel: "Generate missing cartons",
        switchToManualEditingLabel: "Switch to manual editing",
        switchToPalletGenerationLabel: "Switch to pallet generation",
      } as any,
      handleCalculate: vi.fn(),
      handleCalculateMissing: vi.fn(),
      handleGenerateManualAgain: vi.fn(),
      handleGenerateManualMore: vi.fn(),
      workflowBusyKind: "calculate",
      switchWorkflowMode: vi.fn(),
    });

    expect(bindings.primaryActionLabel).toBe("Calculate full layout...");
    expect(bindings.secondaryActionLabel).toBe("Calculate missing cartons");
    expect(bindings.actionsDisabled).toBe(true);
  });

  it("still exposes calculate missing cartons in generation without a seed preview", () => {
    const bindings = buildSidebarActionBindings({
      workflowMode: "generation",
      manualCartonCount: 0,
      result: null,
      generationSeedResult: null,
      labels: {
        calculateFullLayoutLabel: "Calculate full layout",
        calculateMissingCartonsLabel: "Calculate missing cartons",
        generateCartonsLabel: "Generate cartons",
        regenerateAllCartonsLabel: "Regenerate all cartons",
        generateMoreCartonsLabel: "Generate missing cartons",
        switchToManualEditingLabel: "Switch to manual editing",
        switchToPalletGenerationLabel: "Switch to pallet generation",
      } as any,
      handleCalculate: vi.fn(),
      handleCalculateMissing: vi.fn(),
      handleGenerateManualAgain: vi.fn(),
      handleGenerateManualMore: vi.fn(),
      workflowBusyKind: null,
      switchWorkflowMode: vi.fn(),
    });

    expect(bindings.primaryActionLabel).toBe("Calculate full layout");
    expect(bindings.secondaryActionLabel).toBe("Calculate missing cartons");
  });
});
