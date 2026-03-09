import type { CSSProperties } from "react";

export type DragPanel = "uiAccess" | "diagnostics";

export interface ModalPosition {
  x: number;
  y: number;
}

export interface DragState {
  panel: DragPanel;
  pointerId: number;
  width: number;
  height: number;
  startClientX: number;
  startClientY: number;
  initialX: number;
  initialY: number;
  active: boolean;
}

const DRAG_ACTIVATION_THRESHOLD_PX = 8;
const DRAG_EDGE_PADDING_PX = 6;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function shouldActivateDrag(state: DragState, clientX: number, clientY: number): boolean {
  const moveX = Math.abs(clientX - state.startClientX);
  const moveY = Math.abs(clientY - state.startClientY);
  return moveX >= DRAG_ACTIVATION_THRESHOLD_PX || moveY >= DRAG_ACTIVATION_THRESHOLD_PX;
}

export function computeDraggedPosition(
  state: DragState,
  clientX: number,
  clientY: number,
  viewportWidth: number,
  viewportHeight: number,
): ModalPosition {
  const minX = Math.min(DRAG_EDGE_PADDING_PX, viewportWidth - state.width - DRAG_EDGE_PADDING_PX);
  const maxX = Math.max(DRAG_EDGE_PADDING_PX, viewportWidth - state.width - DRAG_EDGE_PADDING_PX);
  const minY = Math.min(DRAG_EDGE_PADDING_PX, viewportHeight - state.height - DRAG_EDGE_PADDING_PX);
  const maxY = Math.max(DRAG_EDGE_PADDING_PX, viewportHeight - state.height - DRAG_EDGE_PADDING_PX);

  return {
    x: clamp(state.initialX + (clientX - state.startClientX), minX, maxX),
    y: clamp(state.initialY + (clientY - state.startClientY), minY, maxY),
  };
}

export function toModalStyle(position: ModalPosition | null): CSSProperties | undefined {
  return position
    ? { left: `${position.x}px`, top: `${position.y}px`, transform: "none" }
    : undefined;
}
