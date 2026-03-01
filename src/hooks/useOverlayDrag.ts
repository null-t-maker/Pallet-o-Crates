import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

export type DragPanel = "uiAccess" | "diagnostics";

interface ModalPosition {
  x: number;
  y: number;
}

interface DragState {
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface UseOverlayDragArgs {
  uiAccessModalRef: React.MutableRefObject<HTMLDivElement | null>;
  diagnosticsModalRef: React.MutableRefObject<HTMLDivElement | null>;
}

export function useOverlayDrag({
  uiAccessModalRef,
  diagnosticsModalRef,
}: UseOverlayDragArgs): {
  clearUiAccessPosition: () => void;
  clearDiagnosticsPosition: () => void;
  beginDrag: (panel: DragPanel, event: ReactPointerEvent<HTMLDivElement>) => void;
  handleDragPointerMove: (panel: DragPanel, event: ReactPointerEvent<HTMLDivElement>) => void;
  endDragPointer: (event: ReactPointerEvent<HTMLDivElement>) => void;
  uiAccessModalStyle: CSSProperties | undefined;
  diagnosticsModalStyle: CSSProperties | undefined;
} {
  const [uiAccessPosition, setUiAccessPosition] = useState<ModalPosition | null>(null);
  const [diagnosticsPosition, setDiagnosticsPosition] = useState<ModalPosition | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const clearUiAccessPosition = useCallback(() => {
    setUiAccessPosition(null);
  }, []);

  const clearDiagnosticsPosition = useCallback(() => {
    setDiagnosticsPosition(null);
  }, []);

  const beginDrag = useCallback((panel: DragPanel, event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    const targetRef = panel === "uiAccess" ? uiAccessModalRef.current : diagnosticsModalRef.current;
    if (!targetRef) return;

    const rect = targetRef.getBoundingClientRect();

    dragStateRef.current = {
      panel,
      pointerId: event.pointerId,
      width: rect.width,
      height: rect.height,
      startClientX: event.clientX,
      startClientY: event.clientY,
      initialX: rect.left,
      initialY: rect.top,
      active: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }, [diagnosticsModalRef, uiAccessModalRef]);

  const handleDragPointerMove = useCallback((panel: DragPanel, event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.panel !== panel || dragState.pointerId !== event.pointerId) return;

    if (!dragState.active) {
      const moveX = Math.abs(event.clientX - dragState.startClientX);
      const moveY = Math.abs(event.clientY - dragState.startClientY);
      if (moveX < 8 && moveY < 8) return;
      dragState.active = true;
      dragStateRef.current = dragState;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const edgePadding = 6;
    const minX = Math.min(edgePadding, viewportWidth - dragState.width - edgePadding);
    const maxX = Math.max(edgePadding, viewportWidth - dragState.width - edgePadding);
    const minY = Math.min(edgePadding, viewportHeight - dragState.height - edgePadding);
    const maxY = Math.max(edgePadding, viewportHeight - dragState.height - edgePadding);
    const x = clamp(dragState.initialX + (event.clientX - dragState.startClientX), minX, maxX);
    const y = clamp(dragState.initialY + (event.clientY - dragState.startClientY), minY, maxY);
    const nextPos: ModalPosition = { x, y };
    if (panel === "uiAccess") {
      setUiAccessPosition(nextPos);
    } else {
      setDiagnosticsPosition(nextPos);
    }
  }, []);

  const endDragPointer = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
  }, []);

  const uiAccessModalStyle = useMemo<CSSProperties | undefined>(
    () => (uiAccessPosition
      ? { left: `${uiAccessPosition.x}px`, top: `${uiAccessPosition.y}px`, transform: "none" }
      : undefined),
    [uiAccessPosition],
  );
  const diagnosticsModalStyle = useMemo<CSSProperties | undefined>(
    () => (diagnosticsPosition
      ? { left: `${diagnosticsPosition.x}px`, top: `${diagnosticsPosition.y}px`, transform: "none" }
      : undefined),
    [diagnosticsPosition],
  );

  return {
    clearUiAccessPosition,
    clearDiagnosticsPosition,
    beginDrag,
    handleDragPointerMove,
    endDragPointer,
    uiAccessModalStyle,
    diagnosticsModalStyle,
  };
}
