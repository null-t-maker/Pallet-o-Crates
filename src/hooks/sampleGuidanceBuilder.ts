import type { PackSampleGuidance, PalletInput, PalletPackingStyle, SampleGuidanceFilter } from "../lib/packer";
import type { SampleDatabaseRecord } from "../lib/layoutSamples";
import { buildSampleGuidanceParams } from "./sampleGuidanceParams";
import { collectSampleGuidanceVotes } from "./sampleGuidanceVoting";

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

  const { centerVotes, edgeVotes, considered, currentStyle } = collectSampleGuidanceVotes({
    records,
    pallet,
    currentCartonFingerprint,
    currentCartonShapeFingerprint,
    sampleGuidanceFilter,
  });

  const totalVotes = centerVotes + edgeVotes;
  if (considered === 0 || totalVotes <= 0) return null;
  const tie = Math.abs(centerVotes - edgeVotes) <= 1e-6;
  const preferredMode = tie
    ? (currentStyle === "centerCompact" ? "center" : "edge")
    : (centerVotes > edgeVotes ? "center" : "edge");
  const preferredPackingStyle: PalletPackingStyle = preferredMode === "center"
    ? "centerCompact"
    : "edgeAligned";
  const { confidence, cfgScale, steps, seed } = buildSampleGuidanceParams({
    sampleGuidanceStrengthPercent,
    sampleGuidanceCfgScalePercent,
    sampleGuidanceSteps,
    sampleGuidanceSeed,
  });

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
