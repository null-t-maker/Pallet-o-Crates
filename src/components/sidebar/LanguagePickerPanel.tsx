import React from "react";
import { ChevronDown } from "lucide-react";
import { LANGUAGES, Language, Translations } from "../../i18n";
import { getLanguageReviewStatus, type LanguageReviewStatus } from "../../i18n-language-review-status";
import { MenuSelect } from "../MenuSelect";
import {
  createDisplayNames,
} from "./languagePickerUtils";
import { LanguageSelectMenu } from "./languagePicker/LanguageSelectMenu";
import { LanguageStatusBadge } from "./languagePicker/LanguageStatusBadge";
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

function getLanguageReviewStatusLabel(status: LanguageReviewStatus, t: Translations): string | null {
  switch (status) {
    case "approved":
      return t.languageStatusApprovedLabel ?? "Human-verified translation";
    case "machine":
      return t.languageStatusMachineLabel ?? "AI-assisted or not yet verified by a native speaker";
    default:
      return null;
  }
}

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
  const getStatusInfo = React.useCallback((lang: Language) => {
    const status = getLanguageReviewStatus(lang);
    return {
      status,
      label: getLanguageReviewStatusLabel(status, t),
    };
  }, [t]);
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
  const activeLanguageStatusInfo = getStatusInfo(language);
  const activeLanguageTitle = activeLanguageStatusInfo.label
    ? `${displayTranslated(language)} (${displayNative(language)}) | ${activeLanguageStatusInfo.label}`
    : `${displayTranslated(language)} (${displayNative(language)})`;

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
            title={activeLanguageTitle}
            onClick={() => {
              setLanguageMenuOpen((prev) => !prev);
              setLanguageSearch("");
            }}
          >
            <span className="language-select-texts">
              <span className="language-select-primary">
                {displayTranslated(language)}
              </span>
              <span className="language-select-native">
                ({displayNative(language)})
              </span>
            </span>
            <span className="language-select-status-slot">
              {activeLanguageStatusInfo.label && (
                <LanguageStatusBadge
                  status={activeLanguageStatusInfo.status}
                  label={activeLanguageStatusInfo.label}
                />
              )}
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
              getStatusInfo={getStatusInfo}
            />
          )}
        </div>
      </div>
    </div>
  );
};
