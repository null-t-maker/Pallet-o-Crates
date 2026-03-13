import type { CartonInput } from "./packerTypes";

export function isCartonGenerationEnabled(carton: CartonInput): boolean {
  return carton.enabled !== false;
}

export function filterGenerationEnabledCartons(cartons: CartonInput[]): CartonInput[] {
  return cartons.filter(isCartonGenerationEnabled);
}
