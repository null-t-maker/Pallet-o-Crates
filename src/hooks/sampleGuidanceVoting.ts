import type {
  PalletInput,
  PalletPackingStyle,
  SampleGuidanceFilter,
} from "../lib/packer";
import type { SampleDatabaseRecord } from "../lib/layoutSamples";
import {
  fingerprintWithoutQuantity,
  isPalletPackingStyle,
  normalizeSampleSavePackingStyle,
} from "../lib/layoutSamples";

interface CollectSampleGuidanceVotesArgs {
  records: SampleDatabaseRecord[];
  pallet: Pick<PalletInput, "width" | "length" | "packingStyle">;
  currentCartonFingerprint: string;
  currentCartonShapeFingerprint: string;
  sampleGuidanceFilter: SampleGuidanceFilter;
}

export interface SampleGuidanceVoteSummary {
  centerVotes: number;
  edgeVotes: number;
  considered: number;
  currentStyle: PalletPackingStyle;
}

const DIMENSION_EPSILON = 0.5;

function isNearDimension(a: number | null, b: number): boolean {
  return typeof a === "number" && Number.isFinite(a) && Math.abs(a - b) <= DIMENSION_EPSILON;
}

function matchesGuidanceFilter(
  filter: SampleGuidanceFilter,
  dimsMatch: boolean,
  shapeMatch: boolean,
  exactMatch: boolean,
): boolean {
  if (filter === "dims") return dimsMatch;
  if (filter === "shape") return dimsMatch && shapeMatch;
  if (filter === "exact") return exactMatch;
  return dimsMatch;
}

function computeSampleWeight(
  dimsMatch: boolean,
  shapeMatch: boolean,
  exactMatch: boolean,
): number {
  if (exactMatch) return 1.0;
  if (shapeMatch) return 0.7;
  if (dimsMatch) return 0.45;
  return 0.12;
}

export function collectSampleGuidanceVotes({
  records,
  pallet,
  currentCartonFingerprint,
  currentCartonShapeFingerprint,
  sampleGuidanceFilter,
}: CollectSampleGuidanceVotesArgs): SampleGuidanceVoteSummary {
  let centerVotes = 0;
  let edgeVotes = 0;
  let considered = 0;
  const currentStyle = isPalletPackingStyle(pallet.packingStyle)
    ? pallet.packingStyle
    : "edgeAligned";

  for (const sample of records) {
    if (!sample.valid || !sample.cartonFingerprint) continue;
    const sampleStyle = normalizeSampleSavePackingStyle(sample.packingStyle);
    const dimsMatch = isNearDimension(sample.palletWidth, pallet.width)
      && isNearDimension(sample.palletLength, pallet.length);
    const sampleShapeFingerprint = fingerprintWithoutQuantity(sample.cartonFingerprint);
    const shapeMatch = sampleShapeFingerprint === currentCartonShapeFingerprint;
    const exactMatch = dimsMatch && sample.cartonFingerprint === currentCartonFingerprint;
    if (!matchesGuidanceFilter(sampleGuidanceFilter, dimsMatch, shapeMatch, exactMatch)) continue;

    const weight = computeSampleWeight(dimsMatch, shapeMatch, exactMatch);
    considered += 1;
    if (sampleStyle === "both") {
      if (currentStyle === "centerCompact") centerVotes += weight;
      else edgeVotes += weight;
    } else if (sampleStyle === "centerCompact") {
      centerVotes += weight;
    } else {
      edgeVotes += weight;
    }
  }

  return {
    centerVotes,
    edgeVotes,
    considered,
    currentStyle,
  };
}
