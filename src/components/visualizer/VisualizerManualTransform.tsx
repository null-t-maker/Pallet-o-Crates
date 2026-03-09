import React from "react";
import { TransformControls } from "@react-three/drei";
import type * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl, TransformControls as TransformControlsImpl } from "three-stdlib";
import type { PackedCarton } from "../../lib/packer";

interface VisualizerManualTransformProps {
  mode: "generation" | "manual";
  selectedManualCarton: PackedCarton | null;
  selectedManualMesh: THREE.Mesh | null;
  setTransformControlsRef: (control: TransformControlsImpl | null) => void;
  manualMoveStepMm: number;
  beginManualDrag: () => void;
  handleManualTransformEnd: () => void;
  clampDraggedMeshAbovePalletTop: () => void;
  orbitControlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}

export const VisualizerManualTransform: React.FC<VisualizerManualTransformProps> = ({
  mode,
  selectedManualCarton,
  selectedManualMesh,
  setTransformControlsRef,
  manualMoveStepMm,
  beginManualDrag,
  handleManualTransformEnd,
  clampDraggedMeshAbovePalletTop,
  orbitControlsRef,
}) => {
  if (!(mode === "manual" && selectedManualCarton && selectedManualMesh)) {
    return null;
  }

  return (
    <TransformControls
      ref={setTransformControlsRef}
      object={selectedManualMesh}
      mode="translate"
      showX
      showY
      showZ
      size={0.85}
      translationSnap={manualMoveStepMm > 0 ? manualMoveStepMm : undefined}
      onMouseDown={() => {
        beginManualDrag();
        if (orbitControlsRef.current) {
          orbitControlsRef.current.enabled = false;
        }
      }}
      onMouseUp={() => {
        if (orbitControlsRef.current) {
          orbitControlsRef.current.enabled = true;
        }
        handleManualTransformEnd();
      }}
      onObjectChange={clampDraggedMeshAbovePalletTop}
    />
  );
};
