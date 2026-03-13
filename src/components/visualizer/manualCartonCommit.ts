import type { PackedCarton, PalletInput } from "../../lib/packer";
import {
  alignCandidateToSupportEdges,
  buildManualCandidateCarton,
  hasMeaningfulTranslationProgress,
  resolveManualCollision,
  type ManualPatch,
} from "./manualCartonEditingCore";
import { clampPatchInsidePalletIfPartiallyOverlapping } from "./manualCartonTransformEnd";

interface CommitManualCartonArgs {
  carton: PackedCarton;
  patch: ManualPatch;
  pallet?: PalletInput;
  manualMoveStepMm: number;
  manualAutoAlignEnabled?: boolean;
  ignoreCollisions?: boolean;
  forceSupportAlign?: boolean;
  forceSupportAlignAxis?: "x" | "y";
  manualCollisionHint: string;
  manualCartons: PackedCarton[];
  onManualCartonUpdate: (id: string, next: ManualPatch) => void;
  setManualHint: (value: string | null) => void;
}

export function commitManualCarton({
  carton,
  patch,
  pallet,
  manualMoveStepMm,
  manualAutoAlignEnabled = true,
  ignoreCollisions = false,
  forceSupportAlign = false,
  forceSupportAlignAxis,
  manualCollisionHint,
  manualCartons,
  onManualCartonUpdate,
  setManualHint,
}: CommitManualCartonArgs): PackedCarton | null {
  let candidate = buildManualCandidateCarton(carton, patch, manualMoveStepMm);
  if (!candidate) {
    setManualHint(manualCollisionHint);
    return null;
  }

  if (pallet) {
    const clamped = clampPatchInsidePalletIfPartiallyOverlapping(
      { x: candidate.x, y: candidate.y, z: candidate.z },
      candidate,
      pallet,
    );
    candidate = {
      ...candidate,
      x: clamped.x ?? candidate.x,
      y: clamped.y ?? candidate.y,
      z: clamped.z ?? candidate.z,
    };
  }

  if (forceSupportAlign) {
    candidate = alignCandidateToSupportEdges(candidate, manualCartons, carton.id, pallet, forceSupportAlignAxis);
  }

  const { resolved, resolvedBySnap } = resolveManualCollision({
    source: carton,
    candidate,
    manualCartons,
    patch,
    pallet,
    autoAlignEnabled: manualAutoAlignEnabled,
    ignoreCollisions,
  });
  if (!resolved) {
    setManualHint(manualCollisionHint);
    return null;
  }

  if (resolvedBySnap && !hasMeaningfulTranslationProgress(carton, resolved)) {
    setManualHint(manualCollisionHint);
    return null;
  }

  onManualCartonUpdate(carton.id, {
    x: resolved.x,
    y: resolved.y,
    z: resolved.z,
    w: resolved.w,
    l: resolved.l,
    h: resolved.h,
  });
  setManualHint(null);
  return resolved;
}
