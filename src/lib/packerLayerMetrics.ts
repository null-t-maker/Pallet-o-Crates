import type { CenterStats, Rect, WallStats } from "./packerCoreTypes";

export interface LayerMetricsDeps {
  EPS: number;
  isNear: (a: number, b: number, tol?: number) => boolean;
  coversPoint: (rect: Rect, px: number, py: number) => boolean;
}

function mergeIntervals(intervals: Array<[number, number]>, eps: number): Array<[number, number]> {
  if (intervals.length === 0) return [];
  const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);
  const out: Array<[number, number]> = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const [start, end] = sorted[i];
    const last = out[out.length - 1];
    if (start <= last[1] + eps) {
      last[1] = Math.max(last[1], end);
    } else {
      out.push([start, end]);
    }
  }
  return out;
}

export function wallStats(
  rects: Rect[],
  palletWidth: number,
  palletLength: number,
  deps: LayerMetricsDeps,
): WallStats {
  const leftIntervals: Array<[number, number]> = [];
  const rightIntervals: Array<[number, number]> = [];
  const bottomIntervals: Array<[number, number]> = [];
  const topIntervals: Array<[number, number]> = [];

  for (const rect of rects) {
    if (deps.isNear(rect.x, 0)) leftIntervals.push([rect.y, rect.y + rect.l]);
    if (deps.isNear(rect.x + rect.w, palletWidth)) rightIntervals.push([rect.y, rect.y + rect.l]);
    if (deps.isNear(rect.y, 0)) bottomIntervals.push([rect.x, rect.x + rect.w]);
    if (deps.isNear(rect.y + rect.l, palletLength)) topIntervals.push([rect.x, rect.x + rect.w]);
  }

  const left = mergeIntervals(leftIntervals, deps.EPS);
  const right = mergeIntervals(rightIntervals, deps.EPS);
  const bottom = mergeIntervals(bottomIntervals, deps.EPS);
  const top = mergeIntervals(topIntervals, deps.EPS);

  const lenLeft = left.reduce((acc, [a, b]) => acc + (b - a), 0);
  const lenRight = right.reduce((acc, [a, b]) => acc + (b - a), 0);
  const lenBottom = bottom.reduce((acc, [a, b]) => acc + (b - a), 0);
  const lenTop = top.reduce((acc, [a, b]) => acc + (b - a), 0);

  const coverage = (
    (lenLeft / Math.max(palletLength, deps.EPS))
    + (lenRight / Math.max(palletLength, deps.EPS))
    + (lenBottom / Math.max(palletWidth, deps.EPS))
    + (lenTop / Math.max(palletWidth, deps.EPS))
  ) / 4;

  const balance = 1 - (
    (Math.abs((lenLeft / Math.max(palletLength, deps.EPS)) - (lenRight / Math.max(palletLength, deps.EPS)))
      + Math.abs((lenBottom / Math.max(palletWidth, deps.EPS)) - (lenTop / Math.max(palletWidth, deps.EPS))))
    / 2
  );

  const segments = left.length + right.length + bottom.length + top.length;

  return {
    coverage: Math.max(0, Math.min(1, coverage)),
    balance: Math.max(0, Math.min(1, balance)),
    segments,
  };
}

export function estimateGapStats(
  rects: Rect[],
  palletWidth: number,
  palletLength: number,
  deps: LayerMetricsDeps,
): { largestGapRatio: number; emptyRatio: number } {
  if (rects.length === 0) {
    return { largestGapRatio: 1, emptyRatio: 1 };
  }

  const gridX = 20;
  const gridY = 20;
  const stepX = palletWidth / gridX;
  const stepY = palletLength / gridY;

  const occupied: boolean[][] = Array.from({ length: gridY }, () => Array.from({ length: gridX }, () => false));
  let filledCells = 0;

  for (let gy = 0; gy < gridY; gy++) {
    for (let gx = 0; gx < gridX; gx++) {
      const px = (gx + 0.5) * stepX;
      const py = (gy + 0.5) * stepY;
      const isFilled = rects.some((rect) => deps.coversPoint(rect, px, py));
      occupied[gy][gx] = isFilled;
      if (isFilled) filledCells++;
    }
  }

  const visited: boolean[][] = Array.from({ length: gridY }, () => Array.from({ length: gridX }, () => false));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let largestEmptyComponent = 0;

  for (let gy = 0; gy < gridY; gy++) {
    for (let gx = 0; gx < gridX; gx++) {
      if (visited[gy][gx] || occupied[gy][gx]) continue;

      let cells = 0;
      const queue: Array<[number, number]> = [[gx, gy]];
      visited[gy][gx] = true;

      while (queue.length > 0) {
        const [cx, cy] = queue.shift() as [number, number];
        cells++;

        for (const [dx, dy] of dirs) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= gridX || ny < 0 || ny >= gridY) continue;
          if (visited[ny][nx] || occupied[ny][nx]) continue;
          visited[ny][nx] = true;
          queue.push([nx, ny]);
        }
      }

      largestEmptyComponent = Math.max(largestEmptyComponent, cells);
    }
  }

  const totalCells = gridX * gridY;
  const emptyCells = totalCells - filledCells;
  return {
    largestGapRatio: largestEmptyComponent / totalCells,
    emptyRatio: emptyCells / totalCells,
  };
}

export function centerStats(
  rects: Rect[],
  palletWidth: number,
  palletLength: number,
  deps: LayerMetricsDeps,
): CenterStats {
  if (rects.length === 0) {
    return {
      occupancy: 0,
      axisCoverage: 0,
      hasCentralGap: true,
    };
  }

  const zoneScale = 0.36;
  const zoneW = palletWidth * zoneScale;
  const zoneL = palletLength * zoneScale;
  const zoneX = (palletWidth - zoneW) / 2;
  const zoneY = (palletLength - zoneL) / 2;
  const grid = 10;
  const stepX = zoneW / grid;
  const stepY = zoneL / grid;
  let filled = 0;

  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      const px = zoneX + (gx + 0.5) * stepX;
      const py = zoneY + (gy + 0.5) * stepY;
      if (rects.some((rect) => deps.coversPoint(rect, px, py))) filled++;
    }
  }

  const midX = palletWidth / 2;
  const midY = palletLength / 2;
  const crossX = rects.some((rect) => rect.x <= midX + deps.EPS && rect.x + rect.w >= midX - deps.EPS);
  const crossY = rects.some((rect) => rect.y <= midY + deps.EPS && rect.y + rect.l >= midY - deps.EPS);
  const axisCoverage = (crossX ? 0.5 : 0) + (crossY ? 0.5 : 0);
  const occupancy = filled / (grid * grid);
  const hasCentralGap = occupancy < 0.22 && axisCoverage < 1;

  return {
    occupancy,
    axisCoverage,
    hasCentralGap,
  };
}
