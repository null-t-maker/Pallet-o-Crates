import type { FC } from "react";
import { SectionPanel } from "./SectionPanel";
import { PalletForm } from "../PalletForm";
import type { SidebarSectionsProps } from "./sidebarSectionsTypes";

type SidebarPalletSectionProps = Pick<
  SidebarSectionsProps,
  | "collapsedSections"
  | "toggleSection"
  | "t"
  | "pallet"
  | "setPallet"
  | "showExtraPalletMode"
>;

export const SidebarPalletSection: FC<SidebarPalletSectionProps> = ({
  collapsedSections,
  toggleSection,
  t,
  pallet,
  setPallet,
  showExtraPalletMode,
}) => (
  <SectionPanel
    title={t.palletDimensions}
    collapsed={collapsedSections.pallet}
    onToggle={() => toggleSection("pallet")}
    className="dropdown-section"
  >
    <PalletForm
      pallet={pallet}
      onChange={setPallet}
      t={t}
      showExtraPalletMode={showExtraPalletMode}
    />
  </SectionPanel>
);
