import type { PackedCarton } from "../../lib/packer";
import {
  MIN_TRANSLATION_PROGRESS_MM,
  WORKSPACE_LIMIT_MM,
  clampValue,
  hasCartonCollision,
  isValidCartonGeometry,
  quantizeToStep,
  roundMm,
  snapTranslationToFreePosition,
} from "./visualizerHelpers";

export type ManualPatch = Partial<Pick<PackedCarton, "x" | "y" | "z" | "w" | "l" | "h">>;

interface CollisionResolutionArgs {
  source: PackedCarton;
  candidate: PackedCarton;
  manualCartons: PackedCarton[];
  patch: ManualPatch;
}

interface CollisionResolutionResult {
  resolved: PackedCarton | null;
  resolvedBySnap: boolean;
}

export function buildManualCandidateCarton(
  carton: PackedCarton,
  patch: ManualPatch,
  manualMoveStepMm: number,
): PackedCarton | null {
  const rawX = patch.x ?? carton.x;
  const rawY = patch.y ?? carton.y;
  const rawZ = patch.z ?? carton.z;
  const rawW = patch.w ?? carton.w;
  const rawL = patch.l ?? carton.l;
  const rawH = patch.h ?? carton.h;
  if (![rawX, rawY, rawZ, rawW, rawL, rawH].every((value) => Number.isFinite(value))) {
    return null;
  }

  const initial: PackedCarton = {
    ...carton,
    ...patch,
    x: roundMm(clampValue(rawX, -WORKSPACE_LIMIT_MM, WORKSPACE_LIMIT_MM)),
    y: roundMm(clampValue(rawY, -WORKSPACE_LIMIT_MM, WORKSPACE_LIMIT_MM)),
    z: roundMm(clampValue(rawZ, 0, WORKSPACE_LIMIT_MM)),
    w: roundMm(Math.max(1, rawW)),
    l: roundMm(Math.max(1, rawL)),
    h: roundMm(Math.max(1, rawH)),
  };

  const candidate: PackedCarton = {
    ...initial,
    x: quantizeToStep(initial.x, manualMoveStepMm),
    y: quantizeToStep(initial.y, manualMoveStepMm),
    z: Math.max(0, quantizeToStep(initial.z, manualMoveStepMm)),
  };
  if (!isValidCartonGeometry(candidate)) return null;
  return candidate;
}

export function resolveManualCollision({
  source,
  candidate,
  manualCartons,
  patch,
}: CollisionResolutionArgs): CollisionResolutionResult {
  let resolved = candidate;
  let resolvedBySnap = false;
  const translationOnly = patch.w === undefined && patch.l === undefined && patch.h === undefined;

  if (hasCartonCollision(resolved, manualCartons, source.id)) {
    const canUseSweepSnap = translationOnly && !hasCartonCollision(source, manualCartons, source.id);
    if (!canUseSweepSnap) {
      return { resolved: null, resolvedBySnap: false };
    }

    const snapped = snapTranslationToFreePosition(source, resolved, manualCartons);
    if (!snapped) {
      return { resolved: null, resolvedBySnap: false };
    }
    resolved = snapped;
    resolvedBySnap = true;
  }

  if (hasCartonCollision(resolved, manualCartons, source.id)) {
    return { resolved: null, resolvedBySnap: false };
  }

  return { resolved, resolvedBySnap };
}

export function hasMeaningfulTranslationProgress(source: PackedCarton, resolved: PackedCarton): boolean {
  const progress = Math.hypot(
    resolved.x - source.x,
    resolved.y - source.y,
    resolved.z - source.z,
  );
  return progress >= MIN_TRANSLATION_PROGRESS_MM;
}

export function buildManualRotationPatch(
  carton: PackedCarton,
  plane: "xy" | "xz" | "yz",
): ManualPatch {
  let nextW = carton.w;
  let nextL = carton.l;
  let nextH = carton.h;

  if (plane === "xy") {
    nextW = carton.l;
    nextL = carton.w;
  } else if (plane === "xz") {
    nextW = carton.h;
    nextH = carton.w;
  } else {
    nextL = carton.h;
    nextH = carton.l;
  }

  const centerX = carton.x + carton.w / 2;
  const centerY = carton.y + carton.l / 2;
  const centerZ = carton.z + carton.h / 2;

  return {
    w: nextW,
    l: nextL,
    h: nextH,
    x: centerX - nextW / 2,
    y: centerY - nextL / 2,
    z: Math.max(0, centerZ - nextH / 2),
  };
}
