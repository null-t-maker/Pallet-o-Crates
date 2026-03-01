import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera, OrbitControls, Edges, Environment, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import { TransformControls as TransformControlsImpl, OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { PackedCarton, PackedPalletPlacement, PalletInput } from "../../lib/packer";
import { CartonBox, type CartonBoxSceneEntry } from "./CartonBox";
import { BASE_H, WOOD } from "./visualizerHelpers";

interface VisualizerCanvasSceneProps {
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

export const VisualizerCanvasScene: React.FC<VisualizerCanvasSceneProps> = ({
  pallet,
  basePallets,
  sceneCartons,
  mode,
  selectedId,
  onHover,
  onSelectCarton,
  manualMeshRefs,
  selectedManualCarton,
  selectedManualMesh,
  setTransformControlsRef,
  manualMoveStepMm,
  beginManualDrag,
  handleManualTransformEnd,
  clampDraggedMeshAbovePalletTop,
  orbitControlsRef,
  cameraRef,
  cameraPosition,
  cameraFar,
  orbitTarget,
  handleControlsChange,
  sceneCenterX,
  sceneCenterZ,
  sceneVisualDim,
  gridSpan,
  gridDivisions,
}) => {
  return (
    <Canvas shadows={{ type: THREE.PCFShadowMap }}>
      <OrthographicCamera
        ref={cameraRef}
        makeDefault
        position={cameraPosition}
        near={0.1}
        far={cameraFar}
      />
      <OrbitControls
        ref={orbitControlsRef}
        makeDefault
        target={orbitTarget}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2 - 0.05}
        onChange={handleControlsChange}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.ROTATE,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />

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

      {mode === "manual" && selectedManualCarton && selectedManualMesh && (
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
      )}
    </Canvas>
  );
};
