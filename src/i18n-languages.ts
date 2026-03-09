export const LANGUAGES = ["pl", "en", "de", "lb", "zh", "zt", "yue", "jv", "su", "ceb", "ckb", "sd", "es", "es419", "ca", "cy", "gd", "gn", "qu", "ay", "pap", "pt", "ptbr", "ga", "nl", "fr", "frca", "it", "el", "tr", "az", "uk", "be", "ru", "ro", "bg", "sl", "sk", "cs", "hr", "sr", "sc", "sq", "bs", "cnr", "sv", "fi", "da", "nb", "nn", "kl", "is", "lt", "lv", "et", "ja", "ko", "th", "km", "kn", "lo", "my", "ne", "si", "ta", "tg", "te", "tk", "vi", "fil", "ms", "ml", "or", "as", "dv", "dz", "bo", "ku", "ug", "id", "ar", "fa", "bn", "ht", "hi", "gu", "mr", "pa", "ur", "ps", "he", "mt", "mk", "mn", "ka", "kk", "ky", "uz", "hy", "hu", "sw", "ha", "am", "yo", "ig", "zu", "af", "so", "om", "rw", "ln", "xh", "mi", "fj", "sm", "to", "tpi", "eo", "yi", "kmr", "bi", "eu", "gl", "ak", "tw", "sn", "wo", "mg", "ff", "ti", "lg", "st", "tn", "ee", "bm", "rn", "br", "co"] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}
