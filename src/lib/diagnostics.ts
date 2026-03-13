import type { MultiPackResult, PackedCarton, PalletInput } from "./packerTypes";

export interface DiagnosticsSummary {
  requestedUnits: number;
  packedUnits: number;
  overlapCount: number;
  boundsViolations: number;
  limitsExceeded: boolean;
  hasIssues: boolean;
}

export interface DiagnosticsTelemetry {
  fps: number | null;
  cpuSystemUsage: number | null;
  cpuAppUsage: number | null;
  memorySystemUsedMb: number | null;
  memorySystemTotalMb: number | null;
  memoryAppWorkingSetMb: number | null;
  memoryAppPrivateMb: number | null;
}

function overlapArea2D(a: PackedCarton, b: PackedCarton): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.l, b.y + b.l);
  return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
}

function overlapVolume3D(a: PackedCarton, b: PackedCarton): number {
  const area = overlapArea2D(a, b);
  if (area <= 1e-6) return 0;
  const z1 = Math.max(a.z, b.z);
  const z2 = Math.min(a.z + a.h, b.z + b.h);
  const h = Math.max(0, z2 - z1);
  return area * h;
}

export function buildDiagnosticsSummary(
  result: MultiPackResult | null,
  pallet: Pick<PalletInput, "width" | "length" | "maxHeight" | "maxWeight">,
): DiagnosticsSummary | null {
  if (!result) return null;

  const packedGlobal: PackedCarton[] = [];
  let overlapCount = 0;
  let boundsViolations = 0;

  for (const placed of result.pallets) {
    const localPacked = placed.result.layers.flatMap((layer) => layer.cartons);
    for (const carton of localPacked) {
      if (
        carton.x < -1e-6
        || carton.y < -1e-6
        || carton.x + carton.w > pallet.width + 1e-6
        || carton.y + carton.l > pallet.length + 1e-6
        || carton.z < -1e-6
        || carton.z + carton.h > pallet.maxHeight + 1e-6
      ) {
        boundsViolations++;
      }

      packedGlobal.push({
        ...carton,
        x: carton.x + placed.offsetX,
        y: carton.y + placed.offsetY,
      });
    }
  }

  for (let i = 0; i < packedGlobal.length; i++) {
    for (let j = i + 1; j < packedGlobal.length; j++) {
      if (overlapVolume3D(packedGlobal[i], packedGlobal[j]) > 1e-6) {
        overlapCount++;
      }
    }
  }

  const limitsExceeded = result.pallets.some(
    (placed) =>
      placed.result.totalWeight > pallet.maxWeight + 1e-6
      || placed.result.totalHeight > pallet.maxHeight + 1e-6,
  );

  return {
    requestedUnits: result.requestedUnits,
    packedUnits: result.packedUnits,
    overlapCount,
    boundsViolations,
    limitsExceeded,
    hasIssues: overlapCount > 0 || boundsViolations > 0 || limitsExceeded,
  };
}
