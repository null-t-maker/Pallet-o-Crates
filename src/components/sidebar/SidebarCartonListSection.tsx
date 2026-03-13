import type { FC } from "react";
import { CartonListPanel } from "./CartonListPanel";
import type { SidebarSectionsProps } from "./sidebarSectionsTypes";

type SidebarCartonListSectionProps = Pick<
  SidebarSectionsProps,
  | "cartons"
  | "totalCartons"
  | "collapsedSections"
  | "toggleSection"
  | "editing"
  | "hasManyCartonRows"
  | "t"
  | "handleStartEdit"
  | "handleRemoveCarton"
  | "handleToggleCartonEnabled"
>;

export const SidebarCartonListSection: FC<SidebarCartonListSectionProps> = ({
  cartons,
  totalCartons,
  collapsedSections,
  toggleSection,
  editing,
  hasManyCartonRows,
  t,
  handleStartEdit,
  handleRemoveCarton,
  handleToggleCartonEnabled,
}) => {
  if (cartons.length === 0) return null;

  return (
    <CartonListPanel
      title={t.cartonsWithCount(totalCartons)}
      collapsed={collapsedSections.cartons}
      onToggle={() => toggleSection("cartons")}
      cartons={cartons}
      editingId={editing?.id ?? null}
      hasManyRows={hasManyCartonRows}
      editLabel={t.edit}
      removeLabel={t.remove}
      cartonGenerationToggleLabel={t.cartonGenerationToggleLabel ?? "Use in generation"}
      onStartEdit={handleStartEdit}
      onRemove={handleRemoveCarton}
      onToggleEnabled={handleToggleCartonEnabled}
    />
  );
};
