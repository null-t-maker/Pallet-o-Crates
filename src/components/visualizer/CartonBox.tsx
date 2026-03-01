import React from "react";
import { Edges } from "@react-three/drei";
import type { PackedCarton } from "../../lib/packer";
import * as THREE from "three";
import { BASE_H, displayCartonColor } from "./visualizerHelpers";

export interface CartonBoxSceneEntry {
  carton: PackedCarton;
  offsetX: number;
  offsetY: number;
}

export const CartonBox: React.FC<{
  c: CartonBoxSceneEntry;
  pw: number;
  pl: number;
  selected: boolean;
  onHover: (c: PackedCarton | null) => void;
  onSelect: (c: PackedCarton) => void;
  meshRef?: (mesh: THREE.Mesh | null) => void;
}> = ({ c, pw, pl, selected, onHover, onSelect, meshRef }) => {
  const [hovered, setHovered] = React.useState(false);
  const carton = c.carton;
  const col = new THREE.Color(displayCartonColor(carton.color));
  const selectedCol = col.clone().lerp(new THREE.Color("#ffffff"), 0.3);
  const highlighted = hovered || selected;

  const px = carton.x + carton.w / 2 - pw / 2 + c.offsetX;
  const py = carton.z + carton.h / 2 + BASE_H;
  const pz = carton.y + carton.l / 2 - pl / 2 + c.offsetY;

  return (
    <mesh
      ref={meshRef}
      position={[px, py, pz]}
      castShadow
      receiveShadow
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(carton); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onHover(null); }}
      onClick={(e) => { e.stopPropagation(); onSelect(carton); }}
    >
      <boxGeometry args={[carton.w, carton.h, carton.l]} />
      <meshStandardMaterial
        color={selected ? selectedCol : col}
        roughness={selected ? 0.5 : 0.65}
        metalness={selected ? 0.08 : 0.05}
        emissive={selected ? selectedCol : highlighted ? col : new THREE.Color(0x000000)}
        emissiveIntensity={selected ? 0.62 : highlighted ? 0.35 : 0}
      />
      <Edges
        scale={1.002}
        threshold={15}
        color={selected ? displayCartonColor(carton.color) : hovered ? "#ffffff" : "#111111"}
      />
    </mesh>
  );
};
