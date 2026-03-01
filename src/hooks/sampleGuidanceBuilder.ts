import type { PackSampleGuidance, PalletInput, PalletPackingStyle, SampleGuidanceFilter } from "../lib/packer";
import type { SampleDatabaseRecord } from "../lib/layoutSamples";
import { fingerprintWithoutQuantity, isPalletPackingStyle, normalizeSampleSavePackingStyle } from "../lib/layoutSamples";
import {
  SAMPLE_GUIDANCE_CFG_SCALE_MAX,
  SAMPLE_GUIDANCE_CFG_SCALE_MIN,
  SAMPLE_GUIDANCE_STEPS_MAX,
  SAMPLE_GUIDANCE_STEPS_MIN,
  SAMPLE_GUIDANCE_STRENGTH_MAX,
  SAMPLE_GUIDANCE_STRENGTH_MIN,
  clamp,
} from "./sampleIntelligenceConstants";

interface BuildSampleGuidanceArgs {
  sampleGuidanceEnabled: boolean;
  records: SampleDatabaseRecord[];
  pallet: Pick<PalletInput, "width" | "length" | "packingStyle">;
  currentCartonFingerprint: string;
  currentCartonShapeFingerprint: string;
  sampleGuidanceFilter: SampleGuidanceFilter;
  sampleGuidanceStrengthPercent: number;
  sampleGuidanceCfgScalePercent: number;
  sampleGuidanceSteps: number;
  sampleGuidanceSeed: number;
}

export function buildSampleGuidance({
  sampleGuidanceEnabled,
  records,
  pallet,
  currentCartonFingerprint,
  currentCartonShapeFingerprint,
  sampleGuidanceFilter,
  sampleGuidanceStrengthPercent,
  sampleGuidanceCfgScalePercent,
  sampleGuidanceSteps,
  sampleGuidanceSeed,
}: BuildSampleGuidanceArgs): PackSampleGuidance | null {
  if (!sampleGuidanceEnabled) return null;
  if (records.length === 0) return null;

  const epsilon = 0.5;
  const isNear = (a: number | null, b: number): boolean =>
    typeof a === "number" && Number.isFinite(a) && Math.abs(a - b) <= epsilon;

  let centerVotes = 0;
  let edgeVotes = 0;
  let considered = 0;
  const currentStyle = isPalletPackingStyle(pallet.packingStyle)
    ? pallet.packingStyle
    : "edgeAligned";

  for (const sample of records) {
    if (!sample.valid) continue;
    if (!sample.cartonFingerprint) continue;
    const sampleStyle = normalizeSampleSavePackingStyle(sample.packingStyle);
    const dimsMatch = isNear(sample.palletWidth, pallet.width) && isNear(sample.palletLength, pallet.length);
    if (sampleGuidanceFilter === "dims" && !dimsMatch) continue;
    if (sampleGuidanceFilter === "shape" || sampleGuidanceFilter === "exact") {
      if (!dimsMatch) continue;
    }

    const sampleShapeFingerprint = fingerprintWithoutQuantity(sample.cartonFingerprint);
    const shapeMatch = sampleShapeFingerprint === currentCartonShapeFingerprint;
    const exactMatch = dimsMatch && sample.cartonFingerprint === currentCartonFingerprint;
    if (sampleGuidanceFilter === "shape" && !shapeMatch) continue;
    if (sampleGuidanceFilter === "exact" && !exactMatch) continue;

    let weight = 0.12;
    if (dimsMatch) weight = 0.45;
    if (shapeMatch) weight = Math.max(weight, 0.7);
    if (exactMatch) {
      weight = 1.0;
    }

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

  const totalVotes = centerVotes + edgeVotes;
  if (considered === 0 || totalVotes <= 0) return null;
  const tie = Math.abs(centerVotes - edgeVotes) <= 1e-6;
  const preferredMode = tie
    ? (currentStyle === "centerCompact" ? "center" : "edge")
    : (centerVotes > edgeVotes ? "center" : "edge");
  const preferredPackingStyle: PalletPackingStyle = preferredMode === "center"
    ? "centerCompact"
    : "edgeAligned";
  const baseConfidence = clamp(
    sampleGuidanceStrengthPercent / 100,
    SAMPLE_GUIDANCE_STRENGTH_MIN / 100,
    SAMPLE_GUIDANCE_STRENGTH_MAX / 100,
  );
  const cfgScale = clamp(
    sampleGuidanceCfgScalePercent / 100,
    SAMPLE_GUIDANCE_CFG_SCALE_MIN / 100,
    SAMPLE_GUIDANCE_CFG_SCALE_MAX / 100,
  );
  const confidence = clamp(baseConfidence * cfgScale, 0, 3);
  const steps = Math.round(clamp(sampleGuidanceSteps, SAMPLE_GUIDANCE_STEPS_MIN, SAMPLE_GUIDANCE_STEPS_MAX));
  const seed = Number.isFinite(sampleGuidanceSeed) ? Math.trunc(sampleGuidanceSeed) : 0;

  return {
    preferredMode,
    preferredPackingStyle,
    confidence,
    sourceSampleCount: considered,
    cfgScale,
    searchSteps: steps,
    randomSeed: seed,
    sampleFilter: sampleGuidanceFilter,
  };
}
