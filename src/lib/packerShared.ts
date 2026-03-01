import type { CartonInput, PackedCarton } from "./packerTypes";

export function sanitizeCarton(carton: CartonInput): CartonInput {
  const uprightPolicy = carton.uprightPolicy === "never"
    || carton.uprightPolicy === "tailOnly"
    || carton.uprightPolicy === "prefer"
    ? carton.uprightPolicy
    : (carton.allowUpright === false ? "never" : "prefer");
  return {
    ...carton,
    width: Math.max(1, carton.width),
    length: Math.max(1, carton.length),
    height: Math.max(1, carton.height),
    weight: Math.max(0.01, carton.weight),
    quantity: Math.max(0, Math.floor(carton.quantity)),
    uprightPolicy,
    allowUpright: uprightPolicy !== "never",
  };
}

export function computeTotalPackedHeight(placed: PackedCarton[]): number {
  return placed.reduce((max, carton) => Math.max(max, carton.z + carton.h), 0);
}

export function countUnpackedUnits(unpacked: CartonInput[]): number {
  return unpacked.reduce((sum, carton) => sum + Math.max(0, carton.quantity), 0);
}

