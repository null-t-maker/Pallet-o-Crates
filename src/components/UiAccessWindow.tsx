import { type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { X } from "lucide-react";

interface UiAccessWindowProps {
  modalRef: React.MutableRefObject<HTMLDivElement | null>;
  modalStyle: CSSProperties | undefined;
  uiZoomAndScaleLabel: string;
  closeLabel: string;
  closeUiZoomAndScaleLabel: string;
  uiScaleLabel: string;
  uiZoomLabel: string;
  uiScale: number;
  uiZoom: number;
  uiScaleMin: number;
  uiScaleMax: number;
  uiZoomMin: number;
  uiZoomMax: number;
  onSetUiScale: (value: number) => void;
  onSetUiZoom: (value: number) => void;
  onClose: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function UiAccessWindow({
  modalRef,
  modalStyle,
  uiZoomAndScaleLabel,
  closeLabel,
  closeUiZoomAndScaleLabel,
  uiScaleLabel,
  uiZoomLabel,
  uiScale,
  uiZoom,
  uiScaleMin,
  uiScaleMax,
  uiZoomMin,
  uiZoomMax,
  onSetUiScale,
  onSetUiZoom,
  onClose,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: UiAccessWindowProps) {
  return (
    <div
      ref={modalRef}
      className="overlay section-card floating-window ui-access-modal"
      style={modalStyle}
      aria-label={uiZoomAndScaleLabel}
    >
      <div
        className="floating-window-title"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <span className="section-title" title={uiZoomAndScaleLabel}>{uiZoomAndScaleLabel}</span>
        <button
          type="button"
          className="floating-window-close"
          title={closeLabel}
          aria-label={closeUiZoomAndScaleLabel}
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      <div className="section-body floating-window-body">
        <div className="ui-access-row">
          <span className="ui-access-label">{uiScaleLabel}</span>
          <input
            className="ui-access-slider"
            type="range"
            min={Math.round(uiScaleMin * 100)}
            max={Math.round(uiScaleMax * 100)}
            step={1}
            value={Math.round(uiScale * 100)}
            onChange={(event) => {
              const next = clamp(Number(event.target.value) / 100, uiScaleMin, uiScaleMax);
              onSetUiScale(next);
            }}
          />
          <span className="ui-access-value">{Math.round(uiScale * 100)}%</span>
          <button
            type="button"
            className="ui-access-reset"
            onClick={() => onSetUiScale(1)}
            disabled={Math.abs(uiScale - 1) < 0.005}
          >
            100%
          </button>
        </div>

        <div className="ui-access-row">
          <span className="ui-access-label">{uiZoomLabel}</span>
          <input
            className="ui-access-slider"
            type="range"
            min={Math.round(uiZoomMin * 100)}
            max={Math.round(uiZoomMax * 100)}
            step={1}
            value={Math.round(uiZoom * 100)}
            onChange={(event) => {
              const next = clamp(Number(event.target.value) / 100, uiZoomMin, uiZoomMax);
              onSetUiZoom(next);
            }}
          />
          <span className="ui-access-value">{Math.round(uiZoom * 100)}%</span>
          <button
            type="button"
            className="ui-access-reset"
            onClick={() => onSetUiZoom(1)}
            disabled={Math.abs(uiZoom - 1) < 0.005}
          >
            100%
          </button>
        </div>
      </div>
    </div>
  );
}
