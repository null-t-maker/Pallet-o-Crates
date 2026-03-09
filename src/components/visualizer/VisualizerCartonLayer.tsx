import React from "react";
import type * as THREE from "three";
import type { PackedCarton, PalletInput } from "../../lib/packer";
import { CartonBox, type CartonBoxSceneEntry } from "./CartonBox";

interface VisualizerCartonLayerProps {
  pallet: PalletInput;
  sceneCartons: CartonBoxSceneEntry[];
  mode: "generation" | "manual";
  selectedId: string | null;
  onHover: (carton: PackedCarton | null) => void;
  onSelectCarton: (id: string) => void;
  manualMeshRefs: React.MutableRefObject<Record<string, THREE.Mesh | null>>;
}

export const VisualizerCartonLayer: React.FC<VisualizerCartonLayerProps> = ({
  pallet,
  sceneCartons,
  mode,
  selectedId,
  onHover,
  onSelectCarton,
  manualMeshRefs,
}) => {
  return (
    <>
      {sceneCartons.map((entry) => (
        <CartonBox
          key={entry.carton.id}
          c={entry}
          pw={pallet.width}
          pl={pallet.length}
          selected={selectedId === entry.carton.id}
          onHover={onHover}
          onSelect={(carton) => onSelectCarton(carton.id)}
          meshRef={mode === "manual" ? ((mesh) => {
            if (mesh) {
              manualMeshRefs.current[entry.carton.id] = mesh;
            } else {
              delete manualMeshRefs.current[entry.carton.id];
            }
          }) : undefined}
        />
      ))}
    </>
  );
};
