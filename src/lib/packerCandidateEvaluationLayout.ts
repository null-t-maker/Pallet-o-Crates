import type { LayerState, Rect } from "./packerCoreTypes";
import type { EvaluateCandidateDeps } from "./packerCandidateEvaluationTypes";
import type { PalletInput } from "./packerTypes";

export function resolveCandidateLayerBounds(
  rects: Rect[],
  state: LayerState,
  pallet: PalletInput,
  deps: EvaluateCandidateDeps,
): Rect | null {
  const layerBounds = deps.boundsOfRects(rects);
  if (!layerBounds) return null;

  const supportBounds = deps.boundsOfRects(state.prevPlacements);
  if (supportBounds && !deps.isWithinSupportEnvelope(layerBounds, supportBounds)) {
    return null;
  }
  if (deps.hasWrapBlockingEdgeProtrusion(rects, pallet.width, pallet.length)) {
    return null;
  }

  return layerBounds;
}
