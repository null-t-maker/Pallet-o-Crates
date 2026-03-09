import React from "react";
import type { PackedCarton, PalletInput } from "../../lib/packer";
import * as THREE from "three";
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
  setManualHint,
  onManualCartonUpdate,
  manualMeshRefs,
}: UseManualCartonEditingArgs) {
  const manualDragStartRef = React.useRef<PackedCarton | null>(null);

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
  ): boolean => {
    return commitManualCarton({
      carton,
      patch,
      manualMoveStepMm,
      manualCollisionHint,
      manualCartons,
      onManualCartonUpdate,
      setManualHint: (value) => {
        setManualHint(value);
      },
    });
  }, [manualCartons, manualCollisionHint, manualMoveStepMm, onManualCartonUpdate, setManualHint]);

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
    }
  }, [mode, resetManualMeshPosition, selectedManualCarton, tryCommitManualCarton]);

  const handleManualRotate = React.useCallback((plane: "xy" | "xz" | "yz") => {
    if (mode !== "manual" || !selectedManualCarton) return;

    const committed = tryCommitManualCarton(
      selectedManualCarton,
      buildManualRotationPatch(selectedManualCarton, plane),
    );
    if (!committed) {
      resetManualMeshPosition(selectedManualCarton);
    }
  }, [mode, resetManualMeshPosition, selectedManualCarton, tryCommitManualCarton]);

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
    handleManualRotate,
    clampDraggedMeshAbovePalletTop,
  };
}
