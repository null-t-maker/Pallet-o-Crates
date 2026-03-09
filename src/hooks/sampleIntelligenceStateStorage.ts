import type { SampleGuidanceFilter } from "../lib/packer";
import {
  SAMPLE_GUIDANCE_CFG_SCALE_MAX,
  SAMPLE_GUIDANCE_CFG_SCALE_MIN,
  SAMPLE_GUIDANCE_STEPS_MAX,
  SAMPLE_GUIDANCE_STEPS_MIN,
  SAMPLE_GUIDANCE_STRENGTH_MAX,
  SAMPLE_GUIDANCE_STRENGTH_MIN,
  clamp,
  isSampleGuidanceFilter,
} from "./sampleIntelligenceLogic";
import {
  loadStorageValue,
  persistStorageValue,
  removeStorageValue,
} from "./sampleIntelligenceStorageAccess";
import {
  SAMPLE_DATABASE_FOLDER_STORAGE_KEY,
  SAMPLE_GUIDANCE_CFG_SCALE_STORAGE_KEY,
  SAMPLE_GUIDANCE_ENABLED_STORAGE_KEY,
  SAMPLE_GUIDANCE_FILTER_STORAGE_KEY,
  SAMPLE_GUIDANCE_SEED_STORAGE_KEY,
  SAMPLE_GUIDANCE_STEPS_STORAGE_KEY,
  SAMPLE_GUIDANCE_STRENGTH_STORAGE_KEY,
  SAMPLE_TEMPLATE_LOCK_ENABLED_STORAGE_KEY,
} from "./sampleIntelligenceStorageKeys";

function parseIntWithDefault(raw: string | null, fallback: number): number {
  const parsed = raw ? Number.parseInt(raw, 10) : fallback;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBooleanWithDefault(raw: string | null, fallback: boolean): boolean {
  if (raw === null) return fallback;
  return raw === "1";
}

export function getInitialSampleDatabaseFolderPath(): string {
  return loadStorageValue(SAMPLE_DATABASE_FOLDER_STORAGE_KEY) ?? "";
}

export function getInitialSampleGuidanceEnabled(): boolean {
  const raw = loadStorageValue(SAMPLE_GUIDANCE_ENABLED_STORAGE_KEY);
  return parseBooleanWithDefault(raw, true);
}

export function getInitialSampleTemplateLockEnabled(): boolean {
  const raw = loadStorageValue(SAMPLE_TEMPLATE_LOCK_ENABLED_STORAGE_KEY);
  return parseBooleanWithDefault(raw, true);
}

export function getInitialSampleGuidanceStrengthPercent(): number {
  const raw = loadStorageValue(SAMPLE_GUIDANCE_STRENGTH_STORAGE_KEY);
  const parsed = parseIntWithDefault(raw, 100);
  return Math.round(clamp(parsed, SAMPLE_GUIDANCE_STRENGTH_MIN, SAMPLE_GUIDANCE_STRENGTH_MAX));
}

export function getInitialSampleGuidanceCfgScalePercent(): number {
  const raw = loadStorageValue(SAMPLE_GUIDANCE_CFG_SCALE_STORAGE_KEY);
  const parsed = parseIntWithDefault(raw, 100);
  return Math.round(clamp(parsed, SAMPLE_GUIDANCE_CFG_SCALE_MIN, SAMPLE_GUIDANCE_CFG_SCALE_MAX));
}

export function getInitialSampleGuidanceSteps(): number {
  const raw = loadStorageValue(SAMPLE_GUIDANCE_STEPS_STORAGE_KEY);
  const parsed = parseIntWithDefault(raw, 1);
  return Math.round(clamp(parsed, SAMPLE_GUIDANCE_STEPS_MIN, SAMPLE_GUIDANCE_STEPS_MAX));
}

export function getInitialSampleGuidanceSeed(): number {
  const raw = loadStorageValue(SAMPLE_GUIDANCE_SEED_STORAGE_KEY);
  const parsed = parseIntWithDefault(raw, 0);
  return Math.trunc(parsed);
}

export function getInitialSampleGuidanceFilter(): SampleGuidanceFilter {
  const raw = loadStorageValue(SAMPLE_GUIDANCE_FILTER_STORAGE_KEY);
  return isSampleGuidanceFilter(raw) ? raw : "all";
}

export function persistSampleDatabaseFolderPath(sampleDatabaseFolderPath: string): void {
  if (!sampleDatabaseFolderPath) {
    removeStorageValue(SAMPLE_DATABASE_FOLDER_STORAGE_KEY);
    return;
  }
  persistStorageValue(SAMPLE_DATABASE_FOLDER_STORAGE_KEY, sampleDatabaseFolderPath);
}

export function persistSampleGuidanceEnabled(enabled: boolean): void {
  persistStorageValue(SAMPLE_GUIDANCE_ENABLED_STORAGE_KEY, enabled ? "1" : "0");
}

export function persistSampleTemplateLockEnabled(enabled: boolean): void {
  persistStorageValue(SAMPLE_TEMPLATE_LOCK_ENABLED_STORAGE_KEY, enabled ? "1" : "0");
}

export function persistSampleGuidanceStrengthPercent(value: number): void {
  persistStorageValue(SAMPLE_GUIDANCE_STRENGTH_STORAGE_KEY, String(value));
}

export function persistSampleGuidanceCfgScalePercent(value: number): void {
  persistStorageValue(SAMPLE_GUIDANCE_CFG_SCALE_STORAGE_KEY, String(value));
}

export function persistSampleGuidanceSteps(value: number): void {
  persistStorageValue(SAMPLE_GUIDANCE_STEPS_STORAGE_KEY, String(value));
}

export function persistSampleGuidanceSeed(value: number): void {
  persistStorageValue(SAMPLE_GUIDANCE_SEED_STORAGE_KEY, String(value));
}

export function persistSampleGuidanceFilter(value: SampleGuidanceFilter): void {
  persistStorageValue(SAMPLE_GUIDANCE_FILTER_STORAGE_KEY, value);
}
