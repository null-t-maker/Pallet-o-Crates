import React from "react";
import type { CartonInput } from "../../lib/packer";

export type SidebarSectionKey = "language" | "sampleDatabase" | "pallet" | "cartonType" | "cartons";

interface UseSidebarStateArgs {
  cartons: CartonInput[];
  setCartons: (c: CartonInput[]) => void;
}

export function useSidebarState({
  cartons,
  setCartons,
}: UseSidebarStateArgs): {
  editing: CartonInput | null;
  setEditing: React.Dispatch<React.SetStateAction<CartonInput | null>>;
  collapsedSections: Record<SidebarSectionKey, boolean>;
  toggleSection: (key: SidebarSectionKey) => void;
  handleAdd: (c: CartonInput) => void;
  handleEdit: (updated: CartonInput) => void;
  handleStartEdit: (c: CartonInput) => void;
  handleRemoveCarton: (cartonId: string) => void;
  handleToggleCartonEnabled: (cartonId: string) => void;
  totalCartons: number;
  hasManyCartonRows: boolean;
} {
  const [editing, setEditing] = React.useState<CartonInput | null>(null);
  const [collapsedSections, setCollapsedSections] = React.useState<Record<SidebarSectionKey, boolean>>({
    language: false,
    sampleDatabase: true,
    pallet: false,
    cartonType: false,
    cartons: false,
  });

  const toggleSection = React.useCallback((key: SidebarSectionKey) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleAdd = React.useCallback((carton: CartonInput) => {
    setCartons([...cartons, carton]);
  }, [cartons, setCartons]);

  const handleEdit = React.useCallback((updated: CartonInput) => {
    setCartons(cartons.map((carton) => carton.id === updated.id ? updated : carton));
    setEditing(null);
  }, [cartons, setCartons]);

  const handleStartEdit = React.useCallback((carton: CartonInput) => {
    setEditing(carton);
  }, []);

  const handleRemoveCarton = React.useCallback((cartonId: string) => {
    setCartons(cartons.filter((carton) => carton.id !== cartonId));
    setEditing((prev) => (prev?.id === cartonId ? null : prev));
  }, [cartons, setCartons]);

  const handleToggleCartonEnabled = React.useCallback((cartonId: string) => {
    setCartons(cartons.map((carton) => (
      carton.id === cartonId
        ? { ...carton, enabled: carton.enabled === false }
        : carton
    )));
    setEditing((prev) => (
      prev?.id === cartonId
        ? { ...prev, enabled: prev.enabled === false }
        : prev
    ));
  }, [cartons, setCartons]);

  const totalCartons = cartons.reduce((sum, carton) => sum + carton.quantity, 0);
  const hasManyCartonRows = cartons.length > 5;

  return {
    editing,
    setEditing,
    collapsedSections,
    toggleSection,
    handleAdd,
    handleEdit,
    handleStartEdit,
    handleRemoveCarton,
    handleToggleCartonEnabled,
    totalCartons,
    hasManyCartonRows,
  };
}
