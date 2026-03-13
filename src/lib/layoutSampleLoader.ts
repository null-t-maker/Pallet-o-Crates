import type { WorkflowMode } from "../components/Visualizer";
import type {
  CartonInput,
  ExtraPalletMode,
  ManualSpawnLevel,
  MultiPackResult,
  PackedCarton,
  PalletInput,
  PalletPackingStyle,
} from "./packer";
import { normalizePalletForPacking } from "./packerConfig";
import { sanitizeCarton } from "./packerShared";
import { buildTemplateResultFromPayload } from "./templateLock";
import { asRecord, buildPlacementOffsetsByIndex } from "./templateLockParsing";

const EPS = 1e-6;

export interface HydratedLayoutSample {
  descriptor: string | null;
  workflowMode: WorkflowMode;
  pallet: PalletInput;
  cartons: CartonInput[];
  result: MultiPackResult | null;
  manualCartons: PackedCarton[];
}

export type HydrateLayoutSampleResult =
  | { ok: true; value: HydratedLayoutSample }
  | { ok: false; error: string };

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isPackingStyle(value: unknown): value is PalletPackingStyle {
  return value === "centerCompact" || value === "edgeAligned";
}

function isExtraPalletMode(value: unknown): value is ExtraPalletMode {
  return value === "none" || value === "limitsOnly" || value === "full";
}

function isWorkflowMode(value: unknown): value is WorkflowMode {
  return value === "generation" || value === "manual";
}

function isManualSpawnLevel(value: unknown): value is ManualSpawnLevel {
  const record = asRecord(value);
  if (!record) return false;
  const quantity = asFiniteNumber(record.quantity);
  const zLevel = asFiniteNumber(record.zLevel);
  return quantity !== null && zLevel !== null;
}

function parseManualSpawnLevels(value: unknown): ManualSpawnLevel[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const levels = value
    .filter(isManualSpawnLevel)
    .map((entry) => {
      const record = entry as unknown as Record<string, unknown>;
      return {
        quantity: Math.max(0, Math.floor(asFiniteNumber(record.quantity) ?? 0)),
        zLevel: Math.max(0, Math.floor(asFiniteNumber(record.zLevel) ?? 0)),
      };
    })
    .filter((entry) => entry.quantity > 0);

  return levels.length > 0 ? levels : undefined;
}

function parsePallet(root: Record<string, unknown>): PalletInput | null {
  const palletRaw = asRecord(root.pallet);
  if (!palletRaw) return null;

  const width = asFiniteNumber(palletRaw.width);
  const length = asFiniteNumber(palletRaw.length);
  const maxHeight = asFiniteNumber(palletRaw.maxHeight);
  const maxWeight = asFiniteNumber(palletRaw.maxWeight);
  if (width === null || length === null || maxHeight === null || maxWeight === null) {
    return null;
  }

  return normalizePalletForPacking({
    width,
    length,
    maxHeight,
    maxWeight,
    packingStyle: isPackingStyle(palletRaw.packingStyle) ? palletRaw.packingStyle : "edgeAligned",
    extraPalletMode: isExtraPalletMode(palletRaw.extraPalletMode) ? palletRaw.extraPalletMode : "none",
  });
}

function parseCartons(root: Record<string, unknown>): CartonInput[] | null {
  const cartonsRaw = root.cartonTypes;
  if (!Array.isArray(cartonsRaw)) return null;

  const parsed = cartonsRaw.map((entry, index) => {
    const cartonRaw = asRecord(entry);
    if (!cartonRaw) return null;

    const width = asFiniteNumber(cartonRaw.width);
    const length = asFiniteNumber(cartonRaw.length);
    const height = asFiniteNumber(cartonRaw.height);
    const weight = asFiniteNumber(cartonRaw.weight);
    const quantity = asFiniteNumber(cartonRaw.quantity);
    if (width === null || length === null || height === null || weight === null || quantity === null) {
      return null;
    }

    const carton: CartonInput = {
      id: asNonEmptyString(cartonRaw.id) ?? `sample-carton-${index + 1}`,
      title: asNonEmptyString(cartonRaw.title) ?? `Sample carton ${index + 1}`,
      width,
      length,
      height,
      weight,
      quantity,
      color: asNonEmptyString(cartonRaw.color) ?? "#43b66f",
    };

    if (typeof cartonRaw.enabled === "boolean") {
      carton.enabled = cartonRaw.enabled;
    }
    if (
      cartonRaw.uprightPolicy === "never"
      || cartonRaw.uprightPolicy === "tailOnly"
      || cartonRaw.uprightPolicy === "prefer"
    ) {
      carton.uprightPolicy = cartonRaw.uprightPolicy;
    }
    if (typeof cartonRaw.allowUpright === "boolean") {
      carton.allowUpright = cartonRaw.allowUpright;
    }
    const manualSpawnLevels = parseManualSpawnLevels(cartonRaw.manualSpawnLevels);
    if (manualSpawnLevels) {
      carton.manualSpawnLevels = manualSpawnLevels;
    }

    return sanitizeCarton(carton);
  });

  if (parsed.some((entry) => entry === null)) return null;
  return parsed as CartonInput[];
}

