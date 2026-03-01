import type { SampleGuidanceFilter } from "../lib/packer";

export const SAMPLE_GUIDANCE_STRENGTH_MIN = 10;
export const SAMPLE_GUIDANCE_STRENGTH_MAX = 100;
export const SAMPLE_GUIDANCE_CFG_SCALE_MIN = 25;
export const SAMPLE_GUIDANCE_CFG_SCALE_MAX = 300;
export const SAMPLE_GUIDANCE_STEPS_MIN = 1;
export const SAMPLE_GUIDANCE_STEPS_MAX = 16;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  if (typeof error === "string" && error.trim().length > 0) return error;
  return "Unknown error";
}

export function isSampleGuidanceFilter(value: unknown): value is SampleGuidanceFilter {
  return value === "all" || value === "dims" || value === "shape" || value === "exact";
}
