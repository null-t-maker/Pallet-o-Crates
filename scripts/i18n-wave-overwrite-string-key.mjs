import ts from "typescript";
import {
  fail,
  findLocaleObject,
  getLanguages,
  propertyNameText,
  readText,
  writeText,
} from "./i18n-wave-utils.mjs";

const GOOGLE_ENDPOINT = "https://translate.googleapis.com/translate_a/single";

const SPECIAL_TARGETS = {
  zh: ["zh-CN"],
  zt: ["zh-TW", "zh-CN"],
  yue: ["zh-HK", "zh-TW", "zh-CN"],
  es419: ["es-419", "es"],
  frca: ["fr-CA", "fr"],
  ptbr: ["pt-BR", "pt"],
  cnr: ["sr", "hr", "bs"],
  sc: ["sr-Cyrl", "sr"],
  kmr: ["ku", "tr"],
  ckb: ["ckb", "ku", "ar"],
  tw: ["ak", "en"],
  nb: ["no", "nb"],
  nn: ["no", "nn"],
  tpi: ["bi", "en"],
  kl: ["da", "en"],
  dz: ["bo", "en"],
  ug: ["ug", "tr", "en"],
};

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function getTargetCandidates(locale) {
  const candidates = [];
  if (SPECIAL_TARGETS[locale]) {
    candidates.push(...SPECIAL_TARGETS[locale]);
  }
  candidates.push(locale);
  if (locale.includes("-")) {
    candidates.push(locale.split("-")[0]);
  }
  return [...new Set(candidates)];
}

async function translateText(text, locale) {
  for (const target of getTargetCandidates(locale)) {
    try {
      const params = new URLSearchParams({
        client: "gtx",
        sl: "en",
        tl: target,
        dt: "t",
        q: text,
      });

      const response = await fetch(`${GOOGLE_ENDPOINT}?${params}`);
      if (!response.ok) {
        continue;
      }

      const payload = await response.json();
      const translated = payload?.[0]?.map((chunk) => chunk?.[0] ?? "").join("") ?? "";
      if (translated.trim() !== "") {
        return translated;
      }
    } catch {
      // Try the next candidate target.
    }
  }

  return text;
}

function findStringProperty(locale, key) {
  const localeInfo = findLocaleObject(locale);
  for (const prop of localeInfo.objectLiteral.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (propertyNameText(prop.name) !== key) continue;
    if (!ts.isStringLiteral(prop.initializer) && !ts.isNoSubstitutionTemplateLiteral(prop.initializer)) {
      fail(`Locale '${locale}' key '${key}' is not a plain string literal.`);
    }
    return {
      ...localeInfo,
      property: prop,
      initializer: prop.initializer,
    };
  }
  fail(`Locale '${locale}' is missing key '${key}'.`);
}

const key = getArgValue("--key");
const englishText = getArgValue("--english");
const dryRun = process.argv.includes("--dry-run");

if (!key || !englishText) {
  fail("Usage: node scripts/i18n-wave-overwrite-string-key.mjs --key <key> --english <english text>");
}

const languages = getLanguages();
let touched = 0;

for (const locale of languages) {
  const nextText = locale === "en" ? englishText : await translateText(englishText, locale);
  const { absPath, content, initializer } = findStringProperty(locale, key);
  const currentText = readText(absPath);
  const replacement = JSON.stringify(nextText);
  const nextContent = `${content.slice(0, initializer.getStart())}${replacement}${content.slice(initializer.getEnd())}`;

  if (nextContent !== currentText) {
    touched += 1;
    if (!dryRun) {
      writeText(absPath, nextContent);
    }
  }
}

console.log(`[i18n-overwrite-key] ${dryRun ? "Would update" : "Updated"} ${touched}/${languages.length} locale files for key '${key}'.`);
