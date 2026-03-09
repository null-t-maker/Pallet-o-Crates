import { LANGUAGES, type Language } from "../../i18n";
import {
  LANGUAGE_COLLATOR_LOCALE,
  LANGUAGE_NATIVE_NAME,
} from "../../i18n-language-metadata";
import {
  createDisplayNames,
  isDisplayNamesReliable,
  translatedLanguageName,
} from "./languagePicker/languagePickerDisplayNames";
import {
  displayNativeLanguageName,
  displayTranslatedLanguageName,
  normalizeForSearch,
} from "./languagePicker/languagePickerTextUtils";

export const LANGUAGE_ORDER: readonly Language[] = LANGUAGES;

export {
  createDisplayNames,
  displayNativeLanguageName,
  displayTranslatedLanguageName,
  isDisplayNamesReliable,
  normalizeForSearch,
  translatedLanguageName,
};

export function getSortedLanguageOrder(
  activeLanguage: Language,
  displayNames: Intl.DisplayNames | null,
  displayNamesReliable: boolean,
): Language[] {
  const collator = new Intl.Collator(LANGUAGE_COLLATOR_LOCALE[activeLanguage], {
    usage: "sort",
    sensitivity: "base",
    numeric: true,
  });

  const sortedRemainder = LANGUAGE_ORDER
    .filter((lang) => lang !== activeLanguage)
    .sort((a, b) => {
      const byLocalizedName = collator.compare(
        translatedLanguageName(a, activeLanguage, displayNames, displayNamesReliable),
        translatedLanguageName(b, activeLanguage, displayNames, displayNamesReliable),
      );
      if (byLocalizedName !== 0) {
        return byLocalizedName;
      }
      return collator.compare(LANGUAGE_NATIVE_NAME[a], LANGUAGE_NATIVE_NAME[b]);
    });

  return [activeLanguage, ...sortedRemainder];
}
