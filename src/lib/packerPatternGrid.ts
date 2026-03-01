import type { Rect, SelectionMode } from "./packerCoreTypes";
import { clampToZero } from "./packerPatternTransform";

function sampleCounts(max: number): number[] {
  if (max <= 0) return [0];
  if (max <= 8) return Array.from({ length: max + 1 }, (_, i) => i);

  const set = new Set<number>([
    0,
    1,
    2,
    3,
    Math.floor(max / 3),
    Math.floor(max / 2),
    Math.floor((2 * max) / 3),
    max - 3,
    max - 2,
    max - 1,
    max,
  ]);
  return Array.from(set).filter((value) => value >= 0 && value <= max).sort((a, b) => a - b);
}

function axisCoords(
  span: number,
  item: number,
  count: number,
  anchor: SelectionMode,
  eps: number,
): number[] {
  if (count <= 0 || item <= 0) return [];
  const used = count * item;
  if (used > span + eps) return [];

  if (anchor === "center") {
    const start = (span - used) / 2;
    return Array.from({ length: count }, (_, i) => clampToZero(start + i * item, eps));
  }

  if (count === 1) return [0];
  const frontCount = Math.floor(count / 2);
  const backCount = count - frontCount;
  const coords: number[] = [];

  for (let i = 0; i < frontCount; i++) {
    coords.push(clampToZero(i * item, eps));
  }

  const backStart = span - backCount * item;
  for (let i = 0; i < backCount; i++) {
    coords.push(clampToZero(backStart + i * item, eps));
  }

  return coords.sort((a, b) => a - b);
}

export function buildGrid(
  zoneX: number,
  zoneY: number,
  zoneW: number,
  zoneL: number,
  itemW: number,
  itemL: number,
  anchorX: SelectionMode,
  anchorY: SelectionMode,
  eps: number,
): Rect[] {
  const cols = Math.floor((zoneW + eps) / itemW);
  const rows = Math.floor((zoneL + eps) / itemL);
  if (cols <= 0 || rows <= 0) return [];

  const xs = axisCoords(zoneW, itemW, cols, anchorX, eps).map((x) => zoneX + x);
  const ys = axisCoords(zoneL, itemL, rows, anchorY, eps).map((y) => zoneY + y);
  const out: Rect[] = [];

  for (const x of xs) {
    for (const y of ys) {
      out.push({ x, y, w: itemW, l: itemL });
    }
  }
  return out;
}

export { sampleCounts };
