import type { PackedCarton } from "../../lib/packer";
import type { ManualPatch } from "./manualCartonEditingCore";
import { roundMm } from "./visualizerHelpers";

export interface ManualAxisDraftValues {
  x: string;
  y: string;
  z: string;
}

function formatAxisValue(value: number): string {
  return String(roundMm(value));
}

function parseAxisValue(rawValue: string, fallback: number): number {
  const trimmed = rawValue.trim();
  if (!trimmed) return fallback;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildManualAxisDraftValues(carton: Pick<PackedCarton, "x" | "y" | "z">): ManualAxisDraftValues {
  return {
    x: formatAxisValue(carton.x),
    y: formatAxisValue(carton.y),
    z: formatAxisValue(carton.z),
  };
}

export function buildManualAxisPatchFromDraft(
  draft: ManualAxisDraftValues,
  carton: Pick<PackedCarton, "x" | "y" | "z">,
): ManualPatch {
  return {
    x: parseAxisValue(draft.x, carton.x),
    y: parseAxisValue(draft.y, carton.y),
    z: parseAxisValue(draft.z, carton.z),
  };
}

export function hasManualAxisDraftChanges(
  draft: ManualAxisDraftValues,
  carton: Pick<PackedCarton, "x" | "y" | "z">,
): boolean {
  const patch = buildManualAxisPatchFromDraft(draft, carton);
  return roundMm(patch.x ?? carton.x) !== roundMm(carton.x)
    || roundMm(patch.y ?? carton.y) !== roundMm(carton.y)
    || roundMm(patch.z ?? carton.z) !== roundMm(carton.z);
}
