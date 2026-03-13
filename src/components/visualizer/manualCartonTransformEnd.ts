import type { PackedCarton, PalletInput } from "../../lib/packer";
import type * as THREE from "three";
import type { ManualPatch } from "./manualCartonEditingCore";
import { buildTranslationPatchFromMesh } from "./manualCartonMeshOps";
import { clampValue } from "./visualizerHelpers";

type TryCommitManualCarton = (carton: PackedCarton, patch: ManualPatch) => PackedCarton | null;

interface HandleManualTransformFromMeshArgs {
  mesh: THREE.Mesh;
  source: PackedCarton;
  pallet: PalletInput;
  manualCollisionHint: string;
  setManualHint: (value: string | null) => void;
  tryCommitManualCarton: TryCommitManualCarton;
  resetManualMeshPosition: (carton: PackedCarton) => void;
}

const EPS = 1e-6;

export function clampPatchInsidePalletIfPartiallyOverlapping(
  patch: ManualPatch,
  source: PackedCarton,
  pallet: PalletInput,
): ManualPatch {
  const x = patch.x ?? source.x;
  const y = patch.y ?? source.y;
  const right = x + source.w;
  const top = y + source.l;

  const overlapWidth = Math.min(right, pallet.width) - Math.max(x, 0);
  const overlapLength = Math.min(top, pallet.length) - Math.max(y, 0);
  const stillTouchesPallet = overlapWidth > EPS && overlapLength > EPS;
  if (!stillTouchesPallet) return patch;

  let clampedX = x;
  let clampedY = y;
  if (source.w <= pallet.width + EPS) {
    clampedX = clampValue(x, 0, pallet.width - source.w);
  }
  if (source.l <= pallet.length + EPS) {
    clampedY = clampValue(y, 0, pallet.length - source.l);
  }

  if (Math.abs(clampedX - x) <= EPS && Math.abs(clampedY - y) <= EPS) {
    return patch;
  }

  return {
    ...patch,
    x: clampedX,
    y: clampedY,
  };
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
  const rawPatch = buildTranslationPatchFromMesh(mesh, source, pallet);
  const patch = rawPatch
    ? clampPatchInsidePalletIfPartiallyOverlapping(rawPatch, source, pallet)
    : null;
  if (!patch) {
    setManualHint(manualCollisionHint);
    resetManualMeshPosition(source);
    return;
  }

  const committed = tryCommitManualCarton(source, patch);
  if (!committed) {
    resetManualMeshPosition(source);
    return;
  }
  resetManualMeshPosition(committed);
}
