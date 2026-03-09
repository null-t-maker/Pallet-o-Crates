import { type CSSProperties, useMemo } from "react";
import { computeTopbarDropdownStyle } from "./topbarPanelStyle";
import type { TopbarPanelRefs } from "./useTopbarPanelRefs";

interface UseTopbarDropdownStylesArgs extends TopbarPanelRefs {
  viewportWidth: number;
  zoomFactor: number;
  workflowPanelOpen: boolean;
  saveSampleOpen: boolean;
  languagePanelOpen: boolean;
  settingsOpen: boolean;
}

interface TopbarDropdownStyles {
  workflowDropdownStyle: CSSProperties | undefined;
  saveSampleDropdownStyle: CSSProperties | undefined;
  languageDropdownStyle: CSSProperties | undefined;
  settingsDropdownStyle: CSSProperties | undefined;
}

export function useTopbarDropdownStyles({
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
}: UseTopbarDropdownStylesArgs): TopbarDropdownStyles {
  const workflowDropdownStyle = useMemo(
    () => (workflowPanelOpen
      ? computeTopbarDropdownStyle(workflowNavRef.current, viewportWidth, 320, zoomFactor)
      : undefined),
    [viewportWidth, workflowPanelOpen, workflowNavRef, zoomFactor],
  );
  const saveSampleDropdownStyle = useMemo(
    () => (saveSampleOpen
      ? computeTopbarDropdownStyle(saveSampleNavRef.current, viewportWidth, 420, zoomFactor)
      : undefined),
    [saveSampleOpen, saveSampleNavRef, viewportWidth, zoomFactor],
  );
  const languageDropdownStyle = useMemo(
    () => (languagePanelOpen
      ? computeTopbarDropdownStyle(languageNavRef.current, viewportWidth, 470, zoomFactor)
      : undefined),
    [languagePanelOpen, languageNavRef, viewportWidth, zoomFactor],
  );
  const settingsDropdownStyle = useMemo(
    () => (settingsOpen
      ? computeTopbarDropdownStyle(settingsNavRef.current, viewportWidth, 340, zoomFactor)
      : undefined),
    [settingsOpen, settingsNavRef, viewportWidth, zoomFactor],
  );

  return {
    workflowDropdownStyle,
    saveSampleDropdownStyle,
    languageDropdownStyle,
    settingsDropdownStyle,
  };
}
