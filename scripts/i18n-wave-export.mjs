import path from "node:path";
import {
  defaultWaveOutPath,
  getEnglishPropertyMap,
  getMissingOptionalMatrix,
  writeText,
} from "./i18n-wave-utils.mjs";

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

const outPath = path.resolve(getArgValue("--out") ?? defaultWaveOutPath());
const stem = getArgValue("--stem") ?? "feature-followup";
const { propertyMap, propertyOrder } = getEnglishPropertyMap();
const { matrix } = getMissingOptionalMatrix();

const entries = propertyOrder
  .filter((key) => matrix.get(key)?.length)
  .map((key) => {
    const english = propertyMap.get(key);
    const missingLocales = matrix.get(key) ?? [];

    return {
      key,
      valueType: english.valueType,
      english: english.value,
      translations: Object.fromEntries(missingLocales.map((locale) => [locale, ""])),
    };
  });

const payload = {
  meta: {
    generatedAt: new Date().toISOString(),
    stem,
    sourceLocale: "en",
    mode: "localization-wave",
    note: "Fill locale values centrally here, then apply with `npm run i18n:wave:apply -- <file>`.",
  },
  entries,
};

writeText(outPath, `${JSON.stringify(payload, null, 2)}\n`);

const localeCount = new Set(entries.flatMap((entry) => Object.keys(entry.translations))).size;
console.log(`[i18n-wave-export] Wrote ${entries.length} keys for ${localeCount} locales -> ${outPath}`);
