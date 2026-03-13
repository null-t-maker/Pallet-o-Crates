export interface ManualViewSeed {
  maxDim: number;
  orbitTargetY: number;
}

export function resolveNextManualViewSeed(
  current: ManualViewSeed | null,
  mode: "generation" | "manual",
  maxDim: number,
  orbitTargetY: number,
): ManualViewSeed | null {
  if (mode !== "manual") return null;
  if (!current) {
    return {
      maxDim,
      orbitTargetY,
    };
  }

  const nextMaxDim = Math.max(current.maxDim, maxDim);
  const nextOrbitTargetY = Math.max(current.orbitTargetY, orbitTargetY);
  if (
    Math.abs(nextMaxDim - current.maxDim) <= 1e-6
    && Math.abs(nextOrbitTargetY - current.orbitTargetY) <= 1e-6
  ) {
    return current;
  }

  return {
    maxDim: nextMaxDim,
    orbitTargetY: nextOrbitTargetY,
  };
}
