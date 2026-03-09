import type React from "react";
import type * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export interface UseVisualizerCameraArgs {
  mode: "generation" | "manual";
  maxDim: number;
  dynamicOrbitTargetY: number;
  sceneCenterX: number;
  sceneCenterZ: number;
}

export interface UseVisualizerCameraResult {
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  cameraRef: React.MutableRefObject<THREE.OrthographicCamera | null>;
  orbitControlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  cameraPosition: [number, number, number];
  orbitTarget: [number, number, number];
  cameraFar: number;
  gridSpan: number;
  gridDivisions: number;
  sceneVisualDim: number;
  handleControlsChange: () => void;
}
