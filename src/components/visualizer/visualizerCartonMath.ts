import type { PackedCarton } from "../../lib/packer";

const COLLISION_EPS = 1e-3;
const SWEEP_EPS = 1e-7;
const SWEEP_BACKOFF_STEPS = 22;
export const MIN_TRANSLATION_PROGRESS_MM = 0.05;
export const WORKSPACE_LIMIT_MM = 20000;

const LEGACY_BLUE_TO_GREEN: Record<string, string> = {
  "#58a6ff": "#43b66f",
  "#79c0ff": "#5fc486",
  "#56d4dd": "#6cc79a",
};

export function displayCartonColor(input: string): string {
  const key = input.trim().toLowerCase();
  return LEGACY_BLUE_TO_GREEN[key] ?? input;
}

export function roundMm(value: number): number {
  return Math.round(value * 10) / 10;
}

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function quantizeToStep(value: number, stepMm: number): number {
  if (!Number.isFinite(stepMm) || stepMm <= 0) {
    return roundMm(value);
  }
  const snapped = Math.round(value / stepMm) * stepMm;
  return roundMm(snapped);
}

function overlapsAxis(aMin: number, aSize: number, bMin: number, bSize: number): boolean {
  return aMin + aSize > bMin + COLLISION_EPS && bMin + bSize > aMin + COLLISION_EPS;
}

function cartonsOverlap3D(a: PackedCarton, b: PackedCarton): boolean {
  return overlapsAxis(a.x, a.w, b.x, b.w)
    && overlapsAxis(a.y, a.l, b.y, b.l)
    && overlapsAxis(a.z, a.h, b.z, b.h);
}

export function isValidCartonGeometry(carton: PackedCarton): boolean {
  return Number.isFinite(carton.x)
    && Number.isFinite(carton.y)
    && Number.isFinite(carton.z)
    && Number.isFinite(carton.w)
    && Number.isFinite(carton.l)
    && Number.isFinite(carton.h)
    && Number.isFinite(carton.weight)
    && carton.w > 0
    && carton.l > 0
    && carton.h > 0;
}

function hasCollision(candidate: PackedCarton, cartons: PackedCarton[], ignoreId: string): boolean {
  return cartons.some((other) => other.id !== ignoreId && cartonsOverlap3D(candidate, other));
}

function axisSweepWindow(
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number,
  delta: number,
): { enter: number; exit: number } | null {
  if (Math.abs(delta) <= SWEEP_EPS) {
    const overlapsNow = aMax > bMin + COLLISION_EPS && bMax > aMin + COLLISION_EPS;
    return overlapsNow
      ? { enter: Number.NEGATIVE_INFINITY, exit: Number.POSITIVE_INFINITY }
      : null;
  }

  const start = (bMin + COLLISION_EPS - aMax) / delta;
  const end = (bMax - COLLISION_EPS - aMin) / delta;
  return {
    enter: Math.min(start, end),
    exit: Math.max(start, end),
  };
}

function firstCollisionTimeOnSegment(
  source: PackedCarton,
  target: PackedCarton,
  obstacle: PackedCarton,
): number | null {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dz = target.z - source.z;

  const xWindow = axisSweepWindow(source.x, source.x + source.w, obstacle.x, obstacle.x + obstacle.w, dx);
  if (!xWindow) return null;
  const yWindow = axisSweepWindow(source.y, source.y + source.l, obstacle.y, obstacle.y + obstacle.l, dy);
  if (!yWindow) return null;
  const zWindow = axisSweepWindow(source.z, source.z + source.h, obstacle.z, obstacle.z + obstacle.h, dz);
  if (!zWindow) return null;

  const enter = Math.max(xWindow.enter, yWindow.enter, zWindow.enter);
  const exit = Math.min(xWindow.exit, yWindow.exit, zWindow.exit);

  if (enter >= exit) return null;
  if (exit <= 0) return null;
  if (enter >= 1) return null;
  return Math.max(0, enter);
}

function translationAtProgress(source: PackedCarton, target: PackedCarton, t: number): PackedCarton {
  return {
    ...source,
    x: source.x + (target.x - source.x) * t,
    y: source.y + (target.y - source.y) * t,
    z: source.z + (target.z - source.z) * t,
  };
}

export function snapTranslationToFreePosition(
  source: PackedCarton,
  target: PackedCarton,
  cartons: PackedCarton[],
): PackedCarton | null {
  const moveLength = Math.hypot(
    target.x - source.x,
    target.y - source.y,
    target.z - source.z,
  );
  if (moveLength <= SWEEP_EPS) return null;

  let firstHit = 1;
  for (const obstacle of cartons) {
    if (obstacle.id === source.id) continue;
    if (!isValidCartonGeometry(obstacle)) continue;
    const hitT = firstCollisionTimeOnSegment(source, target, obstacle);
    if (hitT !== null && hitT < firstHit) {
      firstHit = hitT;
    }
  }

  if (firstHit >= 1 - SWEEP_EPS) {
    return target;
  }
  if (firstHit <= SWEEP_EPS) {
    return null;
  }

  let low = 0;
  let high = firstHit;
  for (let i = 0; i < SWEEP_BACKOFF_STEPS; i++) {
    const mid = (low + high) / 2;
    const probe = translationAtProgress(source, target, mid);
    if (hasCollision(probe, cartons, source.id)) {
      high = mid;
    } else {
      low = mid;
    }
  }

  if (low <= SWEEP_EPS) return null;

  const snapped = translationAtProgress(source, target, low);
  if (hasCollision(snapped, cartons, source.id)) return null;

  const progress = Math.hypot(
    snapped.x - source.x,
    snapped.y - source.y,
    snapped.z - source.z,
  );
  if (progress < MIN_TRANSLATION_PROGRESS_MM) return null;
  return snapped;
}

export function hasCartonCollision(
  candidate: PackedCarton,
  cartons: PackedCarton[],
  ignoreId: string,
): boolean {
  return hasCollision(candidate, cartons, ignoreId);
}
