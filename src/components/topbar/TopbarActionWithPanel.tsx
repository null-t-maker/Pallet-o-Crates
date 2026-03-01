import type { CSSProperties, MutableRefObject, ReactNode } from "react";
import { TopbarActionButton, TopbarDropdown } from "./TopbarPrimitives";

interface TopbarActionWithPanelProps {
  wrapperClassName: string;
  navRef: MutableRefObject<HTMLDivElement | null>;
  isOpen: boolean;
  title: string;
  onToggle: () => void;
  dropdownClassName: string;
  dropdownStyle: CSSProperties | undefined;
  children: ReactNode;
  buttonContent?: ReactNode;
}

export function TopbarActionWithPanel({
  wrapperClassName,
  navRef,
  isOpen,
  title,
  onToggle,
  dropdownClassName,
  dropdownStyle,
  children,
  buttonContent,
}: TopbarActionWithPanelProps) {
  return (
    <div className={`topbar-action-with-panel ${wrapperClassName}`} ref={navRef}>
      <TopbarActionButton
        isOpen={isOpen}
        title={title}
        onClick={onToggle}
      >
        {buttonContent ?? <span className="topbar-action-label" title={title}>{title}</span>}
      </TopbarActionButton>
      {isOpen && (
        <TopbarDropdown className={dropdownClassName} style={dropdownStyle}>
          {children}
        </TopbarDropdown>
      )}
    </div>
  );
}
