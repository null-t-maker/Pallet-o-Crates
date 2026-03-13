import type { PackedCarton, PalletInput } from "../../lib/packer";
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
  pallet?: PalletInput;
  autoAlignEnabled?: boolean;
  ignoreCollisions?: boolean;
}

interface CollisionResolutionResult {
  resolved: PackedCarton | null;
  resolvedBySnap: boolean;
}

type SupportAlignAxis = "x" | "y";

const CONTACT_SNAP_MM = 4;
const CONTACT_EPS = 1e-3;
const SUPPORT_ALIGN_MM = 150;

function overlapsAxis(aMin: number, aSize: number, bMin: number, bSize: number): boolean {
  return aMin + aSize > bMin + CONTACT_EPS && bMin + bSize > aMin + CONTACT_EPS;
}

function overlapsForX(a: PackedCarton, b: PackedCarton): boolean {
  return overlapsAxis(a.y, a.l, b.y, b.l) && overlapsAxis(a.z, a.h, b.z, b.h);
}

function overlapsForY(a: PackedCarton, b: PackedCarton): boolean {
  return overlapsAxis(a.x, a.w, b.x, b.w) && overlapsAxis(a.z, a.h, b.z, b.h);
}

function overlapsForZ(a: PackedCarton, b: PackedCarton): boolean {
  return overlapsAxis(a.x, a.w, b.x, b.w) && overlapsAxis(a.y, a.l, b.y, b.l);
}

function touchesSupportTop(a: PackedCarton, b: PackedCarton): boolean {
  return Math.abs(a.z - (b.z + b.h)) <= CONTACT_SNAP_MM + CONTACT_EPS;
}

function snapAxisToNearest(
  current: number,
  contacts: number[],
): number {
  let best = current;
  let bestDist = CONTACT_SNAP_MM + CONTACT_EPS;
  for (const contact of contacts) {
    const dist = Math.abs(current - contact);
    if (dist <= CONTACT_SNAP_MM + CONTACT_EPS && dist < bestDist) {
      best = roundMm(contact);
      bestDist = dist;
    }
  }
  return best;
}

function overlapsPalletFootprint(carton: PackedCarton, pallet: PalletInput): boolean {
  const overlapWidth = Math.min(carton.x + carton.w, pallet.width) - Math.max(carton.x, 0);
  const overlapLength = Math.min(carton.y + carton.l, pallet.length) - Math.max(carton.y, 0);
  return overlapWidth > CONTACT_EPS && overlapLength > CONTACT_EPS;
}

function normalizeCandidateToNearbyContacts(
  candidate: PackedCarton,
  manualCartons: PackedCarton[],
  sourceId: string,
  pallet?: PalletInput,
): PackedCarton {
  if (!pallet) return candidate;

  const touchesPallet = overlapsPalletFootprint(candidate, pallet);
  if (!touchesPallet) {
    return candidate;
  }

  let current = { ...candidate };
  for (let pass = 0; pass < 3; pass++) {
    const xContacts: number[] = [];
    const yContacts: number[] = [];
    const zContacts: number[] = [0];

    if (current.w <= pallet.width + CONTACT_EPS) {
      xContacts.push(0, pallet.width - current.w);
    }
    if (current.l <= pallet.length + CONTACT_EPS) {
      yContacts.push(0, pallet.length - current.l);
    }

    for (const other of manualCartons) {
      if (other.id === sourceId) continue;
      if (!isValidCartonGeometry(other)) continue;

      if (overlapsForX(current, other)) {
        xContacts.push(other.x - current.w, other.x + other.w);
      }
      if (overlapsForY(current, other)) {
        yContacts.push(other.y - current.l, other.y + other.l);
      }
      if (overlapsForZ(current, other)) {
        zContacts.push(other.z + other.h);
      }
    }

    let next = {
      ...current,
      x: snapAxisToNearest(current.x, xContacts),
      y: snapAxisToNearest(current.y, yContacts),
      z: Math.max(0, snapAxisToNearest(current.z, zContacts)),
    };

    if (next.w <= pallet.width + CONTACT_EPS) {
      next.x = clampValue(next.x, 0, pallet.width - next.w);
    }
    if (next.l <= pallet.length + CONTACT_EPS) {
      next.y = clampValue(next.y, 0, pallet.length - next.l);
    }

    if (
      Math.abs(next.x - current.x) <= CONTACT_EPS
      && Math.abs(next.y - current.y) <= CONTACT_EPS
      && Math.abs(next.z - current.z) <= CONTACT_EPS
    ) {
      return current;
    }
    current = next;
  }

  return current;
}

