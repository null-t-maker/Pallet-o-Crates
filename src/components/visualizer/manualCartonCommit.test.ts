import { describe, expect, it, vi } from "vitest";
import type { PackedCarton, PalletInput } from "../../lib/packer";
import { commitManualCarton } from "./manualCartonCommit";

const PALLET: PalletInput = {
  width: 800,
  length: 1200,
  maxHeight: 1800,
  maxWeight: 1000,
  packingStyle: "edgeAligned",
  extraPalletMode: "none",
};

const CARTON: PackedCarton = {
  id: "manual-2",
  typeId: "c2",
  title: "Carton 2",
  x: 100,
  y: 100,
  z: 0,
  w: 275,
  l: 225,
  h: 150,
  weight: 4,
  color: "#f0883e",
};

describe("commitManualCarton pallet clamp", () => {
  it("keeps partially overlapping corner moves inside the pallet after quantization", () => {
    const onManualCartonUpdate = vi.fn();
    const setManualHint = vi.fn();

    const committed = commitManualCarton({
      carton: CARTON,
      patch: { x: 530, y: 980, z: 0 },
      pallet: PALLET,
      manualMoveStepMm: 50,
      manualCollisionHint: "collision",
      manualCartons: [CARTON],
      onManualCartonUpdate,
      setManualHint,
    });

    expect(committed).not.toBeNull();
    expect(onManualCartonUpdate).toHaveBeenCalledWith(CARTON.id, expect.objectContaining({
      x: 525,
      y: 975,
      z: 0,
    }));
    expect(setManualHint).toHaveBeenCalledWith(null);
  });

  it("snaps a near-fit carton into an exact gap instead of backing off from collision", () => {
    const onManualCartonUpdate = vi.fn();
    const setManualHint = vi.fn();

    const left: PackedCarton = {
      id: "left",
      typeId: "c2",
      title: "Left",
      x: 0,
      y: 100,
      z: 0,
      w: 155,
      l: 425,
      h: 135,
      weight: 12,
      color: "#43b66f",
    };

    const right: PackedCarton = {
      id: "right",
      typeId: "c2",
      title: "Right",
      x: 310,
      y: 100,
      z: 0,
      w: 155,
      l: 425,
      h: 135,
      weight: 12,
      color: "#43b66f",
    };

    const source: PackedCarton = {
      id: "moving",
      typeId: "c2",
      title: "Moving",
      x: 500,
      y: 100,
      z: 0,
      w: 155,
      l: 425,
      h: 135,
      weight: 12,
      color: "#43b66f",
    };

    const committed = commitManualCarton({
      carton: source,
      patch: { x: 153, y: 100, z: 0 },
      pallet: PALLET,
      manualMoveStepMm: 0,
      manualCollisionHint: "collision",
      manualCartons: [left, right, source],
      onManualCartonUpdate,
      setManualHint,
    });

    expect(committed).not.toBeNull();
    expect(onManualCartonUpdate).toHaveBeenCalledWith(source.id, expect.objectContaining({
      x: 155,
      y: 100,
      z: 0,
    }));
    expect(setManualHint).toHaveBeenCalledWith(null);
  });

  it("keeps a near-fit manual position unsnapped when auto align is disabled", () => {
    const onManualCartonUpdate = vi.fn();
    const setManualHint = vi.fn();

    const left: PackedCarton = {
      id: "left",
      typeId: "c2",
      title: "Left",
      x: 0,
      y: 100,
      z: 0,
      w: 155,
      l: 425,
      h: 135,
      weight: 12,
      color: "#43b66f",
    };

    const source: PackedCarton = {
      id: "moving",
      typeId: "c2",
      title: "Moving",
      x: 500,
      y: 100,
      z: 0,
      w: 155,
      l: 425,
      h: 135,
      weight: 12,
      color: "#43b66f",
    };

    const committed = commitManualCarton({
      carton: source,
      patch: { x: 156, y: 100, z: 0 },
      pallet: PALLET,
      manualMoveStepMm: 0,
      manualAutoAlignEnabled: false,
      manualCollisionHint: "collision",
      manualCartons: [left, source],
      onManualCartonUpdate,
      setManualHint,
    });

    expect(committed).not.toBeNull();
    expect(onManualCartonUpdate).toHaveBeenCalledWith(source.id, expect.objectContaining({
      x: 156,
      y: 100,
      z: 0,
    }));
    expect(setManualHint).toHaveBeenCalledWith(null);
  });

  it("allows a carton to remain fully outside the pallet for rearrangement", () => {
    const onManualCartonUpdate = vi.fn();
    const setManualHint = vi.fn();

    const committed = commitManualCarton({
      carton: CARTON,
      patch: { x: 820, y: 100, z: 0 },
      pallet: PALLET,
      manualMoveStepMm: 0,
      manualCollisionHint: "collision",
      manualCartons: [CARTON],
      onManualCartonUpdate,
      setManualHint,
    });

    expect(committed).not.toBeNull();
    expect(onManualCartonUpdate).toHaveBeenCalledWith(CARTON.id, expect.objectContaining({
      x: 820,
      y: 100,
      z: 0,
    }));
    expect(setManualHint).toHaveBeenCalledWith(null);
  });

  it("aligns a carton to the outer support edges below when explicitly requested", () => {
    const onManualCartonUpdate = vi.fn();
    const setManualHint = vi.fn();

    const supportLeft: PackedCarton = {
      id: "support-left",
      typeId: "c1",
      title: "Support left",
      x: 300,
      y: 800,
      z: 0,
      w: 200,
      l: 300,
      h: 150,
      weight: 4,
      color: "#43b66f",
    };

    const supportRight: PackedCarton = {
      id: "support-right",
      typeId: "c1",
      title: "Support right",
      x: 500,
      y: 800,
      z: 0,
      w: 200,
      l: 300,
      h: 150,
      weight: 4,
      color: "#43b66f",
    };

    const source: PackedCarton = {
      id: "bridge",
      typeId: "c1",
      title: "Bridge",
      x: 375,
      y: 770,
      z: 150,
      w: 300,
      l: 200,
      h: 150,
      weight: 4,
      color: "#43b66f",
    };

    const committed = commitManualCarton({
      carton: source,
      patch: { x: source.x, y: source.y, z: source.z },
      pallet: PALLET,
      manualMoveStepMm: 0,
      manualAutoAlignEnabled: false,
      forceSupportAlign: true,
      manualCollisionHint: "collision",
      manualCartons: [supportLeft, supportRight, source],
      onManualCartonUpdate,
      setManualHint,
    });

    expect(committed).not.toBeNull();
    expect(onManualCartonUpdate).toHaveBeenCalledWith(source.id, expect.objectContaining({
      x: 375,
      y: 800,
      z: 150,
    }));
    expect(setManualHint).toHaveBeenCalledWith(null);
  });

  it("aligns only the requested support axis", () => {
    const onManualCartonUpdate = vi.fn();
    const setManualHint = vi.fn();

    const supportLeft: PackedCarton = {
      id: "support-left",
      typeId: "c1",
      title: "Support left",
      x: 300,
      y: 800,
      z: 0,
      w: 200,
      l: 300,
      h: 150,
      weight: 4,
      color: "#43b66f",
    };

    const supportRight: PackedCarton = {
      id: "support-right",
      typeId: "c1",
      title: "Support right",
      x: 500,
      y: 800,
      z: 0,
      w: 200,
      l: 300,
      h: 150,
      weight: 4,
      color: "#43b66f",
    };

    const source: PackedCarton = {
      id: "bridge",
      typeId: "c1",
      title: "Bridge",
      x: 375,
      y: 770,
      z: 150,
      w: 300,
      l: 200,
      h: 150,
      weight: 4,
      color: "#43b66f",
    };

    const committed = commitManualCarton({
      carton: source,
      patch: { x: source.x, y: source.y, z: source.z },
      pallet: PALLET,
      manualMoveStepMm: 0,
      manualAutoAlignEnabled: false,
      forceSupportAlign: true,
      forceSupportAlignAxis: "y",
      manualCollisionHint: "collision",
      manualCartons: [supportLeft, supportRight, source],
      onManualCartonUpdate,
      setManualHint,
    });

    expect(committed).not.toBeNull();
    expect(onManualCartonUpdate).toHaveBeenCalledWith(source.id, expect.objectContaining({
      x: 375,
      y: 800,
      z: 150,
    }));
    expect(setManualHint).toHaveBeenCalledWith(null);
  });
});
