import {
  SAMPLE_GUIDANCE_CFG_SCALE_MAX,
  SAMPLE_GUIDANCE_CFG_SCALE_MIN,
  SAMPLE_GUIDANCE_STEPS_MAX,
  SAMPLE_GUIDANCE_STEPS_MIN,
  SAMPLE_GUIDANCE_STRENGTH_MAX,
  SAMPLE_GUIDANCE_STRENGTH_MIN,
  clamp,
} from "./sampleIntelligenceConstants";

interface BuildSampleGuidanceParamsArgs {
  sampleGuidanceStrengthPercent: number;
  sampleGuidanceCfgScalePercent: number;
  sampleGuidanceSteps: number;
  sampleGuidanceSeed: number;
}

export interface SampleGuidanceParams {
  confidence: number;
  cfgScale: number;
  steps: number;
  seed: number;
}

export function buildSampleGuidanceParams({
  sampleGuidanceStrengthPercent,
  sampleGuidanceCfgScalePercent,
  sampleGuidanceSteps,
  sampleGuidanceSeed,
}: BuildSampleGuidanceParamsArgs): SampleGuidanceParams {
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
    confidence,
    cfgScale,
    steps,
    seed,
  };
}
