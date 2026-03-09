import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { VisualizerCartonLayer } from "./VisualizerCartonLayer";
import { VisualizerManualTransform } from "./VisualizerManualTransform";
import { VisualizerSceneStatics } from "./VisualizerSceneStatics";
import type { VisualizerCanvasSceneProps } from "./VisualizerCanvasScene.types";

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

      <VisualizerSceneStatics
        pallet={pallet}
        basePallets={basePallets}
        sceneCenterX={sceneCenterX}
        sceneCenterZ={sceneCenterZ}
        sceneVisualDim={sceneVisualDim}
        gridSpan={gridSpan}
        gridDivisions={gridDivisions}
      />

      <VisualizerCartonLayer
        pallet={pallet}
        sceneCartons={sceneCartons}
        mode={mode}
        selectedId={selectedId}
        onHover={onHover}
        onSelectCarton={onSelectCarton}
        manualMeshRefs={manualMeshRefs}
      />

      <VisualizerManualTransform
        mode={mode}
        selectedManualCarton={selectedManualCarton}
        selectedManualMesh={selectedManualMesh}
        setTransformControlsRef={setTransformControlsRef}
        manualMoveStepMm={manualMoveStepMm}
        beginManualDrag={beginManualDrag}
        handleManualTransformEnd={handleManualTransformEnd}
        clampDraggedMeshAbovePalletTop={clampDraggedMeshAbovePalletTop}
        orbitControlsRef={orbitControlsRef}
      />
    </Canvas>
  );
};
