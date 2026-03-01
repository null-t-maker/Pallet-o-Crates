import React from "react";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { WORKSPACE_LIMIT_MM } from "./visualizerHelpers";

interface UseVisualizerCameraArgs {
  mode: "generation" | "manual";
  maxDim: number;
  dynamicOrbitTargetY: number;
  sceneCenterX: number;
  sceneCenterZ: number;
}

export function useVisualizerCamera({
  mode,
  maxDim,
  dynamicOrbitTargetY,
  sceneCenterX,
  sceneCenterZ,
}: UseVisualizerCameraArgs): {
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
} {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const cameraRef = React.useRef<THREE.OrthographicCamera | null>(null);
  const orbitControlsRef = React.useRef<OrbitControlsImpl | null>(null);
  const baseZoomRef = React.useRef(1);
  const zoomFactorRef = React.useRef(1);
  const hasManualZoomRef = React.useRef(false);
  const syncCameraRef = React.useRef(false);
  const prevMaxDimRef = React.useRef<number | null>(null);
  const manualViewSeedRef = React.useRef<{ maxDim: number; orbitTargetY: number } | null>(null);
  const [viewportSize, setViewportSize] = React.useState({ width: 1200, height: 800 });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setViewportSize({
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (mode !== "manual") {
      manualViewSeedRef.current = null;
      return;
    }
    if (!manualViewSeedRef.current) {
      manualViewSeedRef.current = {
        maxDim,
        orbitTargetY: dynamicOrbitTargetY,
      };
    }
  }, [dynamicOrbitTargetY, maxDim, mode]);

  const manualViewSeed = manualViewSeedRef.current;
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

  const minViewportDim = Math.max(280, Math.min(viewportSize.width, viewportSize.height));
  const zoom = (minViewportDim * 0.95) / viewMaxDim;

  const cameraPosition = React.useMemo<[number, number, number]>(() => {
    const dist = viewMaxDim * 1.4;
    return [sceneCenterX + dist, dist, sceneCenterZ + dist];
  }, [sceneCenterX, sceneCenterZ, viewMaxDim]);

  const orbitTarget = React.useMemo<[number, number, number]>(() => {
    return [sceneCenterX, orbitTargetY, sceneCenterZ];
  }, [orbitTargetY, sceneCenterX, sceneCenterZ]);

  React.useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    const prevMaxDim = prevMaxDimRef.current;
    const sceneChanged = prevMaxDim !== null && Math.abs(prevMaxDim - viewMaxDim) > 1e-6;
    if (sceneChanged) {
      hasManualZoomRef.current = false;
      zoomFactorRef.current = 1;
    }

    baseZoomRef.current = zoom;
    const effectiveZoom = hasManualZoomRef.current
      ? zoom * zoomFactorRef.current
      : zoom;

    syncCameraRef.current = true;
    camera.zoom = Math.max(0.01, effectiveZoom);
    camera.updateProjectionMatrix();
    syncCameraRef.current = false;

    prevMaxDimRef.current = viewMaxDim;
  }, [viewMaxDim, zoom]);

  const handleControlsChange = React.useCallback(() => {
    if (syncCameraRef.current) return;
    const camera = cameraRef.current;
    if (!camera) return;

    const baseZoom = baseZoomRef.current;
    if (!Number.isFinite(baseZoom) || baseZoom <= 0) return;

    const nextFactor = camera.zoom / baseZoom;
    if (!Number.isFinite(nextFactor)) return;

    if (Math.abs(nextFactor - zoomFactorRef.current) > 1e-4) {
      hasManualZoomRef.current = true;
      zoomFactorRef.current = THREE.MathUtils.clamp(nextFactor, 0.05, 20);
    }
  }, []);

  return {
    containerRef,
    cameraRef,
    orbitControlsRef,
    cameraPosition,
    orbitTarget,
    cameraFar,
    gridSpan,
    gridDivisions,
    sceneVisualDim,
    handleControlsChange,
  };
}
