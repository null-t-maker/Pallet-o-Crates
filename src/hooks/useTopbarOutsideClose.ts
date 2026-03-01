import { useEffect } from "react";

interface UseTopbarOutsideCloseArgs {
  workflowPanelOpen: boolean;
  saveSampleOpen: boolean;
  languagePanelOpen: boolean;
  settingsOpen: boolean;
  workflowNavRef: React.MutableRefObject<HTMLDivElement | null>;
  saveSampleNavRef: React.MutableRefObject<HTMLDivElement | null>;
  languageNavRef: React.MutableRefObject<HTMLDivElement | null>;
  settingsNavRef: React.MutableRefObject<HTMLDivElement | null>;
  setWorkflowPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveSampleOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setLanguagePanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onClearTransientState?: () => void;
}

export function useTopbarOutsideClose({
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
}: UseTopbarOutsideCloseArgs): void {
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (workflowPanelOpen && workflowNavRef.current && !workflowNavRef.current.contains(targetNode)) {
        setWorkflowPanelOpen(false);
      }
      if (saveSampleOpen && saveSampleNavRef.current && !saveSampleNavRef.current.contains(targetNode)) {
        setSaveSampleOpen(false);
      }
      if (languagePanelOpen && languageNavRef.current && !languageNavRef.current.contains(targetNode)) {
        setLanguagePanelOpen(false);
      }
      if (settingsOpen && settingsNavRef.current && !settingsNavRef.current.contains(targetNode)) {
        setSettingsOpen(false);
        onClearTransientState?.();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [
    languageNavRef,
    languagePanelOpen,
    onClearTransientState,
    saveSampleNavRef,
    saveSampleOpen,
    setLanguagePanelOpen,
    setSaveSampleOpen,
    setSettingsOpen,
    setWorkflowPanelOpen,
    settingsNavRef,
    settingsOpen,
    workflowNavRef,
    workflowPanelOpen,
  ]);
}
