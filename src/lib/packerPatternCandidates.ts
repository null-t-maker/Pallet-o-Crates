import type { Pattern, Rect } from "./packerCoreTypes";
import { buildGrid, sampleCounts } from "./packerPatternGrid";
import { transformRects } from "./packerPatternTransform";
import type { PatternGeneratorDeps } from "./packerPatternTypes";

export function getPatternCandidates(
  palletWidth: number,
  palletLength: number,
  cartonWidth: number,
  cartonLength: number,
  cache: Map<string, Pattern[]>,
  deps: PatternGeneratorDeps,
): Pattern[] {
  const cacheKey = [palletWidth, palletLength, cartonWidth, cartonLength].join("|");
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const orientationA = { w: cartonWidth, l: cartonLength };
  const orientationB = { w: cartonLength, l: cartonWidth };
  const base: Pattern[] = [];
  const seenBase = new Set<string>();

  const pushBase = (id: string, rects: Rect[]): void => {
    if (rects.length === 0) return;
    const hash = deps.hashRects(rects);
    if (seenBase.has(hash)) return;
    seenBase.add(hash);
    base.push({ id, rects: deps.sortRects(rects) });
  };

  pushBase(
    "grid-edge-a",
    buildGrid(0, 0, palletWidth, palletLength, orientationA.w, orientationA.l, "edge", "edge", deps.EPS),
  );
  pushBase(
    "grid-center-a",
    buildGrid(0, 0, palletWidth, palletLength, orientationA.w, orientationA.l, "center", "center", deps.EPS),
  );

  if (!deps.isNear(orientationA.w, orientationB.w) || !deps.isNear(orientationA.l, orientationB.l)) {
    pushBase(
      "grid-edge-b",
      buildGrid(0, 0, palletWidth, palletLength, orientationB.w, orientationB.l, "edge", "edge", deps.EPS),
    );
    pushBase(
      "grid-center-b",
      buildGrid(0, 0, palletWidth, palletLength, orientationB.w, orientationB.l, "center", "center", deps.EPS),
    );
  }

  for (const colsLeft of sampleCounts(Math.floor((palletWidth + deps.EPS) / orientationA.w))) {
    const leftW = colsLeft * orientationA.w;
    const colsRight = Math.floor((palletWidth - leftW + deps.EPS) / orientationB.w);
    const rightW = colsRight * orientationB.w;
    if (leftW <= deps.EPS && rightW <= deps.EPS) continue;

    const rects = [
      ...buildGrid(0, 0, leftW, palletLength, orientationA.w, orientationA.l, "edge", "edge", deps.EPS),
      ...buildGrid(
        palletWidth - rightW,
        0,
        rightW,
        palletLength,
        orientationB.w,
        orientationB.l,
        "edge",
        "edge",
        deps.EPS,
      ),
    ];
    pushBase(`split-v-${colsLeft}-${colsRight}`, rects);
  }

  for (const rowsBottom of sampleCounts(Math.floor((palletLength + deps.EPS) / orientationA.l))) {
    const bottomL = rowsBottom * orientationA.l;
    const rowsTop = Math.floor((palletLength - bottomL + deps.EPS) / orientationB.l);
    const topL = rowsTop * orientationB.l;
    if (bottomL <= deps.EPS && topL <= deps.EPS) continue;

    const rects = [
      ...buildGrid(0, 0, palletWidth, bottomL, orientationA.w, orientationA.l, "edge", "edge", deps.EPS),
      ...buildGrid(0, palletLength - topL, palletWidth, topL, orientationB.w, orientationB.l, "edge", "edge", deps.EPS),
    ];
    pushBase(`split-h-${rowsBottom}-${rowsTop}`, rects);
  }

  for (const centerCols of sampleCounts(Math.floor((palletWidth + deps.EPS) / orientationB.w)).filter((value) => value > 0)) {
    const centerW = centerCols * orientationB.w;
    const leftRightSpace = palletWidth - centerW;
    if (leftRightSpace <= 0) continue;
    const sideCols = Math.floor(((leftRightSpace / 2) + deps.EPS) / orientationA.w);
    if (sideCols <= 0) continue;
    const sideW = sideCols * orientationA.w;
    const centerX = (palletWidth - centerW) / 2;
    if (centerX < sideW - deps.EPS) continue;

    const rects = [
      ...buildGrid(0, 0, sideW, palletLength, orientationA.w, orientationA.l, "edge", "edge", deps.EPS),
      ...buildGrid(centerX, 0, centerW, palletLength, orientationB.w, orientationB.l, "edge", "edge", deps.EPS),
      ...buildGrid(palletWidth - sideW, 0, sideW, palletLength, orientationA.w, orientationA.l, "edge", "edge", deps.EPS),
    ];
    pushBase(`triple-v-${centerCols}-${sideCols}`, rects);
  }

  for (const centerRows of sampleCounts(Math.floor((palletLength + deps.EPS) / orientationB.l)).filter((value) => value > 0)) {
    const centerL = centerRows * orientationB.l;
    const topBottomSpace = palletLength - centerL;
    if (topBottomSpace <= 0) continue;
    const sideRows = Math.floor(((topBottomSpace / 2) + deps.EPS) / orientationA.l);
    if (sideRows <= 0) continue;
    const sideL = sideRows * orientationA.l;
    const centerY = (palletLength - centerL) / 2;
    if (centerY < sideL - deps.EPS) continue;

    const rects = [
      ...buildGrid(0, 0, palletWidth, sideL, orientationA.w, orientationA.l, "edge", "edge", deps.EPS),
      ...buildGrid(0, centerY, palletWidth, centerL, orientationB.w, orientationB.l, "edge", "edge", deps.EPS),
      ...buildGrid(0, palletLength - sideL, palletWidth, sideL, orientationA.w, orientationA.l, "edge", "edge", deps.EPS),
    ];
    pushBase(`triple-h-${centerRows}-${sideRows}`, rects);
  }

  const all: Pattern[] = [];
  const seenAll = new Set<string>();

  for (const pattern of base) {
    const variants: Array<{ key: string; rects: Rect[] }> = [
      { key: "normal", rects: transformRects(pattern.rects, palletWidth, palletLength, "normal", deps.EPS) },
      { key: "mx", rects: transformRects(pattern.rects, palletWidth, palletLength, "mx", deps.EPS) },
      { key: "my", rects: transformRects(pattern.rects, palletWidth, palletLength, "my", deps.EPS) },
      { key: "r180", rects: transformRects(pattern.rects, palletWidth, palletLength, "r180", deps.EPS) },
    ];

    for (const variant of variants) {
      const normalized = deps.sortRects(variant.rects);
      const hash = deps.hashRects(normalized);
      if (seenAll.has(hash)) continue;
      seenAll.add(hash);
      all.push({ id: `${pattern.id}:${variant.key}`, rects: normalized });
    }
  }

  cache.set(cacheKey, all);
  return all;
}
