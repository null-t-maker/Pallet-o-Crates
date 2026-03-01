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

const SAMPLE_DATABASE_FOLDER_STORAGE_KEY = "palletocrates.sampleDatabaseFolder";
const SAMPLE_GUIDANCE_ENABLED_STORAGE_KEY = "palletocrates.sampleGuidanceEnabled";
const SAMPLE_GUIDANCE_STRENGTH_STORAGE_KEY = "palletocrates.sampleGuidanceStrength";
const SAMPLE_GUIDANCE_CFG_SCALE_STORAGE_KEY = "palletocrates.sampleGuidanceCfgScale";
const SAMPLE_GUIDANCE_STEPS_STORAGE_KEY = "palletocrates.sampleGuidanceSteps";
const SAMPLE_GUIDANCE_SEED_STORAGE_KEY = "palletocrates.sampleGuidanceSeed";
const SAMPLE_GUIDANCE_FILTER_STORAGE_KEY = "palletocrates.sampleGuidanceFilter";
const SAMPLE_TEMPLATE_LOCK_ENABLED_STORAGE_KEY = "palletocrates.sampleTemplateLockEnabled";

function loadStorageValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export function getInitialSampleDatabaseFolderPath(): string {
  return loadStorageValue(SAMPLE_DATABASE_FOLDER_STORAGE_KEY) ?? "";
}

export function getInitialSampleGuidanceEnabled(): boolean {
  const raw = loadStorageValue(SAMPLE_GUIDANCE_ENABLED_STORAGE_KEY);
  if (raw === null) return true;
  return raw === "1";
}

export function getInitialSampleTemplateLockEnabled(): boolean {
  const raw = loadStorageValue(SAMPLE_TEMPLATE_LOCK_ENABLED_STORAGE_KEY);
  if (raw === null) return true;
  return raw === "1";
}

export function getInitialSampleGuidanceStrengthPercent(): number {
  const raw = loadStorageValue(SAMPLE_GUIDANCE_STRENGTH_STORAGE_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 100;
  if (!Number.isFinite(parsed)) return 100;
  return Math.round(clamp(parsed, SAMPLE_GUIDANCE_STRENGTH_MIN, SAMPLE_GUIDANCE_STRENGTH_MAX));
}

export function getInitialSampleGuidanceCfgScalePercent(): number {
  const raw = loadStorageValue(SAMPLE_GUIDANCE_CFG_SCALE_STORAGE_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 100;
  if (!Number.isFinite(parsed)) return 100;
  return Math.round(clamp(parsed, SAMPLE_GUIDANCE_CFG_SCALE_MIN, SAMPLE_GUIDANCE_CFG_SCALE_MAX));
}

export function getInitialSampleGuidanceSteps(): number {
  const raw = loadStorageValue(SAMPLE_GUIDANCE_STEPS_STORAGE_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 1;
  if (!Number.isFinite(parsed)) return 1;
  return Math.round(clamp(parsed, SAMPLE_GUIDANCE_STEPS_MIN, SAMPLE_GUIDANCE_STEPS_MAX));
}

export function getInitialSampleGuidanceSeed(): number {
  const raw = loadStorageValue(SAMPLE_GUIDANCE_SEED_STORAGE_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  if (!Number.isFinite(parsed)) return 0;
  return Math.trunc(parsed);
}

export function getInitialSampleGuidanceFilter(): SampleGuidanceFilter {
  const raw = loadStorageValue(SAMPLE_GUIDANCE_FILTER_STORAGE_KEY);
  return isSampleGuidanceFilter(raw) ? raw : "all";
}

export function persistSampleDatabaseFolderPath(sampleDatabaseFolderPath: string): void {
  if (typeof window === "undefined") return;
  if (!sampleDatabaseFolderPath) {
    window.localStorage.removeItem(SAMPLE_DATABASE_FOLDER_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(SAMPLE_DATABASE_FOLDER_STORAGE_KEY, sampleDatabaseFolderPath);
}

export function persistSampleGuidanceEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAMPLE_GUIDANCE_ENABLED_STORAGE_KEY, enabled ? "1" : "0");
}

export function persistSampleTemplateLockEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAMPLE_TEMPLATE_LOCK_ENABLED_STORAGE_KEY, enabled ? "1" : "0");
}

export function persistSampleGuidanceStrengthPercent(value: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAMPLE_GUIDANCE_STRENGTH_STORAGE_KEY, String(value));
}

export function persistSampleGuidanceCfgScalePercent(value: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAMPLE_GUIDANCE_CFG_SCALE_STORAGE_KEY, String(value));
}

export function persistSampleGuidanceSteps(value: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAMPLE_GUIDANCE_STEPS_STORAGE_KEY, String(value));
}

export function persistSampleGuidanceSeed(value: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAMPLE_GUIDANCE_SEED_STORAGE_KEY, String(value));
}

export function persistSampleGuidanceFilter(value: SampleGuidanceFilter): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAMPLE_GUIDANCE_FILTER_STORAGE_KEY, value);
}
