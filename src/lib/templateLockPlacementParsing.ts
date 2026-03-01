import type {
  PackedCarton,
  PalletInput,
} from "./packerTypes";
import type { ShapeDescriptor } from "./templateLockShapeState";
import { findMatchingCartonShapeKey } from "./templateLockShapeState";

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export interface ParsedTemplatePlacement {
  carton: PackedCarton;
  palletIndex: number;
  offsetX: number;
  offsetY: number;
  matchedShapeKey: string | null;
}

export function buildPlacementOffsetsByIndex(
  root: Record<string, unknown>,
): Map<number, { offsetX: number; offsetY: number }> {
  const placementOffsetsByIndex = new Map<number, { offsetX: number; offsetY: number }>();
  const palletPlacementsRaw = Array.isArray(root.palletPlacements) ? root.palletPlacements : [];
  for (const entry of palletPlacementsRaw) {
    const obj = asRecord(entry);
    if (!obj) continue;
    const palletIndex = asFiniteNumber(obj.palletIndex);
    const offsetX = asFiniteNumber(obj.offsetX);
    const offsetY = asFiniteNumber(obj.offsetY);
    if (palletIndex === null || offsetX === null || offsetY === null) continue;
    placementOffsetsByIndex.set(Math.floor(palletIndex), { offsetX, offsetY });
  }
  return placementOffsetsByIndex;
}

export function parseTemplatePlacements(
  placementsRaw: unknown[],
  pallet: PalletInput,
  shapeDescriptors: ShapeDescriptor[],
  placementOffsetsByIndex: Map<number, { offsetX: number; offsetY: number }>,
): ParsedTemplatePlacement[] | null {
  const parsedPlacements: ParsedTemplatePlacement[] = [];
  const eps = 1e-6;

  for (const row of placementsRaw) {
    const obj = asRecord(row);
    if (!obj) return null;
    const x = asFiniteNumber(obj.x);
    const y = asFiniteNumber(obj.y);
    const z = asFiniteNumber(obj.z);
    const w = asFiniteNumber(obj.w);
    const l = asFiniteNumber(obj.l);
    const h = asFiniteNumber(obj.h);
    const weight = asFiniteNumber(obj.weight);
    const palletIndexNum = asFiniteNumber(obj.palletIndex);
    if (
      x === null || y === null || z === null
      || w === null || l === null || h === null
      || weight === null
    ) return null;
    if (w <= 0 || l <= 0 || h <= 0) return null;

    const palletIndex = palletIndexNum === null ? 0 : Math.floor(palletIndexNum);
    const fallbackOffsetX = asFiniteNumber(obj.offsetX) ?? 0;
    const fallbackOffsetY = asFiniteNumber(obj.offsetY) ?? 0;
    const resolvedOffset = placementOffsetsByIndex.get(palletIndex) ?? {
      offsetX: fallbackOffsetX,
      offsetY: fallbackOffsetY,
    };

    const packed: PackedCarton = {
      id: String(obj.id ?? `template-${palletIndex}-${x}-${y}-${z}`),
      typeId: String(obj.typeId ?? "template"),
      title: String(obj.title ?? "Template carton"),
      x,
      y,
      z,
      w,
      l,
      h,
      weight,
      color: String(obj.color ?? "#43b66f"),
    };

    if (
      packed.x < -eps
      || packed.y < -eps
      || packed.z < -eps
      || packed.x + packed.w > pallet.width + eps
      || packed.y + packed.l > pallet.length + eps
      || packed.z + packed.h > pallet.maxHeight + eps
    ) return null;

    parsedPlacements.push({
      carton: packed,
      palletIndex,
      offsetX: resolvedOffset.offsetX,
      offsetY: resolvedOffset.offsetY,
      matchedShapeKey: findMatchingCartonShapeKey(packed, shapeDescriptors),
    });
  }

  return parsedPlacements.length > 0 ? parsedPlacements : null;
}

export function comparePlacementBySpatialOrder(a: ParsedTemplatePlacement, b: ParsedTemplatePlacement): number {
  if (Math.abs(a.carton.z - b.carton.z) > 1e-6) return a.carton.z - b.carton.z;
  if (Math.abs(a.carton.y - b.carton.y) > 1e-6) return a.carton.y - b.carton.y;
  if (Math.abs(a.carton.x - b.carton.x) > 1e-6) return a.carton.x - b.carton.x;
  return a.carton.id.localeCompare(b.carton.id);
}

export function comparePlacementByPalletAndSpatialOrder(
  a: ParsedTemplatePlacement,
  b: ParsedTemplatePlacement,
): number {
  if (a.palletIndex !== b.palletIndex) return a.palletIndex - b.palletIndex;
  return comparePlacementBySpatialOrder(a, b);
}
