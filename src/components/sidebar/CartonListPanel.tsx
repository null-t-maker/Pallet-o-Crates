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
  onStartEdit: (carton: CartonInput) => void;
  onRemove: (cartonId: string) => void;
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
  onStartEdit,
  onRemove,
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
            className="carton-item"
            style={editingId === carton.id ? { borderColor: "var(--accent)" } : undefined}
          >
            <div className="carton-dot" style={{ backgroundColor: carton.color }} />
            <div className="carton-meta">
              <strong title={carton.title}>{carton.title}</strong>
              <span>
                {carton.length}x{carton.width}x{carton.height} mm
                <span className="meta-separator">|</span>
                {carton.weight} kg
                <span className="meta-separator">|</span>
                x{carton.quantity}
              </span>
            </div>
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
        ))}
      </div>
    </SectionPanel>
  );
};
