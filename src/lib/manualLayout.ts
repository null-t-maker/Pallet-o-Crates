import { v4 as uuidv4 } from "uuid";
import type { CartonInput, MultiPackResult, PackedCarton, PalletInput } from "./packerTypes";

export function generateManualCartons(pallet: PalletInput, cartons: CartonInput[]): PackedCarton[] {
  const stagingGap = 30;
  const stagingStartX = pallet.width + 120;
  const stagingWidth = Math.max(1200, pallet.width);
  let cursorX = stagingStartX;
  let cursorY = 0;
  let currentRowLength = 0;

  const generated: PackedCarton[] = [];
  for (const carton of cartons) {
    const unitCount = Math.max(0, Math.floor(carton.quantity));
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
        z: 0,
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
  const stagingGap = 30;
  const stagingStartX = pallet.width + 120;
  const stagingWidth = Math.max(1200, pallet.width);
  const countByType = new Map<string, number>();

  for (const carton of existing) {
    countByType.set(carton.typeId, (countByType.get(carton.typeId) ?? 0) + 1);
  }

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
        z: 0,
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

export function updateManualCartonsById(
  existing: PackedCarton[],
  id: string,
  next: Partial<Pick<PackedCarton, "x" | "y" | "z" | "w" | "l" | "h">>,
): PackedCarton[] {
  const toFiniteOr = (value: number | undefined, fallback: number): number =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return existing.map((carton) => (
    carton.id === id
      ? {
        ...carton,
        x: toFiniteOr(next.x, carton.x),
        y: toFiniteOr(next.y, carton.y),
        z: Math.max(0, toFiniteOr(next.z, carton.z)),
        w: Math.max(1, toFiniteOr(next.w, carton.w)),
        l: Math.max(1, toFiniteOr(next.l, carton.l)),
        h: Math.max(1, toFiniteOr(next.h, carton.h)),
      }
      : carton
  ));
}
