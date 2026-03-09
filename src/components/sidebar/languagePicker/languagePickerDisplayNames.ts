import { type Language } from "../../../i18n";
import {
  LANGUAGE_COLLATOR_LOCALE,
  LANGUAGE_DISPLAY_CODE,
  LANGUAGE_ENGLISH_NAME,
  LANGUAGE_NAME_FALLBACK_BY_UI,
  POLISH_LANGUAGE_NAME_FALLBACK_FULL,
} from "../../../i18n-language-metadata";

function usesManagedLanguageNameFallback(activeLanguage: Language): boolean {
  return Boolean(LANGUAGE_NAME_FALLBACK_BY_UI[activeLanguage]);
}

export function createDisplayNames(activeLanguage: Language): Intl.DisplayNames | null {
  if (usesManagedLanguageNameFallback(activeLanguage)) {
    return null;
  }
  try {
    return new Intl.DisplayNames([LANGUAGE_COLLATOR_LOCALE[activeLanguage]], {
      type: "language",
    });
  } catch {
    return null;
  }
}

function primaryLanguageTag(locale: string): string {
  return locale.toLowerCase().split("-")[0];
}

function areLanguageTagsEquivalent(expectedTag: string, resolvedTag: string): boolean {
  if (expectedTag === resolvedTag) return true;
  const pair = `${expectedTag}:${resolvedTag}`;
  return pair === "nb:no"
    || pair === "no:nb"
    || pair === "fil:tl"
    || pair === "tl:fil"
    || pair === "he:iw"
    || pair === "iw:he"
    || pair === "id:in"
    || pair === "in:id"
    || pair === "yi:ji"
    || pair === "ji:yi";
}

export function isDisplayNamesReliable(activeLanguage: Language, displayNames: Intl.DisplayNames | null): boolean {
  if (!displayNames) {
    return false;
  }

  try {
    const resolvedLocale = displayNames.resolvedOptions().locale;
    const expectedTag = primaryLanguageTag(LANGUAGE_COLLATOR_LOCALE[activeLanguage]);
    const resolvedTag = primaryLanguageTag(resolvedLocale);
    if (!areLanguageTagsEquivalent(expectedTag, resolvedTag)) {
      return false;
    }
  } catch {
    return false;
  }

  const selfDisplayCode = LANGUAGE_DISPLAY_CODE[activeLanguage];
  const selfLocalized = displayNames.of(selfDisplayCode);
  if (typeof selfLocalized !== "string" || selfLocalized.trim().length === 0) {
    return false;
  }
  if (selfLocalized === selfDisplayCode) {
    return false;
  }
  return true;
}

export function translatedLanguageName(
  lang: Language,
  activeLanguage: Language,
  displayNames: Intl.DisplayNames | null,
  displayNamesReliable: boolean,
): string {
  const fallbackByActiveLanguage = LANGUAGE_NAME_FALLBACK_BY_UI[activeLanguage]?.[lang];
  if (fallbackByActiveLanguage) {
    return fallbackByActiveLanguage;
  }

  if (displayNamesReliable) {
    const localized = displayNames?.of(LANGUAGE_DISPLAY_CODE[lang]);
    if (typeof localized === "string" && localized.trim().length > 0 && localized !== LANGUAGE_DISPLAY_CODE[lang]) {
      return localized;
    }
  }

  const polishFallback = POLISH_LANGUAGE_NAME_FALLBACK_FULL[lang];
  if (polishFallback) {
    return polishFallback;
  }

  return LANGUAGE_ENGLISH_NAME[lang];
}
