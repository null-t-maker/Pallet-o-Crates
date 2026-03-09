import type { PackedCarton, PalletInput } from "../../lib/packer";
import type * as THREE from "three";
import type { ManualPatch } from "./manualCartonEditingCore";
import { buildTranslationPatchFromMesh } from "./manualCartonMeshOps";

type TryCommitManualCarton = (carton: PackedCarton, patch: ManualPatch) => boolean;

interface HandleManualTransformFromMeshArgs {
  mesh: THREE.Mesh;
  source: PackedCarton;
  pallet: PalletInput;
  manualCollisionHint: string;
  setManualHint: (value: string | null) => void;
  tryCommitManualCarton: TryCommitManualCarton;
  resetManualMeshPosition: (carton: PackedCarton) => void;
}

export function handleManualTransformFromMesh({
  mesh,
  source,
  pallet,
  manualCollisionHint,
  setManualHint,
  tryCommitManualCarton,
  resetManualMeshPosition,
}: HandleManualTransformFromMeshArgs): void {
  const patch = buildTranslationPatchFromMesh(mesh, source, pallet);
  if (!patch) {
    setManualHint(manualCollisionHint);
    resetManualMeshPosition(source);
    return;
  }

  const committed = tryCommitManualCarton(source, patch);
  if (!committed) {
    resetManualMeshPosition(source);
  }
}
