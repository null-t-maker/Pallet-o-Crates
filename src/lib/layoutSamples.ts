import type { CartonInput, PalletInput, PalletPackingStyle } from "./packerTypes";
import { WorkflowMode } from "../components/Visualizer";

export interface LayoutSamplePlacement {
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
  palletIndex: number;
  offsetX: number;
  offsetY: number;
}

export type SampleSavePackingStyle = PalletPackingStyle | "both";

export interface LayoutSampleDocument {
  schemaVersion: number;
  app: string;
  appVersion: string;
  descriptor: string;
  createdAt: string;
  workflowMode: WorkflowMode;
  packingStyle: SampleSavePackingStyle;
  pallet: PalletInput;
  cartonTypes: CartonInput[];
  palletPlacements: Array<{
    palletIndex: number;
    offsetX: number;
    offsetY: number;
  }>;
  placements: LayoutSamplePlacement[];
  stats: {
    requestedUnits: number;
    packedUnits: number;
    unpackedUnits: number;
    palletsUsed: number;
  };
}

export interface SaveLayoutSampleResponse {
  filePath: string;
}

export interface LoadLayoutSampleResponse {
  filePath: string;
  payload: unknown;
}

export interface SampleDatabaseRecord {
  filePath: string;
  fileName: string;
  descriptor: string | null;
  packingStyle: string | null;
  workflowMode: string | null;
  createdAt: string | null;
  palletWidth: number | null;
  palletLength: number | null;
  cartonFingerprint: string | null;
  valid: boolean;
  error: string | null;
}

export interface ScanSampleDatabaseResponse {
  folderPath: string;
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  samples: SampleDatabaseRecord[];
}

export function isPalletPackingStyle(value: unknown): value is PalletPackingStyle {
  return value === "centerCompact" || value === "edgeAligned";
}

export function isSampleSavePackingStyle(value: unknown): value is SampleSavePackingStyle {
  return value === "both" || isPalletPackingStyle(value);
}

export function normalizeSampleSavePackingStyle(value: unknown): SampleSavePackingStyle {
  if (isSampleSavePackingStyle(value)) return value;
  if (typeof value !== "string") return "both";
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) return "both";
  if (
    normalized === "center"
    || normalized === "centercompact"
    || normalized === "compact center"
    || normalized === "compact-center"
  ) return "centerCompact";
  if (
    normalized === "edge"
    || normalized === "edgealigned"
    || normalized === "aligned edges"
    || normalized === "aligned-edges"
  ) return "edgeAligned";
  if (
    normalized === "both"
    || normalized === "neutral"
    || normalized.includes("compatible")
  ) return "both";
  return "both";
}

export function buildCartonFingerprint(cartons: CartonInput[]): string {
  const rows = cartons
    .map((carton) => ({
      width: Math.round(Math.min(carton.width, carton.length) * 100) / 100,
      length: Math.round(Math.max(carton.width, carton.length) * 100) / 100,
      height: Math.round(carton.height * 100) / 100,
      weight: Math.round(carton.weight * 1000) / 1000,
      quantity: Math.max(0, Math.floor(carton.quantity)),
    }))
    .sort((a, b) => {
      if (a.width !== b.width) return a.width - b.width;
      if (a.length !== b.length) return a.length - b.length;
      if (a.height !== b.height) return a.height - b.height;
      if (a.weight !== b.weight) return a.weight - b.weight;
      return a.quantity - b.quantity;
    });
  return rows
    .map((row) => `${row.width}x${row.length}x${row.height}@${row.weight}#${row.quantity}`)
    .join("|");
}

export function fingerprintWithoutQuantity(fingerprint: string): string {
  const normalized = fingerprint
    .split("|")
    .map((part) => part.split("#")[0])
    .filter((part) => part.length > 0)
    .sort();
  return normalized.join("|");
}
