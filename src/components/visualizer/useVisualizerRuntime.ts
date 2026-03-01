import React from "react";
import * as THREE from "three";
import { useManualCartonEditing } from "./useManualCartonEditing";
import { useVisualizerCamera } from "./useVisualizerCamera";
import { useVisualizerSceneState } from "./useVisualizerSceneState";
import { useVisualizerSelectionState } from "./useVisualizerSelectionState";
import { useVisualizerTransformControls } from "./useVisualizerTransformControls";
import type { VisualizerProps } from "./visualizerTypes";

export function useVisualizerRuntime({
  pallet,
  result,
  visibleLayers,
  t,
  mode,
  manualCartons,
  onManualCartonUpdate,
}: VisualizerProps) {
  const {
    hovered,
    setHovered,
    selectedId,
    setSelectedId,
    manualMoveStepMm,
    setManualMoveStepMm,
    manualHint,
    setManualHint,
  } = useVisualizerSelectionState({ mode });

  const manualMeshRefs = React.useRef<Record<string, THREE.Mesh | null>>({});

  const sceneState = useVisualizerSceneState({
    mode,
    result,
    visibleLayers,
    pallet,
    manualCartons,
    selectedId,
    t,
  });

  const selectedManualMesh = selectedId ? manualMeshRefs.current[selectedId] ?? null : null;
  const { setTransformControlsRef } = useVisualizerTransformControls({
    mode,
    selectedId,
    selectedManualMesh,
  });

  const cameraState = useVisualizerCamera({
    mode,
    maxDim: sceneState.maxDim,
    dynamicOrbitTargetY: sceneState.dynamicOrbitTargetY,
    sceneCenterX: sceneState.sceneCenterX,
    sceneCenterZ: sceneState.sceneCenterZ,
  });

  const manualEditing = useManualCartonEditing({
    mode,
    pallet,
    manualCartons,
    selectedManualCarton: sceneState.selectedManualCarton,
    manualMoveStepMm,
    manualCollisionHint: sceneState.manualCollisionHint,
    setManualHint,
    onManualCartonUpdate,
    manualMeshRefs,
  });

  React.useEffect(() => {
    if (!selectedId) return;
    if (!sceneState.selectedCarton) {
      setSelectedId(null);
    }
  }, [selectedId, sceneState.selectedCarton, setSelectedId]);

  return {
    hovered,
    setHovered,
    selectedId,
    setSelectedId,
    manualMoveStepMm,
    setManualMoveStepMm,
    manualHint,
    manualMeshRefs,
    sceneState,
    selectedManualMesh,
    setTransformControlsRef,
    cameraState,
    manualEditing,
  };
}
