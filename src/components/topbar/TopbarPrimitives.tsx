import type { CSSProperties, ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import logoIcon from "../../assets/Pallet-o-Crates.svg";

export function TopbarActionButton({
  isOpen,
  title,
  onClick,
  children,
}: {
  isOpen: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`topbar-action-btn ${isOpen ? "is-open" : ""}`}
      title={title}
      aria-expanded={isOpen}
      onClick={onClick}
    >
      {children}
      <span className="topbar-action-arrow">
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </span>
    </button>
  );
}

export function TopbarDropdown({
  className,
  style,
  children,
}: {
  className: string;
  style: CSSProperties | undefined;
  children: ReactNode;
}) {
  return (
    <div className={`section-card topbar-dropdown ${className}`} style={style}>
      {children}
    </div>
  );
}

export function TopbarBrand({
  refreshAppLabel,
  refreshApp,
  updateCheckTitle,
  openUpdateCheckModal,
  appTagline,
}: {
  refreshAppLabel: string;
  refreshApp: () => void;
  updateCheckTitle: string;
  openUpdateCheckModal: () => void;
  appTagline: string;
}) {
  return (
    <div
      className="topbar-brand"
      role="button"
      tabIndex={0}
      title={refreshAppLabel}
      aria-label={refreshAppLabel}
      onClick={refreshApp}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          refreshApp();
        }
      }}
    >
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
          <button
            type="button"
            className="topbar-version-btn"
            title={updateCheckTitle}
            aria-label={updateCheckTitle}
            onClick={(event) => {
              event.stopPropagation();
              openUpdateCheckModal();
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
            }}
          >
            v0.1.0
          </button>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 4 }}>{appTagline}</p>
      </div>
    </div>
  );
}
