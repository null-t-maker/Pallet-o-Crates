import { WORKSPACE_LIMIT_MM } from "./visualizerHelpers";

interface CameraMetricsInput {
  mode: "generation" | "manual";
  maxDim: number;
  dynamicOrbitTargetY: number;
  sceneCenterX: number;
  sceneCenterZ: number;
  viewportWidth: number;
  viewportHeight: number;
  manualViewSeed: { maxDim: number; orbitTargetY: number } | null;
}

interface CameraMetricsOutput {
  viewMaxDim: number;
  orbitTargetY: number;
  sceneVisualDim: number;
  gridSpan: number;
  gridDivisions: number;
  cameraFar: number;
  zoom: number;
  cameraPosition: [number, number, number];
  orbitTarget: [number, number, number];
}

export function computeVisualizerCameraMetrics({
  mode,
  maxDim,
  dynamicOrbitTargetY,
  sceneCenterX,
  sceneCenterZ,
  viewportWidth,
  viewportHeight,
  manualViewSeed,
}: CameraMetricsInput): CameraMetricsOutput {
  const viewMaxDim = mode === "manual"
    ? (manualViewSeed?.maxDim ?? maxDim)
    : maxDim;
  const orbitTargetY = mode === "manual"
    ? (manualViewSeed?.orbitTargetY ?? dynamicOrbitTargetY)
    : dynamicOrbitTargetY;
  const sceneVisualDim = mode === "manual" ? viewMaxDim : maxDim;
  const manualWorkspaceSpan = WORKSPACE_LIMIT_MM * 2;
  const gridSpan = mode === "manual"
    ? Math.max(sceneVisualDim * 6, manualWorkspaceSpan)
    : sceneVisualDim * 6;
  const gridDivisions = mode === "manual" && gridSpan >= manualWorkspaceSpan ? 80 : 40;
  const cameraFar = mode === "manual"
    ? Math.max(80000, sceneVisualDim * 24, WORKSPACE_LIMIT_MM * 4)
    : Math.max(20000, sceneVisualDim * 12);

  const minViewportDim = Math.max(280, Math.min(viewportWidth, viewportHeight));
  const zoom = (minViewportDim * 0.95) / viewMaxDim;
  const dist = viewMaxDim * 1.4;
  const cameraPosition: [number, number, number] = [sceneCenterX + dist, dist, sceneCenterZ + dist];
  const orbitTarget: [number, number, number] = [sceneCenterX, orbitTargetY, sceneCenterZ];

  return {
    viewMaxDim,
    orbitTargetY,
    sceneVisualDim,
    gridSpan,
    gridDivisions,
    cameraFar,
    zoom,
    cameraPosition,
    orbitTarget,
  };
}
