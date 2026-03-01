import type { Rect, SelectionMode } from "./packerCoreTypes";
import type { RectSelectionDeps } from "./packerPatternTypes";

export function selectRects(
  rects: Rect[],
  count: number,
  mode: SelectionMode,
  palletWidth: number,
  palletLength: number,
  deps: RectSelectionDeps,
): Rect[] {
  if (count >= rects.length) return deps.sortRects(rects);

  const cx = palletWidth / 2;
  const cy = palletLength / 2;

  const scored = rects.map((rect) => {
    const rx = rect.x + rect.w / 2;
    const ry = rect.y + rect.l / 2;
    const centerDist = Math.hypot(rx - cx, ry - cy);
    const wallDist = deps.distanceToNearestWall(rect, palletWidth, palletLength);
    const cornerDist = deps.distanceToNearestCorner(rect, palletWidth, palletLength);
    const axisDist = Math.min(Math.abs(rx - cx), Math.abs(ry - cy));

    let score = 0;
    if (mode === "center") {
      score = centerDist + (deps.touchesWall(rect, palletWidth, palletLength) ? Math.min(palletWidth, palletLength) * 0.1 : 0);
    } else if (mode === "pin") {
      score = (axisDist * 1.9) + (centerDist * 0.4) + (deps.touchesWall(rect, palletWidth, palletLength) ? Math.min(palletWidth, palletLength) * 0.22 : 0);
    } else {
      score = (wallDist * 2.2) + (cornerDist * 0.9);
    }

    return { rect, score };
  });

  scored.sort((a, b) => {
    if (Math.abs(a.score - b.score) > deps.EPS) return a.score - b.score;
    if (Math.abs(a.rect.y - b.rect.y) > deps.EPS) return a.rect.y - b.rect.y;
    return a.rect.x - b.rect.x;
  });

  return deps.sortRects(scored.slice(0, count).map((entry) => entry.rect));
}
