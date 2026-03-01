import * as THREE from "three";
import { TransformControls as TransformControlsImpl } from "three-stdlib";

type RuntimeTransformControl = {
  __palletOutwardPatched?: boolean;
  gizmo?: {
    gizmo?: {
      translate?: {
        children?: Array<THREE.Object3D & { tag?: string }>;
      };
    };
  };
};

function isMeshHandle(handle: THREE.Object3D): handle is THREE.Mesh {
  return (handle as THREE.Mesh).isMesh === true;
}

export function patchTransformControlsOutwardGizmo(control: TransformControlsImpl | null): void {
  if (!control) return;
  const withInternal = control as unknown as RuntimeTransformControl;
  if (withInternal.__palletOutwardPatched) return;

  const handles = withInternal.gizmo?.gizmo?.translate?.children;
  if (!handles || handles.length === 0) return;

  for (const axis of ["X", "Y", "Z"] as const) {
    const forward = handles.find((handle) => handle.name === axis && handle.tag === "fwd");
    const backward = handles.find((handle) => handle.name === axis && handle.tag === "bwd");
    if (!forward || !backward) continue;
    if (!isMeshHandle(forward) || !isMeshHandle(backward)) continue;
    // Keep built-in flip logic, but make backward arrow geometry outward-facing too.
    backward.geometry = forward.geometry.clone();
    backward.updateMatrix();
  }

  withInternal.__palletOutwardPatched = true;
}
