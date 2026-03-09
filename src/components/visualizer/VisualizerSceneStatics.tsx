import React from "react";
import { Edges, Environment } from "@react-three/drei";
import type { PackedPalletPlacement, PalletInput } from "../../lib/packer";
import { BASE_H, WOOD } from "./visualizerHelpers";

interface VisualizerSceneStaticsProps {
  pallet: PalletInput;
  basePallets: PackedPalletPlacement[];
  sceneCenterX: number;
  sceneCenterZ: number;
  sceneVisualDim: number;
  gridSpan: number;
  gridDivisions: number;
}

export const VisualizerSceneStatics: React.FC<VisualizerSceneStaticsProps> = ({
  pallet,
  basePallets,
  sceneCenterX,
  sceneCenterZ,
  sceneVisualDim,
  gridSpan,
  gridDivisions,
}) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[sceneCenterX + sceneVisualDim * 2, sceneVisualDim * 3, sceneCenterZ + sceneVisualDim]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <Environment preset="warehouse" />
      <gridHelper args={[gridSpan, gridDivisions, "#2f2f2f", "#181818"]} position={[sceneCenterX, -1, sceneCenterZ]} />

      {basePallets.map((placed) => (
        <mesh key={`pallet-${placed.index}`} position={[placed.offsetX, BASE_H / 2, placed.offsetY]} castShadow receiveShadow>
          <boxGeometry args={[pallet.width, BASE_H, pallet.length]} />
          <meshStandardMaterial color={WOOD} roughness={0.85} />
          <Edges scale={1.002} threshold={15} color="#7a5c3a" />
        </mesh>
      ))}
    </>
  );
};
