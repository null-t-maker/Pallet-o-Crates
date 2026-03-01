import type { PalletInput } from "../lib/packer";
import type { SampleDatabaseRecord, SampleSavePackingStyle } from "../lib/layoutSamples";
import { fingerprintWithoutQuantity, isPalletPackingStyle, normalizeSampleSavePackingStyle } from "../lib/layoutSamples";

export interface TemplateLockCandidate {
  sample: SampleDatabaseRecord;
  matchKind: "exact" | "shape";
}

interface SelectTemplateLockCandidateArgs {
  sampleTemplateLockEnabled: boolean;
  records: SampleDatabaseRecord[];
  currentCartonFingerprint: string;
  currentCartonShapeFingerprint: string;
  pallet: Pick<PalletInput, "width" | "length" | "packingStyle">;
}

export function selectTemplateLockCandidate({
  sampleTemplateLockEnabled,
  records,
  currentCartonFingerprint,
  currentCartonShapeFingerprint,
  pallet,
}: SelectTemplateLockCandidateArgs): TemplateLockCandidate | null {
  if (!sampleTemplateLockEnabled) return null;
  if (records.length === 0 || currentCartonFingerprint.length === 0) return null;

  const epsilon = 0.5;
  const currentStyle = isPalletPackingStyle(pallet.packingStyle)
    ? pallet.packingStyle
    : "edgeAligned";
  const isNear = (a: number | null, b: number): boolean =>
    typeof a === "number" && Number.isFinite(a) && Math.abs(a - b) <= epsilon;
  const compatibleStyle = (style: SampleSavePackingStyle): boolean =>
    style === "both" || style === currentStyle;

  let best: { sample: SampleDatabaseRecord; score: number; matchKind: "exact" | "shape" } | null = null;
  for (const sample of records) {
    if (!sample.valid) continue;
    if (!isNear(sample.palletWidth, pallet.width) || !isNear(sample.palletLength, pallet.length)) continue;
    if (!sample.cartonFingerprint) continue;

    const sampleShapeFingerprint = fingerprintWithoutQuantity(sample.cartonFingerprint);
    const exactMatch = sample.cartonFingerprint === currentCartonFingerprint;
    const shapeMatch = sampleShapeFingerprint === currentCartonShapeFingerprint;
    if (!exactMatch && !shapeMatch) continue;

    const style = normalizeSampleSavePackingStyle(sample.packingStyle);
    if (!compatibleStyle(style)) continue;

    let score = style === currentStyle ? 200 : 100;
    score += exactMatch ? 2000 : 1000;
    const createdAt = sample.createdAt ? Date.parse(sample.createdAt) : Number.NaN;
    if (Number.isFinite(createdAt)) score += createdAt / 1_000_000_000_000;
    if (best === null || score > best.score) {
      best = { sample, score, matchKind: exactMatch ? "exact" : "shape" };
    }
  }
  return best ?? null;
}
