import type React from "react";
import type * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl, TransformControls as TransformControlsImpl } from "three-stdlib";
import type { PackedCarton, PackedPalletPlacement, PalletInput } from "../../lib/packer";
import type { CartonBoxSceneEntry } from "./CartonBox";

export interface VisualizerCanvasSceneProps {
  pallet: PalletInput;
  basePallets: PackedPalletPlacement[];
  sceneCartons: CartonBoxSceneEntry[];
  mode: "generation" | "manual";
  selectedId: string | null;
  onHover: (carton: PackedCarton | null) => void;
  onSelectCarton: (id: string) => void;
  manualMeshRefs: React.MutableRefObject<Record<string, THREE.Mesh | null>>;
  selectedManualCarton: PackedCarton | null;
  selectedManualMesh: THREE.Mesh | null;
  setTransformControlsRef: (control: TransformControlsImpl | null) => void;
  manualMoveStepMm: number;
  beginManualDrag: () => void;
  handleManualTransformEnd: () => void;
  clampDraggedMeshAbovePalletTop: () => void;
  orbitControlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  cameraRef: React.MutableRefObject<THREE.OrthographicCamera | null>;
  cameraPosition: [number, number, number];
  cameraFar: number;
  orbitTarget: [number, number, number];
  handleControlsChange: () => void;
  sceneCenterX: number;
  sceneCenterZ: number;
  sceneVisualDim: number;
  gridSpan: number;
  gridDivisions: number;
}
