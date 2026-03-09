import type { CartonInput } from "./packerTypes";

export function countCartonUnits(cartons: CartonInput[]): number {
  return cartons.reduce((sum, carton) => sum + Math.max(0, Math.floor(carton.quantity)), 0);
}
