import { LANGUAGES, Language } from "../../i18n";
import {
  LANGUAGE_COLLATOR_LOCALE,
  LANGUAGE_DISPLAY_CODE,
  LANGUAGE_ENGLISH_NAME,
  LANGUAGE_NAME_FALLBACK_BY_UI,
  LANGUAGE_NATIVE_NAME,
  POLISH_LANGUAGE_NAME_FALLBACK_FULL,
} from "../../i18n-language-metadata";

export const LANGUAGE_ORDER: readonly Language[] = LANGUAGES;

export function createDisplayNames(activeLanguage: Language): Intl.DisplayNames | null {
  if (activeLanguage === "pl" || activeLanguage === "ga" || activeLanguage === "ay" || activeLanguage === "bo" || activeLanguage === "ku" || activeLanguage === "id" || activeLanguage === "hy") {
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
