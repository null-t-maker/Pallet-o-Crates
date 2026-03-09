import type { MultiPackResult, PackResult } from "./packerTypes";
import { countCartonUnits } from "./templateLockAdaptiveUnits";

export function isBetterSinglePalletPack(
  candidate: PackResult,
  candidatePacked: number,
  currentBest: PackResult,
  currentBestPacked: number,
): boolean {
  if (candidatePacked !== currentBestPacked) return candidatePacked > currentBestPacked;
  const candidateUnpacked = countCartonUnits(candidate.unpacked);
  const currentUnpacked = countCartonUnits(currentBest.unpacked);
  if (candidateUnpacked !== currentUnpacked) return candidateUnpacked < currentUnpacked;
  if (Math.abs(candidate.totalHeight - currentBest.totalHeight) > 1e-6) {
    return candidate.totalHeight < currentBest.totalHeight;
  }
  if (candidate.layers.length !== currentBest.layers.length) {
    return candidate.layers.length < currentBest.layers.length;
  }
  return candidate.totalWeight < currentBest.totalWeight - 1e-6;
}

export function isBetterMultiPackResult(candidate: MultiPackResult, current: MultiPackResult): boolean {
  if (candidate.packedUnits !== current.packedUnits) return candidate.packedUnits > current.packedUnits;
  const candidateUnpacked = countCartonUnits(candidate.unpacked);
  const currentUnpacked = countCartonUnits(current.unpacked);
  if (candidateUnpacked !== currentUnpacked) return candidateUnpacked < currentUnpacked;
  if (candidate.pallets.length !== current.pallets.length) return candidate.pallets.length < current.pallets.length;
  if (Math.abs(candidate.maxHeight - current.maxHeight) > 1e-6) return candidate.maxHeight < current.maxHeight;
  return candidate.totalWeight < current.totalWeight - 1e-6;
}
