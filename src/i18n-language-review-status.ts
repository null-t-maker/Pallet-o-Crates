import languageReviewStatusRegistryJson from "./i18n-language-review-status.json";
import { LANGUAGES, type Language } from "./i18n-languages";

export const LANGUAGE_REVIEW_STATUSES = ["approved", "machine", "none"] as const;

export type LanguageReviewStatus = (typeof LANGUAGE_REVIEW_STATUSES)[number];

export interface LanguageReviewStatusRegistry {
  defaultStatus: LanguageReviewStatus;
  overrides: Partial<Record<Language, LanguageReviewStatus>>;
}

const LANGUAGE_SET = new Set<Language>(LANGUAGES);
const LANGUAGE_REVIEW_STATUS_SET = new Set<LanguageReviewStatus>(LANGUAGE_REVIEW_STATUSES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertLanguageReviewStatusRegistry(value: unknown): LanguageReviewStatusRegistry {
  if (!isRecord(value)) {
    throw new Error("Language review status registry must be an object.");
  }

  const defaultStatusValue = value.defaultStatus;
  if (typeof defaultStatusValue !== "string" || !LANGUAGE_REVIEW_STATUS_SET.has(defaultStatusValue as LanguageReviewStatus)) {
    throw new Error("Language review status registry has an invalid defaultStatus.");
  }

  const overridesValue = value.overrides;
  if (!isRecord(overridesValue)) {
    throw new Error("Language review status registry must define an overrides object.");
  }

  const overrides: Partial<Record<Language, LanguageReviewStatus>> = {};
  for (const [language, status] of Object.entries(overridesValue)) {
    if (!LANGUAGE_SET.has(language as Language)) {
      throw new Error(`Language review status registry contains unknown language '${language}'.`);
    }
    if (typeof status !== "string" || !LANGUAGE_REVIEW_STATUS_SET.has(status as LanguageReviewStatus)) {
      throw new Error(`Language review status registry contains invalid status '${String(status)}' for '${language}'.`);
    }
    overrides[language as Language] = status as LanguageReviewStatus;
  }

  return {
    defaultStatus: defaultStatusValue as LanguageReviewStatus,
    overrides,
  };
}

export const LANGUAGE_REVIEW_STATUS_REGISTRY = assertLanguageReviewStatusRegistry(
  languageReviewStatusRegistryJson,
);

export function getLanguageReviewStatus(language: Language): LanguageReviewStatus {
  return LANGUAGE_REVIEW_STATUS_REGISTRY.overrides[language] ?? LANGUAGE_REVIEW_STATUS_REGISTRY.defaultStatus;
}
