import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  computeDraggedPosition,
  type DragPanel,
  type DragState,
  type ModalPosition,
  shouldActivateDrag,
  toModalStyle,
} from "./overlayDragHelpers";
export type { DragPanel };

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

    if (!dragState.active && shouldActivateDrag(dragState, event.clientX, event.clientY)) {
      dragStateRef.current = { ...dragState, active: true };
    } else if (!dragState.active) {
      return;
    }

    const nextPos = computeDraggedPosition(
      dragState,
      event.clientX,
      event.clientY,
      window.innerWidth,
      window.innerHeight,
    );
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

  const uiAccessModalStyle = useMemo<CSSProperties | undefined>(() => toModalStyle(uiAccessPosition), [uiAccessPosition]);
  const diagnosticsModalStyle = useMemo<CSSProperties | undefined>(() => toModalStyle(diagnosticsPosition), [diagnosticsPosition]);

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
