import type { CSSProperties } from "react";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeTopbarDropdownStyle(
  anchor: HTMLElement | null,
  viewportWidth: number,
  preferredWidth: number,
  zoomFactor: number,
): CSSProperties | undefined {
  if (!anchor || !Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    return undefined;
  }

  const safeZoom = Number.isFinite(zoomFactor) && zoomFactor > 0 ? zoomFactor : 1;
  const rect = anchor.getBoundingClientRect();
  const normalizedViewportWidth = viewportWidth / safeZoom;
  const right = rect.right / safeZoom;
  const bottom = rect.bottom / safeZoom;
  const dropdownWidth = Math.min(preferredWidth, Math.max(200, normalizedViewportWidth - 24));
  const minLeft = 12;
  const maxLeft = Math.max(minLeft, normalizedViewportWidth - dropdownWidth - 12);
  const left = clamp(right - dropdownWidth, minLeft, maxLeft);
  const top = Math.max(8, bottom + 8);

  return {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
  };
}
