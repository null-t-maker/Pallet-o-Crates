import type { Rect } from "./packerCoreTypes";
import type { LayerMetricsDeps } from "./packerLayerMetricsTypes";

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
