export const WORKSPACE_LIMIT_MM = 20000;

const LEGACY_BLUE_TO_GREEN: Record<string, string> = {
  "#58a6ff": "#43b66f",
  "#79c0ff": "#5fc486",
  "#56d4dd": "#6cc79a",
};

export function displayCartonColor(input: string): string {
  const key = input.trim().toLowerCase();
  return LEGACY_BLUE_TO_GREEN[key] ?? input;
}

export function roundMm(value: number): number {
  return Math.round(value * 10) / 10;
}

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function quantizeToStep(value: number, stepMm: number): number {
  if (!Number.isFinite(stepMm) || stepMm <= 0) {
    return roundMm(value);
  }
  const snapped = Math.round(value / stepMm) * stepMm;
  return roundMm(snapped);
}

export {
  MIN_TRANSLATION_PROGRESS_MM,
  hasCartonCollision,
  isValidCartonGeometry,
  snapTranslationToFreePosition,
} from "./visualizerCartonCollision";
