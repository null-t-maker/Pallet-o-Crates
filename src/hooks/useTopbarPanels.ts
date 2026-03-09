import { useTopbarDropdownStyles } from "./useTopbarDropdownStyles";
import { useTopbarOutsideClose } from "./useTopbarOutsideClose";
import { useTopbarPanelRefs } from "./useTopbarPanelRefs";
import { useTopbarPanelState } from "./useTopbarPanelState";
import type { UseTopbarPanelsArgs, UseTopbarPanelsResult } from "./topbarPanelsTypes";

export type { UseTopbarPanelsArgs, UseTopbarPanelsResult } from "./topbarPanelsTypes";

export function useTopbarPanels({
  viewportWidth,
  zoomFactor,
  onClearTransientState,
}: UseTopbarPanelsArgs): UseTopbarPanelsResult {
  const {
    workflowNavRef,
    saveSampleNavRef,
    languageNavRef,
    settingsNavRef,
  } = useTopbarPanelRefs();

  const {
    workflowPanelOpen,
    saveSampleOpen,
    languagePanelOpen,
    settingsOpen,
    setWorkflowPanelOpen,
    setSaveSampleOpen,
    setLanguagePanelOpen,
    setSettingsOpen,
    toggleWorkflowPanel,
    toggleSaveSampleOpen,
    toggleLanguagePanel,
    toggleSettingsOpen,
    closeWorkflowPanel,
    closeSaveSamplePanel,
    closeLanguagePanel,
    closeSettingsPanel,
  } = useTopbarPanelState({ onClearTransientState });

  useTopbarOutsideClose({
    workflowPanelOpen,
    saveSampleOpen,
    languagePanelOpen,
    settingsOpen,
    workflowNavRef,
    saveSampleNavRef,
    languageNavRef,
    settingsNavRef,
    setWorkflowPanelOpen,
    setSaveSampleOpen,
    setLanguagePanelOpen,
    setSettingsOpen,
    onClearTransientState,
  });

  const {
    workflowDropdownStyle,
    saveSampleDropdownStyle,
    languageDropdownStyle,
    settingsDropdownStyle,
  } = useTopbarDropdownStyles({
    viewportWidth,
    zoomFactor,
    workflowPanelOpen,
    saveSampleOpen,
    languagePanelOpen,
    settingsOpen,
    workflowNavRef,
    saveSampleNavRef,
    languageNavRef,
    settingsNavRef,
  });

  return {
    workflowPanelOpen,
    saveSampleOpen,
    languagePanelOpen,
    settingsOpen,
    workflowNavRef,
    saveSampleNavRef,
    languageNavRef,
    settingsNavRef,
    toggleWorkflowPanel,
    toggleSaveSampleOpen,
    toggleLanguagePanel,
    toggleSettingsOpen,
    closeWorkflowPanel,
    closeSaveSamplePanel,
    closeLanguagePanel,
    closeSettingsPanel,
    workflowDropdownStyle,
    saveSampleDropdownStyle,
    languageDropdownStyle,
    settingsDropdownStyle,
  };
}
