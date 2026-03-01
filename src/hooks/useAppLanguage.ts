import { useEffect, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE, isLanguage, Language, resolveTranslation } from "../i18n";

const LEGACY_LANGUAGE_STORAGE_KEY = "palettevision.language";
const LANGUAGE_STORAGE_KEY = "palletocrates.language";

function resolveInitialLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const saved =
    window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
  return isLanguage(saved) ? saved : DEFAULT_LANGUAGE;
}

export function useAppLanguage(): {
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  t: ReturnType<typeof resolveTranslation>;
} {
  const [language, setLanguage] = useState<Language>(resolveInitialLanguage);
  const t = useMemo(() => resolveTranslation(language), [language]);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  return { language, setLanguage, t };
}
