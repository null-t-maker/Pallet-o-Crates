import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface SectionPanelProps {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export const SectionPanel: React.FC<SectionPanelProps> = ({
  title,
  collapsed,
  onToggle,
  children,
  className,
}) => {
  return (
    <div className={`section-card${className ? ` ${className}` : ""}`}>
      <button type="button" className="section-titlebar" onClick={onToggle}>
        <span className="section-title" title={title}>{title}</span>
        <span className="section-arrow">
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {!collapsed && <div className="section-body">{children}</div>}
    </div>
  );
};
