import React, { useEffect, useRef, useState } from "react";
import type { Language } from "../../../i18n";

interface UseLanguagePickerMenuStateArgs {
  language: Language;
  setLanguage: (language: Language) => void;
  setLanguageSearch: React.Dispatch<React.SetStateAction<string>>;
  visibleLanguageOrder: Language[];
}

interface UseLanguagePickerMenuStateResult {
  languageMenuOpen: boolean;
  setLanguageMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  languageHighlightIndex: number;
  setLanguageHighlightIndex: React.Dispatch<React.SetStateAction<number>>;
  languageMenuRef: React.MutableRefObject<HTMLDivElement | null>;
  languageSearchInputRef: React.MutableRefObject<HTMLInputElement | null>;
  languageOptionRefs: React.MutableRefObject<Array<HTMLButtonElement | null>>;
  closeLanguageMenu: () => void;
  handleSelectLanguage: (nextLanguage: Language) => void;
}

export function useLanguagePickerMenuState({
  language,
  setLanguage,
  setLanguageSearch,
  visibleLanguageOrder,
}: UseLanguagePickerMenuStateArgs): UseLanguagePickerMenuStateResult {
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [languageHighlightIndex, setLanguageHighlightIndex] = useState(0);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const languageSearchInputRef = useRef<HTMLInputElement | null>(null);
  const languageOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const closeLanguageMenu = React.useCallback(() => {
    setLanguageMenuOpen(false);
    setLanguageSearch("");
  }, []);

  const handleSelectLanguage = React.useCallback((nextLanguage: Language) => {
    setLanguage(nextLanguage);
    closeLanguageMenu();
  }, [closeLanguageMenu, setLanguage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!languageMenuRef.current) {
        return;
      }
      if (!languageMenuRef.current.contains(event.target as Node)) {
        closeLanguageMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeLanguageMenu]);

  useEffect(() => {
    if (!languageMenuOpen) {
      return;
    }
    window.requestAnimationFrame(() => {
      languageSearchInputRef.current?.focus();
    });
  }, [languageMenuOpen]);

  useEffect(() => {
    if (!languageMenuOpen) {
      return;
    }
    if (visibleLanguageOrder.length === 0) {
      setLanguageHighlightIndex(-1);
      return;
    }
    setLanguageHighlightIndex((prev) => {
      if (prev >= 0 && prev < visibleLanguageOrder.length) {
        return prev;
      }
      const activeIndex = visibleLanguageOrder.indexOf(language);
      return activeIndex >= 0 ? activeIndex : 0;
    });
  }, [language, languageMenuOpen, visibleLanguageOrder]);

  useEffect(() => {
    if (!languageMenuOpen || languageHighlightIndex < 0) {
      return;
    }
    const highlighted = languageOptionRefs.current[languageHighlightIndex];
    highlighted?.scrollIntoView({ block: "nearest" });
  }, [languageHighlightIndex, languageMenuOpen, visibleLanguageOrder]);

  return {
    languageMenuOpen,
    setLanguageMenuOpen,
    languageHighlightIndex,
    setLanguageHighlightIndex,
    languageMenuRef,
    languageSearchInputRef,
    languageOptionRefs,
    closeLanguageMenu,
    handleSelectLanguage,
  };
}
