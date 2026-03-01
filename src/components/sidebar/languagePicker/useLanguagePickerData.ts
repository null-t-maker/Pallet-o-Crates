import { useCallback, useMemo } from "react";
import type { Language } from "../../../i18n";
import {
  LANGUAGE_ENGLISH_NAME,
  LANGUAGE_NAME_FALLBACK_BY_UI,
  LANGUAGE_NATIVE_NAME,
} from "../../../i18n-language-metadata";
import type { MenuSelectOption } from "../../MenuSelect";
import {
  displayNativeLanguageName,
  displayTranslatedLanguageName,
  getSortedLanguageOrder,
  isDisplayNamesReliable,
  normalizeForSearch,
  translatedLanguageName,
} from "../languagePickerUtils";

interface UseLanguagePickerDataArgs {
  language: Language;
  languageSearch: string;
  languageOrder: readonly Language[];
  languageLabel: string;
  devtoolLabel?: string;
  createDisplayNames: (language: Language) => Intl.DisplayNames | null;
}

interface UseLanguagePickerDataResult {
  resolvedDevtoolLabel: string;
  devtoolLanguageOptions: MenuSelectOption[];
  visibleLanguageOrder: Language[];
  displayTranslated: (language: Language) => string;
  displayNative: (language: Language) => string;
}

export function useLanguagePickerData({
  language,
  languageSearch,
  languageOrder,
  languageLabel,
  devtoolLabel,
  createDisplayNames,
}: UseLanguagePickerDataArgs): UseLanguagePickerDataResult {
  const languageDisplayNames = useMemo(
    () => createDisplayNames(language),
    [createDisplayNames, language],
  );
  const languageDisplayNamesReliable = useMemo(
    () => isDisplayNamesReliable(language, languageDisplayNames),
    [language, languageDisplayNames],
  );
  const polishDisplayNames = useMemo(() => createDisplayNames("pl"), [createDisplayNames]);
  const polishDisplayNamesReliable = useMemo(
    () => isDisplayNamesReliable("pl", polishDisplayNames),
    [polishDisplayNames],
  );

  const resolvedDevtoolLabel = devtoolLabel ?? languageLabel;

  const devtoolLanguageOptions = useMemo<MenuSelectOption[]>(() => {
    const collator = new Intl.Collator("pl-PL", {
      usage: "sort",
      sensitivity: "base",
      numeric: true,
    });
    const sorted = [...languageOrder].sort((a, b) => {
      const aName = translatedLanguageName(a, "pl", polishDisplayNames, polishDisplayNamesReliable);
      const bName = translatedLanguageName(b, "pl", polishDisplayNames, polishDisplayNamesReliable);
      const byPolishName = collator.compare(aName, bName);
      if (byPolishName !== 0) {
        return byPolishName;
      }
      return collator.compare(LANGUAGE_NATIVE_NAME[a], LANGUAGE_NATIVE_NAME[b]);
    });
    return sorted.map((lang) => ({
      value: lang,
      label: `${displayTranslatedLanguageName(lang, "pl", polishDisplayNames, polishDisplayNamesReliable)} (${displayNativeLanguageName(lang)})`,
    }));
  }, [languageOrder, polishDisplayNames, polishDisplayNamesReliable]);

  const sortedLanguageOrder = useMemo(
    () => getSortedLanguageOrder(language, languageDisplayNames, languageDisplayNamesReliable),
    [language, languageDisplayNames, languageDisplayNamesReliable],
  );
  const normalizedLanguageSearch = useMemo(
    () => normalizeForSearch(languageSearch),
    [languageSearch],
  );

  const visibleLanguageOrder = useMemo(() => {
    if (!normalizedLanguageSearch) {
      return sortedLanguageOrder;
    }
    return sortedLanguageOrder.filter((lang) => {
      const localized = translatedLanguageName(lang, language, languageDisplayNames, languageDisplayNamesReliable);
      const nativeName = LANGUAGE_NATIVE_NAME[lang];
      const englishName = LANGUAGE_ENGLISH_NAME[lang];
      const languageCode = lang;
      const polishAlias = LANGUAGE_NAME_FALLBACK_BY_UI.pl?.[lang] ?? "";
      return [localized, nativeName, englishName, languageCode, polishAlias]
        .map((value) => normalizeForSearch(value))
        .some((value) => value.includes(normalizedLanguageSearch));
    });
  }, [
    language,
    languageDisplayNames,
    languageDisplayNamesReliable,
    normalizedLanguageSearch,
    sortedLanguageOrder,
  ]);

  const displayTranslated = useCallback((lang: Language) => (
    displayTranslatedLanguageName(lang, language, languageDisplayNames, languageDisplayNamesReliable)
  ), [language, languageDisplayNames, languageDisplayNamesReliable]);
  const displayNative = useCallback((lang: Language) => (
    displayNativeLanguageName(lang, language)
  ), [language]);

  return {
    resolvedDevtoolLabel,
    devtoolLanguageOptions,
    visibleLanguageOrder,
    displayTranslated,
    displayNative,
  };
}
