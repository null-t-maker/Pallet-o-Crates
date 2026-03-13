import { v4 as uuidv4 } from "uuid";
import type { CartonInput, MultiPackResult, PackedCarton, PalletInput } from "./packerTypes";
import { buildManualSpawnZPlan } from "./manualSpawnPlan";
export { updateManualCartonsById } from "./manualLayoutUpdate";

const MANUAL_STAGING_GAP = 30;
const MANUAL_STAGING_OFFSET_X = 120;
const MANUAL_STAGING_MIN_WIDTH = 1200;
const MANUAL_STAGING_WIDTH_STEP = 10;
const MANUAL_STAGING_TARGET_COLUMNS_FACTOR = 1.15;
const MANUAL_STAGING_TARGET_AREA_BIAS = 1.25;
const MANUAL_STAGING_MIN_COLUMNS = 6;
const MANUAL_STAGING_MAX_COLUMNS = 12;
const MANUAL_STAGING_MAX_WIDTH_FACTOR = 2.4;
const MANUAL_STAGING_MAX_LENGTH_FACTOR = 2.1;

interface ManualStagingDemand {
  width: number;
  length: number;
  units: number;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundUpToStep(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

function resolveManualStagingWidth(pallet: PalletInput, demand: ManualStagingDemand[]): number {
  const minRowWidth = Math.max(MANUAL_STAGING_MIN_WIDTH, pallet.width);
  const activeDemand = demand.filter((entry) => (
    entry.units > 0
    && Number.isFinite(entry.width)
    && entry.width > 0
    && Number.isFinite(entry.length)
    && entry.length > 0
  ));
  if (activeDemand.length === 0) return minRowWidth;

  const totalUnits = activeDemand.reduce((sum, entry) => sum + entry.units, 0);
  const totalFootprintArea = activeDemand.reduce(
    (sum, entry) => sum + entry.units * (entry.width + MANUAL_STAGING_GAP) * (entry.length + MANUAL_STAGING_GAP),
    0,
  );
  const maxUnitSpan = activeDemand.reduce(
    (maxSpan, entry) => Math.max(maxSpan, entry.width + MANUAL_STAGING_GAP),
    0,
  );
  const targetColumns = clampNumber(
    Math.ceil(Math.sqrt(totalUnits) * MANUAL_STAGING_TARGET_COLUMNS_FACTOR),
    MANUAL_STAGING_MIN_COLUMNS,
    MANUAL_STAGING_MAX_COLUMNS,
  );
  const areaDrivenWidth = Math.sqrt(totalFootprintArea * MANUAL_STAGING_TARGET_AREA_BIAS);
  const columnDrivenWidth = maxUnitSpan * targetColumns;
  const maxRowWidth = Math.max(
    minRowWidth,
    pallet.width * MANUAL_STAGING_MAX_WIDTH_FACTOR,
    Math.max(pallet.width, pallet.length) * MANUAL_STAGING_MAX_LENGTH_FACTOR,
  );

  return roundUpToStep(
    clampNumber(Math.max(areaDrivenWidth, columnDrivenWidth), minRowWidth, maxRowWidth),
    MANUAL_STAGING_WIDTH_STEP,
  );
}

export function generateManualCartons(pallet: PalletInput, cartons: CartonInput[]): PackedCarton[] {
  const stagingGap = MANUAL_STAGING_GAP;
  const stagingStartX = pallet.width + MANUAL_STAGING_OFFSET_X;
  const stagingWidth = resolveManualStagingWidth(
    pallet,
    cartons.map((carton) => ({
      width: carton.width,
      length: carton.length,
      units: Math.max(0, Math.floor(carton.quantity)),
    })),
  );
  let cursorX = stagingStartX;
  let cursorY = 0;
  let currentRowLength = 0;

  const generated: PackedCarton[] = [];
  for (const carton of cartons) {
    const spawnPlan = buildManualSpawnZPlan(carton);
    const unitCount = spawnPlan.length;
    for (let i = 0; i < unitCount; i++) {
      if (cursorX > stagingStartX && cursorX + carton.width > stagingStartX + stagingWidth) {
        cursorX = stagingStartX;
        cursorY += currentRowLength + stagingGap;
        currentRowLength = 0;
      }

      generated.push({
        id: `manual-${carton.id}-${i + 1}-${uuidv4()}`,
        typeId: carton.id,
        title: carton.title,
        x: cursorX,
        y: cursorY,
        z: spawnPlan[i] ?? 0,
        w: carton.width,
        l: carton.length,
        h: carton.height,
        weight: carton.weight,
        color: carton.color,
      });

      cursorX += carton.width + stagingGap;
      currentRowLength = Math.max(currentRowLength, carton.length);
    }
  }

  return generated;
}

export function generateMoreManualCartons(
  pallet: PalletInput,
  cartons: CartonInput[],
  existing: PackedCarton[],
): PackedCarton[] {
  const stagingGap = MANUAL_STAGING_GAP;
  const stagingStartX = pallet.width + MANUAL_STAGING_OFFSET_X;
  const countByType = new Map<string, number>();

  for (const carton of existing) {
    countByType.set(carton.typeId, (countByType.get(carton.typeId) ?? 0) + 1);
  }

  const stagingWidth = resolveManualStagingWidth(
    pallet,
    cartons.map((carton) => {
      const targetCount = Math.max(0, Math.floor(carton.quantity));
      const alreadyGenerated = countByType.get(carton.id) ?? 0;
      return {
        width: carton.width,
        length: carton.length,
        units: Math.max(0, targetCount - alreadyGenerated),
      };
    }),
  );

  const additions: PackedCarton[] = [];
  let cursorX = stagingStartX;
  const maxExistingY = existing.reduce((maxY, carton) => {
    if (!Number.isFinite(carton.y) || !Number.isFinite(carton.l)) return maxY;
    return Math.max(maxY, carton.y + carton.l);
  }, 0);
  let cursorY = maxExistingY > 0 ? maxExistingY + stagingGap : 0;
  let currentRowLength = 0;

  for (const carton of cartons) {
    const targetCount = Math.max(0, Math.floor(carton.quantity));
    const alreadyGenerated = countByType.get(carton.id) ?? 0;
    const missing = Math.max(0, targetCount - alreadyGenerated);
    if (missing <= 0) continue;
    const spawnPlan = buildManualSpawnZPlan(carton);

    for (let i = 0; i < missing; i++) {
      if (cursorX > stagingStartX && cursorX + carton.width > stagingStartX + stagingWidth) {
        cursorX = stagingStartX;
        cursorY += currentRowLength + stagingGap;
        currentRowLength = 0;
      }

      additions.push({
        id: `manual-${carton.id}-${alreadyGenerated + i + 1}-${uuidv4()}`,
        typeId: carton.id,
        title: carton.title,
        x: cursorX,
        y: cursorY,
        z: spawnPlan[alreadyGenerated + i] ?? 0,
        w: carton.width,
        l: carton.length,
        h: carton.height,
        weight: carton.weight,
        color: carton.color,
      });

      cursorX += carton.width + stagingGap;
      currentRowLength = Math.max(currentRowLength, carton.length);
    }
    countByType.set(carton.id, alreadyGenerated + missing);
  }

  if (additions.length === 0) return existing;
  return [...existing, ...additions];
}

export function importGenerationToManual(generated: MultiPackResult): PackedCarton[] {
  const imported: PackedCarton[] = [];
  for (const placed of generated.pallets) {
    for (const layer of placed.result.layers) {
      for (const carton of layer.cartons) {
        imported.push({
          ...carton,
          id: `${carton.id}-p${placed.index}`,
          x: carton.x + placed.offsetX,
          y: carton.y + placed.offsetY,
        });
      }
    }
  }
  imported.sort((a, b) => {
    if (Math.abs(a.z - b.z) > 1e-6) return a.z - b.z;
    if (Math.abs(a.y - b.y) > 1e-6) return a.y - b.y;
    if (Math.abs(a.x - b.x) > 1e-6) return a.x - b.x;
    return a.id.localeCompare(b.id);
  });
  return imported;
}
