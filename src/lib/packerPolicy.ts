import type { CartonInput, CartonUprightPolicy } from "./packerTypes";
import type { NormalizedSampleGuidance } from "./packerConfig";

export function guidanceTrialNoise(guidance: NormalizedSampleGuidance | null, token: string): number {
  if (!guidance || guidance.searchSteps <= 1) return 0;
  let h = (guidance.randomSeed ^ (guidance.trialIndex * 0x9e3779b9)) >>> 0;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h / 4294967295) - 0.5;
}

export function resolveUprightPolicy(carton: CartonInput): CartonUprightPolicy {
  if (carton.uprightPolicy === "never" || carton.uprightPolicy === "tailOnly" || carton.uprightPolicy === "prefer") {
    return carton.uprightPolicy;
  }
  if (carton.allowUpright === false) return "never";
  return "prefer";
}

export function canUseUprightNow(carton: CartonInput, allowUpright: boolean): boolean {
  if (!allowUpright) return false;
  const policy = resolveUprightPolicy(carton);
  if (policy === "never") return false;
  return true;
}

export function hasAnyPreferredUprightCandidates(rem: CartonInput[]): boolean {
  return rem.some((carton) => carton.quantity > 0 && resolveUprightPolicy(carton) === "prefer");
}

export function hasAnyNonNeverUprightCandidates(rem: CartonInput[]): boolean {
  return rem.some((carton) => carton.quantity > 0 && resolveUprightPolicy(carton) !== "never");
}

