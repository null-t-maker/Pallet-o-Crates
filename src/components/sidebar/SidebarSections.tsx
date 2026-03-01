import React from "react";
import { SectionPanel } from "./SectionPanel";
import { LanguagePickerPanel } from "./LanguagePickerPanel";
import { SidebarSampleDatabaseSection } from "./SidebarSampleDatabaseSection";
import { CartonListPanel } from "./CartonListPanel";
import { PalletForm } from "../PalletForm";
import { CartonForm } from "../CartonForm";
import type { SidebarSectionsProps } from "./sidebarSectionsTypes";

export const SidebarSections: React.FC<SidebarSectionsProps> = ({
  showLanguageSection,
  showSampleDatabaseSection,
  collapsedSections,
  toggleSection,
  language,
  setLanguage,
  t,
  resolvedLabels,
  sampleDatabaseFolderPath,
  sampleDatabaseSummary,
  sampleDatabaseLoading,
  sampleDatabaseError,
  onChooseSampleDatabaseFolder,
  onReloadSampleDatabase,
  sampleDatabaseGuidanceSummary,
  sampleGuidanceEnabled,
  onSampleGuidanceEnabledChange,
  sampleGuidanceStrengthPercent,
  onSampleGuidanceStrengthPercentChange,
  sampleGuidanceCfgScalePercent,
  onSampleGuidanceCfgScalePercentChange,
  sampleGuidanceSteps,
  onSampleGuidanceStepsChange,
  sampleGuidanceSeed,
  onSampleGuidanceSeedChange,
  sampleGuidanceFilter,
  onSampleGuidanceFilterChange,
  sampleTemplateLockEnabled,
  onSampleTemplateLockEnabledChange,
  pallet,
  setPallet,
  showExtraPalletMode,
  editing,
  setEditing,
  handleAdd,
  handleEdit,
  cartons,
  totalCartons,
  hasManyCartonRows,
  handleStartEdit,
  handleRemoveCarton,
}) => {
  return (
    <div className="sidebar-sections">
      {showLanguageSection && (
        <SectionPanel
          title={t.languageLabel}
          collapsed={collapsedSections.language}
          onToggle={() => toggleSection("language")}
          className="language-section"
        >
          <LanguagePickerPanel
            language={language}
            setLanguage={setLanguage}
            t={t}
            includeDevtool
          />
        </SectionPanel>
      )}

      <SidebarSampleDatabaseSection
        showSampleDatabaseSection={showSampleDatabaseSection}
        collapsedSections={collapsedSections}
        toggleSection={toggleSection}
        resolvedLabels={resolvedLabels}
        sampleDatabaseFolderPath={sampleDatabaseFolderPath}
        sampleDatabaseSummary={sampleDatabaseSummary}
        sampleDatabaseLoading={sampleDatabaseLoading}
        sampleDatabaseError={sampleDatabaseError}
        onChooseSampleDatabaseFolder={onChooseSampleDatabaseFolder}
        onReloadSampleDatabase={onReloadSampleDatabase}
        sampleDatabaseGuidanceSummary={sampleDatabaseGuidanceSummary}
        sampleGuidanceEnabled={sampleGuidanceEnabled}
        onSampleGuidanceEnabledChange={onSampleGuidanceEnabledChange}
        sampleGuidanceStrengthPercent={sampleGuidanceStrengthPercent}
        onSampleGuidanceStrengthPercentChange={onSampleGuidanceStrengthPercentChange}
        sampleGuidanceCfgScalePercent={sampleGuidanceCfgScalePercent}
        onSampleGuidanceCfgScalePercentChange={onSampleGuidanceCfgScalePercentChange}
        sampleGuidanceSteps={sampleGuidanceSteps}
        onSampleGuidanceStepsChange={onSampleGuidanceStepsChange}
        sampleGuidanceSeed={sampleGuidanceSeed}
        onSampleGuidanceSeedChange={onSampleGuidanceSeedChange}
        sampleGuidanceFilter={sampleGuidanceFilter}
        onSampleGuidanceFilterChange={onSampleGuidanceFilterChange}
        sampleTemplateLockEnabled={sampleTemplateLockEnabled}
        onSampleTemplateLockEnabledChange={onSampleTemplateLockEnabledChange}
      />

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

      <SectionPanel
        title={editing ? t.editCartonType : t.addCartonType}
        collapsed={collapsedSections.cartonType}
        onToggle={() => toggleSection("cartonType")}
        className={`dropdown-section${editing ? " is-editing" : ""}`}
      >
        <CartonForm
          onAdd={handleAdd}
          onEdit={handleEdit}
          editing={editing}
          onCancelEdit={() => setEditing(null)}
          t={t}
        />
      </SectionPanel>

      {cartons.length > 0 && (
        <CartonListPanel
          title={t.cartonsWithCount(totalCartons)}
          collapsed={collapsedSections.cartons}
          onToggle={() => toggleSection("cartons")}
          cartons={cartons}
          editingId={editing?.id ?? null}
          hasManyRows={hasManyCartonRows}
          editLabel={t.edit}
          removeLabel={t.remove}
          onStartEdit={handleStartEdit}
          onRemove={handleRemoveCarton}
        />
      )}
    </div>
  );
};
