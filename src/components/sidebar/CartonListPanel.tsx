import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { CartonInput } from "../../lib/packer";
import { SectionPanel } from "./SectionPanel";

interface CartonListPanelProps {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  cartons: CartonInput[];
  editingId: string | null;
  hasManyRows: boolean;
  editLabel: string;
  removeLabel: string;
  cartonGenerationToggleLabel: string;
  onStartEdit: (carton: CartonInput) => void;
  onRemove: (cartonId: string) => void;
  onToggleEnabled: (cartonId: string) => void;
}

export const CartonListPanel: React.FC<CartonListPanelProps> = ({
  title,
  collapsed,
  onToggle,
  cartons,
  editingId,
  hasManyRows,
  editLabel,
  removeLabel,
  cartonGenerationToggleLabel,
  onStartEdit,
  onRemove,
  onToggleEnabled,
}) => {
  return (
    <SectionPanel
      title={title}
      collapsed={collapsed}
      onToggle={onToggle}
      className={`carton-list-section ${collapsed ? "collapsed" : "expanded"}${hasManyRows ? " has-inner-scroll" : ""}`}
    >
      <div className="carton-list-scroll">
        {cartons.map((carton) => (
          <div
            key={carton.id}
            className={`carton-item${carton.enabled === false ? " is-disabled" : ""}`}
            style={editingId === carton.id ? { borderColor: "var(--accent)" } : undefined}
          >
            <div className="carton-item-titlebar">
              <strong className="carton-item-title" title={carton.title}>{carton.title}</strong>
              <div className="carton-item-actions">
                <button
                  type="button"
                  className={`carton-switch${carton.enabled === false ? " is-off" : " is-on"}`}
                  role="switch"
                  aria-checked={carton.enabled !== false}
                  aria-label={cartonGenerationToggleLabel}
                  title={cartonGenerationToggleLabel}
                  onClick={() => onToggleEnabled(carton.id)}
                >
                  <span className="carton-switch-track">
                    <span className="carton-switch-thumb" />
                  </span>
                </button>
                <button
                  className="outline"
                  style={{ padding: 5, borderColor: "var(--text-muted)" }}
                  onClick={() => onStartEdit(carton)}
                  title={editLabel}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="danger"
                  onClick={() => onRemove(carton.id)}
                  title={removeLabel}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="carton-item-body">
              <div className="carton-dot" style={{ backgroundColor: carton.color }} />
              <div className="carton-meta">
                <span>
                  {carton.length}x{carton.width}x{carton.height} mm
                  <span className="meta-separator">|</span>
                  {carton.weight} kg
                  <span className="meta-separator">|</span>
                  x{carton.quantity}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionPanel>
  );
};
