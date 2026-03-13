import React from "react";
import { SidebarSampleDatabaseSection } from "./SidebarSampleDatabaseSection";
import { SidebarLanguageSection } from "./SidebarLanguageSection";
import { SidebarPalletSection } from "./SidebarPalletSection";
import { SidebarCartonTypeSection } from "./SidebarCartonTypeSection";
import { SidebarCartonListSection } from "./SidebarCartonListSection";
import type { SidebarSectionsProps } from "./sidebarSectionsTypes";

export const SidebarSections: React.FC<SidebarSectionsProps> = ({
  workflowMode,
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
  handleToggleCartonEnabled,
  }) => {
  return (
    <div className="sidebar-sections">
      <SidebarLanguageSection
        showLanguageSection={showLanguageSection}
        collapsedSections={collapsedSections}
        toggleSection={toggleSection}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />

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

      <SidebarPalletSection
        collapsedSections={collapsedSections}
        toggleSection={toggleSection}
        t={t}
        pallet={pallet}
        setPallet={setPallet}
        showExtraPalletMode={showExtraPalletMode}
      />

      <SidebarCartonTypeSection
        workflowMode={workflowMode}
        collapsedSections={collapsedSections}
        toggleSection={toggleSection}
        t={t}
        cartons={cartons}
        editing={editing}
        setEditing={setEditing}
        handleAdd={handleAdd}
        handleEdit={handleEdit}
      />

      <SidebarCartonListSection
        cartons={cartons}
        totalCartons={totalCartons}
        collapsedSections={collapsedSections}
        toggleSection={toggleSection}
        editing={editing}
        hasManyCartonRows={hasManyCartonRows}
        t={t}
        handleStartEdit={handleStartEdit}
        handleRemoveCarton={handleRemoveCarton}
        handleToggleCartonEnabled={handleToggleCartonEnabled}
      />
    </div>
  );
};
