import React from "react";
import type { PackedCarton, PalletInput } from "../../lib/packer";
import * as THREE from "three";
import {
  BASE_H,
} from "./visualizerHelpers";
import {
  buildManualCandidateCarton,
  buildManualRotationPatch,
  hasMeaningfulTranslationProgress,
  type ManualPatch,
  resolveManualCollision,
} from "./manualCartonEditingCore";

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
    mesh.position.set(
      carton.x + carton.w / 2 - pallet.width / 2,
      carton.z + carton.h / 2 + BASE_H,
      carton.y + carton.l / 2 - pallet.length / 2,
    );
  }, [manualMeshRefs, pallet.length, pallet.width]);

  const tryCommitManualCarton = React.useCallback((
    carton: PackedCarton,
    patch: ManualPatch,
  ): boolean => {
    const candidate = buildManualCandidateCarton(carton, patch, manualMoveStepMm);
    if (!candidate) {
      setManualHint(manualCollisionHint);
      return false;
    }

    const { resolved, resolvedBySnap } = resolveManualCollision({
      source: carton,
      candidate,
      manualCartons,
      patch,
    });
    if (!resolved) {
      setManualHint(manualCollisionHint);
      return false;
    }

    if (resolvedBySnap && !hasMeaningfulTranslationProgress(carton, resolved)) {
      setManualHint(manualCollisionHint);
      return false;
    }

    onManualCartonUpdate(carton.id, {
      x: resolved.x,
      y: resolved.y,
      z: resolved.z,
      w: resolved.w,
      l: resolved.l,
      h: resolved.h,
    });
    setManualHint(null);
    return true;
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
    if (!Number.isFinite(mesh.position.x) || !Number.isFinite(mesh.position.y) || !Number.isFinite(mesh.position.z)) {
      setManualHint(manualCollisionHint);
      resetManualMeshPosition(source);
      manualDragStartRef.current = null;
      return;
    }

    const nextX = mesh.position.x + pallet.width / 2 - source.w / 2;
    const nextY = mesh.position.z + pallet.length / 2 - source.l / 2;
    const nextZ = mesh.position.y - BASE_H - source.h / 2;
    const committed = tryCommitManualCarton(source, { x: nextX, y: nextY, z: nextZ });
    if (!committed) {
      resetManualMeshPosition(source);
    }
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
    const minMeshY = BASE_H + selectedManualCarton.h / 2;
    if (mesh.position.y < minMeshY) {
      mesh.position.y = minMeshY;
    }
  }, [manualMeshRefs, mode, selectedManualCarton]);

  return {
    beginManualDrag,
    handleManualTransformEnd,
    handleManualAxisInput,
    handleManualRotate,
    clampDraggedMeshAbovePalletTop,
  };
}
