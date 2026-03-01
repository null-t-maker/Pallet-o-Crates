import React from "react";
import * as THREE from "three";
import { TransformControls as TransformControlsImpl } from "three-stdlib";
import { patchTransformControlsOutwardGizmo } from "./visualizerHelpers";

type WorkflowMode = "generation" | "manual";

interface UseVisualizerTransformControlsArgs {
  mode: WorkflowMode;
  selectedId: string | null;
  selectedManualMesh: THREE.Mesh | null;
}

interface UseVisualizerTransformControlsResult {
  transformControlsRef: React.MutableRefObject<TransformControlsImpl | null>;
  setTransformControlsRef: (control: TransformControlsImpl | null) => void;
}

export function useVisualizerTransformControls({
  mode,
  selectedId,
  selectedManualMesh,
}: UseVisualizerTransformControlsArgs): UseVisualizerTransformControlsResult {
  const transformControlsRef = React.useRef<TransformControlsImpl | null>(null);

  const setTransformControlsRef = React.useCallback((control: TransformControlsImpl | null) => {
    transformControlsRef.current = control;
    if (mode === "manual" && control) {
      patchTransformControlsOutwardGizmo(control);
    }
  }, [mode]);

  React.useEffect(() => {
    if (mode !== "manual") return;
    patchTransformControlsOutwardGizmo(transformControlsRef.current);
  }, [mode, selectedId, selectedManualMesh]);

  return {
    transformControlsRef,
    setTransformControlsRef,
  };
}
