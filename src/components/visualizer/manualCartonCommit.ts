import type { PackedCarton } from "../../lib/packer";
import {
  buildManualCandidateCarton,
  hasMeaningfulTranslationProgress,
  resolveManualCollision,
  type ManualPatch,
} from "./manualCartonEditingCore";

interface CommitManualCartonArgs {
  carton: PackedCarton;
  patch: ManualPatch;
  manualMoveStepMm: number;
  manualCollisionHint: string;
  manualCartons: PackedCarton[];
  onManualCartonUpdate: (id: string, next: ManualPatch) => void;
  setManualHint: (value: string | null) => void;
}

export function commitManualCarton({
  carton,
  patch,
  manualMoveStepMm,
  manualCollisionHint,
  manualCartons,
  onManualCartonUpdate,
  setManualHint,
}: CommitManualCartonArgs): boolean {
  const candidate = buildManualCandidateCarton(carton, patch, manualMoveStepMm);
  if (!candidate) {
    setManualHint(manualCollisionHint);
    return false;
  }

  const { resolved, resolvedBySnap } = resolveManualCollision({
    source: carton,
    candidate,
    manualCartons,
    patch,
  });
  if (!resolved) {
    setManualHint(manualCollisionHint);
    return false;
  }

  if (resolvedBySnap && !hasMeaningfulTranslationProgress(carton, resolved)) {
    setManualHint(manualCollisionHint);
    return false;
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
  return true;
}
