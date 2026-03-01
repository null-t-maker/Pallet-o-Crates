export type PalletPackingStyle = "centerCompact" | "edgeAligned";
export type CartonUprightPolicy = "never" | "tailOnly" | "prefer";
export type ExtraPalletMode = "none" | "limitsOnly" | "full";
export type SampleGuidanceMode = "center" | "edge";
export type SampleGuidanceFilter = "all" | "dims" | "shape" | "exact";

export interface PackSampleGuidance {
  preferredMode?: SampleGuidanceMode;
  preferredPackingStyle?: PalletPackingStyle;
  confidence?: number;
  sourceSampleCount?: number;
  cfgScale?: number;
  searchSteps?: number;
  randomSeed?: number;
  trialIndex?: number;
  sampleFilter?: SampleGuidanceFilter;
}

export interface PalletInput {
  width: number;
  length: number;
  maxHeight: number;
  maxWeight: number;
  packingStyle?: PalletPackingStyle;
  extraPalletMode?: ExtraPalletMode;
  sampleGuidance?: PackSampleGuidance;
}

export interface CartonInput {
  id: string;
  title: string;
  width: number;
  length: number;
  height: number;
  weight: number;
  quantity: number;
  color: string;
  uprightPolicy?: CartonUprightPolicy;
  allowUpright?: boolean;
}

export interface PackedCarton {
  id: string;
  typeId: string;
  title: string;
  x: number;
  y: number;
  z: number;
  w: number;
  l: number;
  h: number;
  weight: number;
  color: string;
}

export interface Layer {
  zBase: number;
  height: number;
  cartons: PackedCarton[];
}

export interface PackResult {
  layers: Layer[];
  totalWeight: number;
  totalHeight: number;
  unpacked: CartonInput[];
}

export interface PackedPalletPlacement {
  index: number;
  offsetX: number;
  offsetY: number;
  result: PackResult;
}

export interface MultiPackResult {
  pallets: PackedPalletPlacement[];
  totalWeight: number;
  maxHeight: number;
  unpacked: CartonInput[];
  packedUnits: number;
  requestedUnits: number;
}
