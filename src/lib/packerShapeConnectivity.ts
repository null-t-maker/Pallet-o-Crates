import type { Rect } from "./packerCoreTypes";

interface ShapeConnectivityDeps {
  EPS: number;
  overlapArea: (a: Rect, b: Rect) => number;
  intervalOverlapLength: (a1: number, a2: number, b1: number, b2: number) => number;
  isNear: (a: number, b: number, tol?: number) => boolean;
}

function areRectsConnected(a: Rect, b: Rect, deps: ShapeConnectivityDeps, tol = 0.25): boolean {
  if (deps.overlapArea(a, b) > deps.EPS) return true;

  const yOverlap = deps.intervalOverlapLength(a.y, a.y + a.l, b.y, b.y + b.l);
  const xOverlap = deps.intervalOverlapLength(a.x, a.x + a.w, b.x, b.x + b.w);

  if (yOverlap > deps.EPS && (deps.isNear(a.x + a.w, b.x, tol) || deps.isNear(a.x, b.x + b.w, tol))) return true;
  if (xOverlap > deps.EPS && (deps.isNear(a.y + a.l, b.y, tol) || deps.isNear(a.y, b.y + b.l, tol))) return true;
  return false;
}

export function connectedComponentCount(rects: Rect[], deps: ShapeConnectivityDeps): number {
  if (rects.length === 0) return 0;
  const visited = new Array<boolean>(rects.length).fill(false);
  let components = 0;

  for (let i = 0; i < rects.length; i++) {
    if (visited[i]) continue;
    components++;
    const queue: number[] = [i];
    visited[i] = true;

    while (queue.length > 0) {
      const idx = queue.shift() as number;
      for (let j = 0; j < rects.length; j++) {
        if (visited[j]) continue;
        if (!areRectsConnected(rects[idx], rects[j], deps)) continue;
        visited[j] = true;
        queue.push(j);
      }
    }
  }

  return components;
}
