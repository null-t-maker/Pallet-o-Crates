import type { PackedCarton } from "./packerTypes";

const SAMPLE_SAVE_POSITION_SCALE = 10;

function roundSampleSavePosition(value: number): number {
  return Math.round(value * SAMPLE_SAVE_POSITION_SCALE) / SAMPLE_SAVE_POSITION_SCALE;
}

export function normalizeManualCartonsForSampleSave(cartons: PackedCarton[]): PackedCarton[] {
  return cartons.map((carton) => ({
    ...carton,
    x: roundSampleSavePosition(carton.x),
    y: roundSampleSavePosition(carton.y),
    z: Math.max(0, roundSampleSavePosition(carton.z)),
  }));
}
