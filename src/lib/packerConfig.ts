import type {
  ExtraPalletMode,
  PalletInput,
  PalletPackingStyle,
  SampleGuidanceFilter,
} from "./packerTypes";

const EPS = 1e-6;

export interface NormalizedSampleGuidance {
  preferredMode: "center" | "edge";
  preferredPackingStyle: PalletPackingStyle | null;
  confidence: number;
  sourceSampleCount: number;
  cfgScale: number;
  searchSteps: number;
  randomSeed: number;
  trialIndex: number;
  sampleFilter: SampleGuidanceFilter;
}

export function resolvePackingStyle(pallet: PalletInput): PalletPackingStyle {
  return pallet.packingStyle === "centerCompact" ? "centerCompact" : "edgeAligned";
}

export function resolveExtraPalletMode(pallet: PalletInput): ExtraPalletMode {
  if (pallet.extraPalletMode === "limitsOnly" || pallet.extraPalletMode === "full") {
    return pallet.extraPalletMode;
  }
  return "none";
}

export function resolveSampleGuidance(pallet: PalletInput): NormalizedSampleGuidance | null {
  const guidance = pallet.sampleGuidance;
  if (!guidance) return null;
  if (guidance.preferredMode !== "center" && guidance.preferredMode !== "edge") return null;
  const rawConfidence = typeof guidance.confidence === "number" ? guidance.confidence : 0;
  const confidence = Math.max(0, Math.min(3, rawConfidence));
  if (confidence <= EPS) return null;
  const rawCfgScale = typeof guidance.cfgScale === "number" ? guidance.cfgScale : 1;
  const cfgScale = Math.max(0.25, Math.min(3, rawCfgScale));
  const rawSteps = typeof guidance.searchSteps === "number" ? guidance.searchSteps : 1;
  const searchSteps = Math.max(1, Math.min(24, Math.floor(rawSteps)));
  const rawSeed = typeof guidance.randomSeed === "number" ? guidance.randomSeed : 0;
  const randomSeed = Number.isFinite(rawSeed) ? Math.trunc(rawSeed) : 0;
  const rawTrial = typeof guidance.trialIndex === "number" ? guidance.trialIndex : 0;
  const trialIndex = Math.max(0, Math.floor(rawTrial));
  const sampleFilter: SampleGuidanceFilter = guidance.sampleFilter === "dims"
    || guidance.sampleFilter === "shape"
    || guidance.sampleFilter === "exact"
    ? guidance.sampleFilter
    : "all";
  const preferredPackingStyle = guidance.preferredPackingStyle === "centerCompact"
    || guidance.preferredPackingStyle === "edgeAligned"
    ? guidance.preferredPackingStyle
    : null;
  const sourceSampleCount = Math.max(0, Math.floor(guidance.sourceSampleCount ?? 0));
  return {
    preferredMode: guidance.preferredMode,
    preferredPackingStyle,
    confidence,
    sourceSampleCount,
    cfgScale,
    searchSteps,
    randomSeed,
    trialIndex,
    sampleFilter,
  };
}

export function normalizePalletForPacking(pallet: PalletInput): PalletInput {
  return {
    width: Math.max(1, pallet.width),
    length: Math.max(1, pallet.length),
    maxHeight: Math.max(1, pallet.maxHeight),
    maxWeight: Math.max(0, pallet.maxWeight),
    packingStyle: resolvePackingStyle(pallet),
    extraPalletMode: resolveExtraPalletMode(pallet),
    sampleGuidance: pallet.sampleGuidance,
  };
}
