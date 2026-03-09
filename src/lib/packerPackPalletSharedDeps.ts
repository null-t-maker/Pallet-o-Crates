import { buildPackerRuntimeWrappers } from "./packerRuntimeWrappers";
import { createPackPalletSharedCoreDeps } from "./packerPackPalletSharedDepsBuilders";
import {
  PACKER_EPS,
  PACKER_MAX_RECOMMENDED_EDGE_SETBACK_MM,
  PACKER_MIN_FULL_SUPPORT_RATIO,
  PACKER_PREFERRED_MIN_EDGE_SETBACK_MM,
  type PackPalletSharedDeps,
} from "./packerPackPalletSharedDepsTypes";

export type { PackPalletSharedDeps } from "./packerPackPalletSharedDepsTypes";

export function createPackPalletSharedDeps(): PackPalletSharedDeps {
  const runtime = buildPackerRuntimeWrappers(PACKER_EPS, PACKER_MIN_FULL_SUPPORT_RATIO);
  const core = createPackPalletSharedCoreDeps({
    EPS: PACKER_EPS,
    minFullSupportRatio: PACKER_MIN_FULL_SUPPORT_RATIO,
    preferredMinEdgeSetbackMm: PACKER_PREFERRED_MIN_EDGE_SETBACK_MM,
    maxRecommendedEdgeSetbackMm: PACKER_MAX_RECOMMENDED_EDGE_SETBACK_MM,
    runtime,
  });

  return {
    EPS: PACKER_EPS,
    ...core,
    isWrapFriendlyLayerShape: runtime.isWrapFriendlyLayerShape,
    mirrorHashes: runtime.mirrorHashes,
    centerStats: runtime.centerStats,
    wallStats: runtime.wallStats,
  };
}
