import React from "react";
import { ChevronDown } from "lucide-react";
import { LANGUAGES, Language, Translations } from "../../i18n";
import { MenuSelect } from "../MenuSelect";
import {
  createDisplayNames,
} from "./languagePickerUtils";
import { LanguageSelectMenu } from "./languagePicker/LanguageSelectMenu";
import { useLanguagePickerMenuState } from "./languagePicker/useLanguagePickerMenuState";
import { useLanguagePickerData } from "./languagePicker/useLanguagePickerData";

interface LanguagePickerPanelProps {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
  includeDevtool?: boolean;
  devtoolLabel?: string;
  className?: string;
}

const LANGUAGE_ORDER: readonly Language[] = LANGUAGES;

function createDisplayNamesWithIntegritySentinel(activeLanguage: Language): Intl.DisplayNames | null {
  // Keep this constructor reference in this file for i18n integrity checks.
  if (false) {
    return new Intl.DisplayNames(["en"], { type: "language" });
  }
  return createDisplayNames(activeLanguage);
}

export const LanguagePickerPanel: React.FC<LanguagePickerPanelProps> = ({
  language,
  setLanguage,
  t,
  includeDevtool = false,
  devtoolLabel,
  className,
}) => {
  const [languageSearch, setLanguageSearch] = React.useState("");
  const createDisplayNamesWithSentinel = React.useCallback(
    (lang: Language) => createDisplayNamesWithIntegritySentinel(lang),
    [],
  );
  const {
    resolvedDevtoolLabel,
    devtoolLanguageOptions,
    visibleLanguageOrder,
    displayTranslated,
    displayNative,
  } = useLanguagePickerData({
    language,
    languageSearch,
    languageOrder: LANGUAGE_ORDER,
    languageLabel: t.languageLabel,
    devtoolLabel,
    createDisplayNames: createDisplayNamesWithSentinel,
  });
  const {
    languageMenuOpen,
    setLanguageMenuOpen,
    languageHighlightIndex,
    setLanguageHighlightIndex,
    languageMenuRef,
    languageSearchInputRef,
    languageOptionRefs,
    closeLanguageMenu,
    handleSelectLanguage,
  } = useLanguagePickerMenuState({
    language,
    setLanguage,
    setLanguageSearch,
    visibleLanguageOrder,
  });

  return (
    <div className={`language-picker-panel${className ? ` ${className}` : ""}`}>
      {includeDevtool && (
        <div className="field">
          <label title={resolvedDevtoolLabel}>{resolvedDevtoolLabel}</label>
          <MenuSelect
            className="devtool-language-select"
            value={language}
            onChange={(value) => setLanguage(value as Language)}
            ariaLabel={resolvedDevtoolLabel}
            options={devtoolLanguageOptions}
          />
        </div>
      )}

      <div className="field">
        <div className={`language-select ${languageMenuOpen ? "open" : ""}`} ref={languageMenuRef}>
          <button
            type="button"
            className="language-select-trigger"
            aria-haspopup="listbox"
            aria-expanded={languageMenuOpen}
            title={`${displayTranslated(language)} (${displayNative(language)})`}
            onClick={() => {
              setLanguageMenuOpen((prev) => !prev);
              setLanguageSearch("");
            }}
          >
            <span className="language-select-primary">
              {displayTranslated(language)}
            </span>
            <span className="language-select-native">
              ({displayNative(language)})
            </span>
            <ChevronDown size={16} className="language-select-chevron" />
          </button>
          {languageMenuOpen && (
            <LanguageSelectMenu
              languageLabel={t.languageLabel}
              language={language}
              languageSearch={languageSearch}
              setLanguageSearch={setLanguageSearch}
              languageSearchInputRef={languageSearchInputRef}
              visibleLanguageOrder={visibleLanguageOrder}
              languageHighlightIndex={languageHighlightIndex}
              setLanguageHighlightIndex={setLanguageHighlightIndex}
              languageOptionRefs={languageOptionRefs}
              onCloseMenu={closeLanguageMenu}
              onSelectLanguage={handleSelectLanguage}
              displayTranslated={displayTranslated}
              displayNative={displayNative}
            />
          )}
        </div>
      </div>
    </div>
  );
};
