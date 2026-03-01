import React from "react";
import logoIcon from "../../assets/Pallet-o-Crates.svg";

interface SidebarHeaderProps {
  appTagline: string;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ appTagline }) => {
  return (
    <div className="sidebar-header">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
        <img
          src={logoIcon}
          alt="Pallet-o-Crates logo"
          width={42}
          height={42}
          style={{ display: "block", flexShrink: 0, transform: "translateY(-2px)" }}
        />
        <div style={{ minWidth: 0 }}>
          <h1 style={{ color: "var(--accent)", display: "flex", alignItems: "baseline", gap: 10, fontSize: "1.4rem", margin: 0, lineHeight: 1.08 }}>
            <span>Pallet-o-Crates</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.02em" }}>
              v0.1.0
            </span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 4 }}>{appTagline}</p>
        </div>
      </div>
    </div>
  );
};