function buildSupportAlignedCandidate(
  candidate: PackedCarton,
  manualCartons: PackedCarton[],
  sourceId: string,
  pallet?: PalletInput,
  axis?: SupportAlignAxis,
): PackedCarton | null {
  if (!pallet) return null;

  const xTargets = new Set<number>([roundMm(candidate.x)]);
  const yTargets = new Set<number>([roundMm(candidate.y)]);
  const supportXTargets = new Set<number>();
  const supportYTargets = new Set<number>();
  const supportsBelow: PackedCarton[] = [];

  for (const other of manualCartons) {
    if (other.id === sourceId) continue;
    if (!isValidCartonGeometry(other)) continue;
    if (!touchesSupportTop(candidate, other)) continue;
    supportsBelow.push(other);

    if ((axis === undefined || axis === "x") && overlapsAxis(candidate.y, candidate.l, other.y, other.l)) {
      const start = roundMm(other.x);
      const end = roundMm(other.x + other.w - candidate.w);
      xTargets.add(start);
      xTargets.add(end);
      supportXTargets.add(start);
      supportXTargets.add(end);
    }
    if ((axis === undefined || axis === "y") && overlapsAxis(candidate.x, candidate.w, other.x, other.w)) {
      const start = roundMm(other.y);
      const end = roundMm(other.y + other.l - candidate.l);
      yTargets.add(start);
      yTargets.add(end);
      supportYTargets.add(start);
      supportYTargets.add(end);
    }
  }

  let best: PackedCarton | null = null;
  let bestSupportArea = -1;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const x of xTargets) {
    for (const y of yTargets) {
      let next: PackedCarton = {
        ...candidate,
        x,
        y,
      };

      if (next.w <= pallet.width + CONTACT_EPS) {
        next.x = clampValue(next.x, 0, pallet.width - next.w);
      }
      if (next.l <= pallet.length + CONTACT_EPS) {
        next.y = clampValue(next.y, 0, pallet.length - next.l);
      }

      if (
        Math.abs(next.x - candidate.x) > SUPPORT_ALIGN_MM + CONTACT_EPS
        || Math.abs(next.y - candidate.y) > SUPPORT_ALIGN_MM + CONTACT_EPS
      ) {
        continue;
      }

      if (hasCartonCollision(next, manualCartons, sourceId)) {
        continue;
      }

      const alignedX = supportXTargets.has(roundMm(next.x));
      const alignedY = supportYTargets.has(roundMm(next.y));
      if (axis === "x" && !alignedX) {
        continue;
      }
      if (axis === "y" && !alignedY) {
        continue;
      }
      if (axis === undefined && !alignedX && !alignedY) {
        continue;
      }

      let supportArea = 0;
      for (const support of supportsBelow) {
        const overlapWidth = Math.min(next.x + next.w, support.x + support.w) - Math.max(next.x, support.x);
        const overlapLength = Math.min(next.y + next.l, support.y + support.l) - Math.max(next.y, support.y);
        if (overlapWidth > CONTACT_EPS && overlapLength > CONTACT_EPS) {
          supportArea += overlapWidth * overlapLength;
        }
      }

      const score = Math.abs(next.x - candidate.x) + Math.abs(next.y - candidate.y);
      if (
        supportArea > bestSupportArea + CONTACT_EPS
        || (Math.abs(supportArea - bestSupportArea) <= CONTACT_EPS && score < bestScore - CONTACT_EPS)
      ) {
        best = next;
        bestSupportArea = supportArea;
        bestScore = score;
      }
    }
  }

  return best;
}

export function alignCandidateToSupportEdges(
  candidate: PackedCarton,
  manualCartons: PackedCarton[],
  sourceId: string,
  pallet?: PalletInput,
  axis?: SupportAlignAxis,
): PackedCarton {
  return buildSupportAlignedCandidate(candidate, manualCartons, sourceId, pallet, axis) ?? candidate;
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
  pallet,
  autoAlignEnabled = true,
  ignoreCollisions = false,
}: CollisionResolutionArgs): CollisionResolutionResult {
  if (ignoreCollisions) {
    return { resolved: candidate, resolvedBySnap: false };
  }

  let resolved = autoAlignEnabled
    ? normalizeCandidateToNearbyContacts(candidate, manualCartons, source.id, pallet)
    : candidate;
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
    resolved = autoAlignEnabled
      ? normalizeCandidateToNearbyContacts(snapped, manualCartons, source.id, pallet)
      : snapped;
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