function inferWorkflowMode(root: Record<string, unknown>, pallet: PalletInput): WorkflowMode {
  if (isWorkflowMode(root.workflowMode)) return root.workflowMode;
  const placementsRaw = Array.isArray(root.placements) ? root.placements : [];
  const outOfBounds = placementsRaw.some((entry) => {
    const placement = asRecord(entry);
    if (!placement) return false;
    const x = asFiniteNumber(placement.x);
    const y = asFiniteNumber(placement.y);
    const w = asFiniteNumber(placement.w);
    const l = asFiniteNumber(placement.l);
    if (x === null || y === null || w === null || l === null) return false;
    return (
      x < -EPS
      || y < -EPS
      || x + w > pallet.width + EPS
      || y + l > pallet.length + EPS
    );
  });
  return outOfBounds ? "manual" : "generation";
}

function parseManualCartons(root: Record<string, unknown>): PackedCarton[] | null {
  const placementsRaw = root.placements;
  if (!Array.isArray(placementsRaw)) return null;

  const offsetsByIndex = buildPlacementOffsetsByIndex(root);
  const parsed = placementsRaw.map((entry, index) => {
    const placement = asRecord(entry);
    if (!placement) return null;

    const x = asFiniteNumber(placement.x);
    const y = asFiniteNumber(placement.y);
    const z = asFiniteNumber(placement.z);
    const w = asFiniteNumber(placement.w);
    const l = asFiniteNumber(placement.l);
    const h = asFiniteNumber(placement.h);
    const weight = asFiniteNumber(placement.weight);
    if (
      x === null || y === null || z === null
      || w === null || l === null || h === null
      || weight === null
    ) {
      return null;
    }

    const palletIndex = Math.max(0, Math.floor(asFiniteNumber(placement.palletIndex) ?? 0));
    const fallbackOffsetX = asFiniteNumber(placement.offsetX) ?? 0;
    const fallbackOffsetY = asFiniteNumber(placement.offsetY) ?? 0;
    const offset = offsetsByIndex.get(palletIndex) ?? {
      offsetX: fallbackOffsetX,
      offsetY: fallbackOffsetY,
    };

    return {
      id: asNonEmptyString(placement.id) ?? `manual-sample-${index + 1}`,
      typeId: asNonEmptyString(placement.typeId) ?? `sample-type-${index + 1}`,
      title: asNonEmptyString(placement.title) ?? `Sample carton ${index + 1}`,
      x: x + offset.offsetX,
      y: y + offset.offsetY,
      z,
      w,
      l,
      h,
      weight,
      color: asNonEmptyString(placement.color) ?? "#43b66f",
    } satisfies PackedCarton;
  });

  if (parsed.some((entry) => entry === null)) return null;
  return parsed as PackedCarton[];
}

export function hydrateLoadedLayoutSample(payload: unknown): HydrateLayoutSampleResult {
  const root = asRecord(payload);
  if (!root) {
    return {
      ok: false,
      error: "Loaded sample payload is not a JSON object.",
    };
  }

  const pallet = parsePallet(root);
  if (!pallet) {
    return {
      ok: false,
      error: "Loaded sample is missing valid pallet dimensions or limits.",
    };
  }

  const cartons = parseCartons(root);
  if (!cartons) {
    return {
      ok: false,
      error: "Loaded sample is missing valid carton type definitions.",
    };
  }

  const workflowMode = inferWorkflowMode(root, pallet);
  const descriptor = asNonEmptyString(root.descriptor);

  if (workflowMode === "manual") {
    const manualCartons = parseManualCartons(root);
    if (!manualCartons) {
      return {
        ok: false,
        error: "Loaded manual sample contains invalid placement rows.",
      };
    }

    return {
      ok: true,
      value: {
        descriptor,
        workflowMode,
        pallet,
        cartons,
        result: null,
        manualCartons,
      },
    };
  }

  const placementsRaw = root.placements;
  if (!Array.isArray(placementsRaw)) {
    return {
      ok: false,
      error: "Loaded generation sample is missing placements.",
    };
  }

  let result: MultiPackResult | null = null;
  if (placementsRaw.length > 0) {
    const built = buildTemplateResultFromPayload(payload, pallet, cartons);
    if (!built) {
      return {
        ok: false,
        error: "Loaded generation sample placements are invalid for the saved pallet/carton data.",
      };
    }
    result = built.result;
  }

  return {
    ok: true,
    value: {
      descriptor,
      workflowMode,
      pallet,
      cartons,
      result,
      manualCartons: [],
    },
  };
}
