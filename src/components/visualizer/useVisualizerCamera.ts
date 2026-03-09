import React from "react";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { computeVisualizerCameraMetrics } from "./visualizerCameraMetrics";
import type { UseVisualizerCameraArgs, UseVisualizerCameraResult } from "./useVisualizerCameraTypes";

export function useVisualizerCamera({
  mode,
  maxDim,
  dynamicOrbitTargetY,
  sceneCenterX,
  sceneCenterZ,
}: UseVisualizerCameraArgs): UseVisualizerCameraResult {
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
  const {
    viewMaxDim,
    sceneVisualDim,
    gridSpan,
    gridDivisions,
    cameraFar,
    zoom,
    cameraPosition,
    orbitTarget,
  } = React.useMemo(
    () => computeVisualizerCameraMetrics({
      mode,
      maxDim,
      dynamicOrbitTargetY,
      sceneCenterX,
      sceneCenterZ,
      viewportWidth: viewportSize.width,
      viewportHeight: viewportSize.height,
      manualViewSeed,
    }),
    [
      dynamicOrbitTargetY,
      manualViewSeed,
      maxDim,
      mode,
      sceneCenterX,
      sceneCenterZ,
      viewportSize.height,
      viewportSize.width,
    ],
  );

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
