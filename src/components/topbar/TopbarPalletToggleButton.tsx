import { ChevronDown, ChevronRight } from "lucide-react";

interface TopbarPalletToggleButtonProps {
  palletGenerationOpen: boolean;
  togglePalletGeneration: () => void;
  palletPanelLabel: string;
}

export function TopbarPalletToggleButton({
  palletGenerationOpen,
  togglePalletGeneration,
  palletPanelLabel,
}: TopbarPalletToggleButtonProps) {
  return (
    <button
      type="button"
      className={`topbar-action-btn topbar-pallet-btn ${palletGenerationOpen ? "is-open" : ""}`}
      title={palletPanelLabel}
      aria-expanded={palletGenerationOpen}
      onClick={togglePalletGeneration}
    >
      <span className="topbar-action-label" title={palletPanelLabel}>{palletPanelLabel}</span>
      <span className="topbar-action-arrow">
        {palletGenerationOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </span>
    </button>
  );
}
