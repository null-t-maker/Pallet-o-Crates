import React from "react";
import type { Language } from "../../../i18n";

interface LanguageSelectMenuProps {
  languageLabel: string;
  language: Language;
  languageSearch: string;
  setLanguageSearch: (value: string) => void;
  languageSearchInputRef: React.MutableRefObject<HTMLInputElement | null>;
  visibleLanguageOrder: Language[];
  languageHighlightIndex: number;
  setLanguageHighlightIndex: React.Dispatch<React.SetStateAction<number>>;
  languageOptionRefs: React.MutableRefObject<Array<HTMLButtonElement | null>>;
  onCloseMenu: () => void;
  onSelectLanguage: (language: Language) => void;
  displayTranslated: (language: Language) => string;
  displayNative: (language: Language) => string;
}

export const LanguageSelectMenu: React.FC<LanguageSelectMenuProps> = ({
  languageLabel,
  language,
  languageSearch,
  setLanguageSearch,
  languageSearchInputRef,
  visibleLanguageOrder,
  languageHighlightIndex,
  setLanguageHighlightIndex,
  languageOptionRefs,
  onCloseMenu,
  onSelectLanguage,
  displayTranslated,
  displayNative,
}) => {
  return (
    <div className="language-select-menu">
      <input
        ref={languageSearchInputRef}
        type="text"
        className="language-select-search"
        value={languageSearch}
        onChange={(event) => setLanguageSearch(event.target.value)}
        placeholder={`${languageLabel}...`}
        aria-label={languageLabel}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onCloseMenu();
            return;
          }
          if (visibleLanguageOrder.length === 0) {
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setLanguageHighlightIndex((prev) =>
              Math.min(prev + 1, visibleLanguageOrder.length - 1),
            );
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setLanguageHighlightIndex((prev) => Math.max(prev - 1, 0));
            return;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            const index = Math.max(languageHighlightIndex, 0);
            const nextLanguage = visibleLanguageOrder[index];
            if (!nextLanguage) {
              return;
            }
            onSelectLanguage(nextLanguage);
          }
        }}
      />
      <div className="language-select-options" role="listbox" aria-label={languageLabel}>
        {visibleLanguageOrder.map((lang, index) => {
          const isActive = lang === language;
          const isHighlighted = index === languageHighlightIndex;
          return (
            <button
              key={lang}
              type="button"
              role="option"
              aria-selected={isActive}
              title={`${displayTranslated(lang)} (${displayNative(lang)})`}
              className={`language-select-option${isActive ? " is-active" : ""}${isHighlighted ? " is-highlighted" : ""}`}
              ref={(node) => {
                languageOptionRefs.current[index] = node;
              }}
              onMouseEnter={() => setLanguageHighlightIndex(index)}
              onClick={() => onSelectLanguage(lang)}
            >
              <span className="language-select-primary">
                {displayTranslated(lang)}
              </span>
              <span className="language-select-native">
                ({displayNative(lang)})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
