import { useRef } from "react";

export interface TopbarPanelRefs {
  workflowNavRef: React.MutableRefObject<HTMLDivElement | null>;
  saveSampleNavRef: React.MutableRefObject<HTMLDivElement | null>;
  languageNavRef: React.MutableRefObject<HTMLDivElement | null>;
  settingsNavRef: React.MutableRefObject<HTMLDivElement | null>;
}

export function useTopbarPanelRefs(): TopbarPanelRefs {
  const workflowNavRef = useRef<HTMLDivElement | null>(null);
  const saveSampleNavRef = useRef<HTMLDivElement | null>(null);
  const languageNavRef = useRef<HTMLDivElement | null>(null);
  const settingsNavRef = useRef<HTMLDivElement | null>(null);

  return {
    workflowNavRef,
    saveSampleNavRef,
    languageNavRef,
    settingsNavRef,
  };
}
