import type { CartonInput, ManualSpawnLevel } from "./packerTypes";

function sanitizeSpawnLevelValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function buildStoredManualSpawnLevels(
  quantity: number,
  levels: ManualSpawnLevel[],
): ManualSpawnLevel[] | undefined {
  const targetQuantity = Math.max(0, Math.floor(quantity));
  const sanitized = levels
    .map((level) => ({
      quantity: sanitizeSpawnLevelValue(level.quantity),
      zLevel: sanitizeSpawnLevelValue(level.zLevel),
    }))
    .filter((level) => level.quantity > 0);

  if (targetQuantity <= 0) return undefined;

  let remaining = targetQuantity;
  const normalized: ManualSpawnLevel[] = [];
  for (const level of sanitized) {
    if (remaining <= 0) break;
    const used = Math.min(level.quantity, remaining);
    if (used <= 0) continue;
    normalized.push({
      quantity: used,
      zLevel: level.zLevel,
    });
    remaining -= used;
  }

  if (remaining > 0) {
    const zZeroLevel = normalized.find((level) => level.zLevel === 0);
    if (zZeroLevel) {
      zZeroLevel.quantity += remaining;
    } else {
      normalized.unshift({
        quantity: remaining,
        zLevel: 0,
      });
    }
  }

  normalized.sort((left, right) => left.zLevel - right.zLevel);

  if (normalized.length === 1 && normalized[0].zLevel === 0 && normalized[0].quantity === targetQuantity) {
    return undefined;
  }

  return normalized;
}

export function resolveManualSpawnLevels(carton: CartonInput): ManualSpawnLevel[] {
  const stored = buildStoredManualSpawnLevels(carton.quantity, carton.manualSpawnLevels ?? []);
  if (!stored || stored.length === 0) {
    return [{
      quantity: Math.max(0, Math.floor(carton.quantity)),
      zLevel: 0,
    }];
  }
  return stored;
}

export function buildManualSpawnZPlan(carton: CartonInput): number[] {
  const levels = resolveManualSpawnLevels(carton);
  const unitCount = Math.max(0, Math.floor(carton.quantity));
  const plan: number[] = [];

  for (const level of levels) {
    const z = level.zLevel * carton.height;
    for (let index = 0; index < level.quantity && plan.length < unitCount; index += 1) {
      plan.push(z);
    }
  }

  while (plan.length < unitCount) {
    plan.push(0);
  }

  return plan;
}
