import React from "react";
import type { PackedCarton, PalletInput } from "../../lib/packer";
import * as THREE from "three";
import { hasAnyManualCartonOverlap } from "../../lib/manualCartonOverlap";
import {
  buildManualRotationPatch,
  type ManualPatch,
} from "./manualCartonEditingCore";
import { commitManualCarton } from "./manualCartonCommit";
import {
  clampMeshAbovePalletTop,
  setMeshPositionFromCarton,
} from "./manualCartonMeshOps";
import { handleManualTransformFromMesh } from "./manualCartonTransformEnd";

interface UseManualCartonEditingArgs {
  mode: "generation" | "manual";
  pallet: PalletInput;
  manualCartons: PackedCarton[];
  selectedManualCarton: PackedCarton | null;
  manualMoveStepMm: number;
  manualCollisionHint: string;
  manualShadowModeBlockedHint: string;
  manualShadowModeEnabled: boolean;
  setManualShadowModeEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setManualHint: React.Dispatch<React.SetStateAction<string | null>>;
  onManualCartonUpdate: (id: string, next: ManualPatch) => void;
  manualMeshRefs: React.MutableRefObject<Record<string, THREE.Mesh | null>>;
}

export function useManualCartonEditing({
  mode,
  pallet,
  manualCartons,
  selectedManualCarton,
  manualMoveStepMm,
  manualCollisionHint,
  manualShadowModeBlockedHint,
  manualShadowModeEnabled,
  setManualShadowModeEnabled,
  setManualHint,
  onManualCartonUpdate,
  manualMeshRefs,
}: UseManualCartonEditingArgs) {
  const manualDragStartRef = React.useRef<PackedCarton | null>(null);

  React.useEffect(() => {
    if (mode !== "manual") return;
    for (const carton of manualCartons) {
      const mesh = manualMeshRefs.current[carton.id];
      if (!mesh) continue;
      setMeshPositionFromCarton(mesh, carton, pallet);
    }
  }, [manualCartons, manualMeshRefs, mode, pallet, pallet.length, pallet.width]);

  const beginManualDrag = React.useCallback(() => {
    if (mode !== "manual" || !selectedManualCarton) return;
    manualDragStartRef.current = { ...selectedManualCarton };
    setManualHint(null);
  }, [mode, selectedManualCarton, setManualHint]);

  const resetManualMeshPosition = React.useCallback((carton: PackedCarton) => {
    const mesh = manualMeshRefs.current[carton.id];
    if (!mesh) return;
    setMeshPositionFromCarton(mesh, carton, pallet);
  }, [manualMeshRefs, pallet.length, pallet.width]);

  const tryCommitManualCarton = React.useCallback((
    carton: PackedCarton,
    patch: ManualPatch,
  ): PackedCarton | null => {
    return commitManualCarton({
      carton,
      patch,
      pallet,
      manualMoveStepMm,
      manualAutoAlignEnabled: !manualShadowModeEnabled,
      ignoreCollisions: manualShadowModeEnabled,
      manualCollisionHint,
      manualCartons,
      onManualCartonUpdate,
      setManualHint: (value) => {
        setManualHint(value);
      },
    });
  }, [manualCartons, manualCollisionHint, manualMoveStepMm, manualShadowModeEnabled, onManualCartonUpdate, pallet, setManualHint]);

  const handleManualTransformEnd = React.useCallback(() => {
    if (mode !== "manual" || !selectedManualCarton) return;
    const mesh = manualMeshRefs.current[selectedManualCarton.id];
    if (!mesh) {
      manualDragStartRef.current = null;
      return;
    }

    const source = manualDragStartRef.current && manualDragStartRef.current.id === selectedManualCarton.id
      ? manualDragStartRef.current
      : selectedManualCarton;
    handleManualTransformFromMesh({
      mesh,
      source,
      pallet,
      manualCollisionHint,
      setManualHint,
      tryCommitManualCarton,
      resetManualMeshPosition,
    });
    manualDragStartRef.current = null;
  }, [
    manualCollisionHint,
    manualMeshRefs,
    mode,
    pallet.length,
    pallet.width,
    resetManualMeshPosition,
    selectedManualCarton,
    setManualHint,
    tryCommitManualCarton,
  ]);

  const handleManualAxisInput = React.useCallback((axis: "x" | "y" | "z", rawValue: string) => {
    if (mode !== "manual" || !selectedManualCarton) return;
    const parsed = Number.parseFloat(rawValue);
    if (!Number.isFinite(parsed)) return;
    const committed = tryCommitManualCarton(selectedManualCarton, { [axis]: parsed });
    if (!committed) {
      resetManualMeshPosition(selectedManualCarton);
      return;
    }
    resetManualMeshPosition(committed);
  }, [mode, resetManualMeshPosition, selectedManualCarton, tryCommitManualCarton]);

  const handleManualAxisPatchInput = React.useCallback((patch: ManualPatch): boolean => {
    if (mode !== "manual" || !selectedManualCarton) return false;
    const committed = tryCommitManualCarton(selectedManualCarton, patch);
    if (!committed) {
      resetManualMeshPosition(selectedManualCarton);
      return false;
    }
    resetManualMeshPosition(committed);
    return true;
  }, [mode, resetManualMeshPosition, selectedManualCarton, tryCommitManualCarton]);

  const handleManualRotate = React.useCallback((plane: "xy" | "xz" | "yz") => {
    if (mode !== "manual" || !selectedManualCarton) return;

    const committed = tryCommitManualCarton(
      selectedManualCarton,
      buildManualRotationPatch(selectedManualCarton, plane),
    );
    if (!committed) {
      resetManualMeshPosition(selectedManualCarton);
      return;
    }
    resetManualMeshPosition(committed);
  }, [mode, resetManualMeshPosition, selectedManualCarton, tryCommitManualCarton]);

  const handleManualAlignToSupportAxis = React.useCallback((axis: "x" | "y") => {
    if (mode !== "manual" || !selectedManualCarton) return;
    const committed = commitManualCarton({
      carton: selectedManualCarton,
      patch: {
        x: selectedManualCarton.x,
        y: selectedManualCarton.y,
        z: selectedManualCarton.z,
      },
      pallet,
      manualMoveStepMm,
      manualAutoAlignEnabled: true,
      ignoreCollisions: manualShadowModeEnabled,
      forceSupportAlign: true,
      forceSupportAlignAxis: axis,
      manualCollisionHint,
      manualCartons,
      onManualCartonUpdate,
      setManualHint: (value) => {
        setManualHint(value);
      },
    });
    if (!committed) {
      resetManualMeshPosition(selectedManualCarton);
      return;
    }
    resetManualMeshPosition(committed);
  }, [
    manualCartons,
    manualCollisionHint,
    manualMoveStepMm,
    manualShadowModeEnabled,
    mode,
    onManualCartonUpdate,
    pallet,
    resetManualMeshPosition,
    selectedManualCarton,
    setManualHint,
  ]);

  const handleManualAlignToSupportEdgeX = React.useCallback(() => {
    handleManualAlignToSupportAxis("x");
  }, [handleManualAlignToSupportAxis]);

  const handleManualAlignToSupportEdgeY = React.useCallback(() => {
    handleManualAlignToSupportAxis("y");
  }, [handleManualAlignToSupportAxis]);

  const handleManualShadowModeChange = React.useCallback((enabled: boolean) => {
    if (enabled === manualShadowModeEnabled) return true;
    if (!enabled && hasAnyManualCartonOverlap(manualCartons)) {
      setManualHint(manualShadowModeBlockedHint);
      return false;
    }
    setManualShadowModeEnabled(enabled);
    setManualHint(null);
    return true;
  }, [manualCartons, manualShadowModeBlockedHint, manualShadowModeEnabled, setManualHint, setManualShadowModeEnabled]);

  const clampDraggedMeshAbovePalletTop = React.useCallback(() => {
    if (mode !== "manual" || !selectedManualCarton) return;
    const mesh = manualMeshRefs.current[selectedManualCarton.id];
    if (!mesh) return;
    clampMeshAbovePalletTop(mesh, selectedManualCarton);
  }, [manualMeshRefs, mode, selectedManualCarton]);

  return {
    beginManualDrag,
    handleManualTransformEnd,
    handleManualAxisInput,
    handleManualAxisPatchInput,
    handleManualRotate,
    handleManualShadowModeChange,
    handleManualAlignToSupportEdgeX,
    handleManualAlignToSupportEdgeY,
    clampDraggedMeshAbovePalletTop,
  };
}
