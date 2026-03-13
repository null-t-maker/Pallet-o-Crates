import type { FC } from "react";
import { SectionPanel } from "./SectionPanel";
import { CartonForm } from "../CartonForm";
import type { SidebarSectionsProps } from "./sidebarSectionsTypes";

type SidebarCartonTypeSectionProps = Pick<
  SidebarSectionsProps,
  | "workflowMode"
  | "collapsedSections"
  | "toggleSection"
  | "t"
  | "cartons"
  | "editing"
  | "setEditing"
  | "handleAdd"
  | "handleEdit"
>;

export const SidebarCartonTypeSection: FC<SidebarCartonTypeSectionProps> = ({
  workflowMode,
  collapsedSections,
  toggleSection,
  t,
  cartons,
  editing,
  setEditing,
  handleAdd,
  handleEdit,
}) => (
  <SectionPanel
    title={editing ? t.editCartonType : t.addCartonType}
    collapsed={collapsedSections.cartonType}
    onToggle={() => toggleSection("cartonType")}
    className={`dropdown-section${editing ? " is-editing" : ""}`}
  >
    <CartonForm
      showManualSpawnControls={workflowMode === "manual"}
      onAdd={handleAdd}
      onEdit={handleEdit}
      editing={editing}
      existingCartonCount={cartons.length}
      onCancelEdit={() => setEditing(null)}
      t={t}
    />
  </SectionPanel>
);
