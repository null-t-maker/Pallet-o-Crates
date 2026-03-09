import { type Language } from "../../../i18n";
import {
  LANGUAGE_COLLATOR_LOCALE,
  LANGUAGE_NATIVE_NAME,
} from "../../../i18n-language-metadata";
import { translatedLanguageName } from "./languagePickerDisplayNames";

function capitalizeFirstLetter(value: string, locale: string): string {
  const chars = Array.from(value);
  if (chars.length === 0) {
    return value;
  }
  const [first, ...rest] = chars;
  try {
    return first.toLocaleUpperCase(locale) + rest.join("");
  } catch {
    return first.toLocaleUpperCase() + rest.join("");
  }
}

export function displayTranslatedLanguageName(
  lang: Language,
  activeLanguage: Language,
  displayNames: Intl.DisplayNames | null,
  displayNamesReliable: boolean,
): string {
  const localized = translatedLanguageName(lang, activeLanguage, displayNames, displayNamesReliable);
  return capitalizeFirstLetter(localized, LANGUAGE_COLLATOR_LOCALE[activeLanguage]);
}

export function displayNativeLanguageName(lang: Language, activeLanguage?: Language): string {
  const nativeName = LANGUAGE_NATIVE_NAME[lang];
  const locale = LANGUAGE_COLLATOR_LOCALE[activeLanguage ?? lang];
  return capitalizeFirstLetter(nativeName, locale);
}

export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
