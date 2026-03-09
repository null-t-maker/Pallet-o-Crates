import type { PackedCarton, PalletInput } from "./packerTypes";
import type { PlacementRect, Rect } from "./packerCoreTypes";
import type { BoundsInsets, TryCenterShiftLayerDeps } from "./packerLayerStabilityTypes";

function centerShiftScore(
  bounds: Rect,
  pallet: PalletInput,
  insetsFromBounds: (bounds: Rect, palletWidth: number, palletLength: number) => BoundsInsets,
  eps: number,
): number {
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.l / 2;
  const dx = cx - pallet.width / 2;
  const dy = cy - pallet.length / 2;
  const distNorm = Math.hypot(dx, dy) / Math.max(Math.hypot(pallet.width / 2, pallet.length / 2), eps);
  const insets = insetsFromBounds(bounds, pallet.width, pallet.length);
  return (1 - distNorm) * 1100 + Math.max(0, insets.min) * 4 - Math.max(0, insets.max) * 0.2;
}

export function tryCenterShiftLayer(
  placements: PlacementRect[],
  cartons: PackedCarton[],
  below: PlacementRect[],
  pallet: PalletInput,
  deps: TryCenterShiftLayerDeps,
): void {
  if (placements.length === 0 || cartons.length !== placements.length) return;
  const bounds = deps.boundsOfRects(placements);
  if (!bounds) return;

  const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
  const maxDx = pallet.width - (bounds.x + bounds.w);
  const minDx = -bounds.x;
  const maxDy = pallet.length - (bounds.y + bounds.l);
  const minDy = -bounds.y;

  const targetDx = (pallet.width - bounds.w) / 2 - bounds.x;
  const targetDy = (pallet.length - bounds.l) / 2 - bounds.y;

  const belowBounds = below.length > 0 ? deps.boundsOfRects(below) : null;
  const xCandidates = new Set<number>([
    0,
    clamp(targetDx, minDx, maxDx),
    clamp(targetDx * 0.5, minDx, maxDx),
    clamp(minDx, minDx, maxDx),
    clamp(maxDx, minDx, maxDx),
  ]);
  const yCandidates = new Set<number>([
    0,
    clamp(targetDy, minDy, maxDy),
    clamp(targetDy * 0.5, minDy, maxDy),
    clamp(minDy, minDy, maxDy),
    clamp(maxDy, minDy, maxDy),
  ]);

  if (belowBounds) {
    const belowTargetDx = (belowBounds.x + belowBounds.w / 2) - (bounds.x + bounds.w / 2);
    const belowTargetDy = (belowBounds.y + belowBounds.l / 2) - (bounds.y + bounds.l / 2);
    xCandidates.add(clamp(belowTargetDx, minDx, maxDx));
    xCandidates.add(clamp((belowBounds.x + belowBounds.w) - (bounds.x + bounds.w), minDx, maxDx));
    xCandidates.add(clamp(belowBounds.x - bounds.x, minDx, maxDx));
    yCandidates.add(clamp(belowTargetDy, minDy, maxDy));
    yCandidates.add(clamp((belowBounds.y + belowBounds.l) - (bounds.y + bounds.l), minDy, maxDy));
    yCandidates.add(clamp(belowBounds.y - bounds.y, minDy, maxDy));
  }

  const validTranslation = (dx: number, dy: number): boolean => {
    for (let i = 0; i < placements.length; i++) {
      const placement = placements[i];
      const moved: Rect = {
        x: placement.x + dx,
        y: placement.y + dy,
        w: placement.w,
        l: placement.l,
      };
      if (moved.x < -deps.EPS || moved.y < -deps.EPS) return false;
      if (moved.x + moved.w > pallet.width + deps.EPS || moved.y + moved.l > pallet.length + deps.EPS) return false;
      if (below.length === 0) continue;

      const support = deps.analyzeSupport(moved, below);
      const supportOk = deps.hasFullSupport(support);
      if (!supportOk) return false;

      const carton = cartons[i];
      if (!deps.structuralSupportSafe(carton.weight, deps.areaOf(moved), support)) return false;
      const pressure = deps.pressureSafe(carton.weight, support, support.touching <= 1 ? 2.1 : 2.25);
      if (!pressure.ok) return false;
    }
    return true;
  };

  let bestDx = 0;
  let bestDy = 0;
  let bestScore = centerShiftScore(bounds, pallet, deps.insetsFromBounds, deps.EPS);

  for (const dxRaw of xCandidates) {
    for (const dyRaw of yCandidates) {
      const dx = Math.abs(dxRaw) < 0.25 ? 0 : dxRaw;
      const dy = Math.abs(dyRaw) < 0.25 ? 0 : dyRaw;
      if (!validTranslation(dx, dy)) continue;
      const movedBounds: Rect = {
        x: bounds.x + dx,
        y: bounds.y + dy,
        w: bounds.w,
        l: bounds.l,
      };
      const score = centerShiftScore(movedBounds, pallet, deps.insetsFromBounds, deps.EPS);
      if (score > bestScore + 0.5) {
        bestScore = score;
        bestDx = dx;
        bestDy = dy;
      }
    }
  }

  if (Math.abs(bestDx) < 0.25 && Math.abs(bestDy) < 0.25) return;

  for (const placement of placements) {
    placement.x += bestDx;
    placement.y += bestDy;
  }
  for (const carton of cartons) {
    carton.x += bestDx;
    carton.y += bestDy;
  }
}
