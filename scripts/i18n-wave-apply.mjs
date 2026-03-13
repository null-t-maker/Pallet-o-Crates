import path from "node:path";
import {
  fail,
  findLocaleObject,
  getObjectInsertPosition,
  hasTrailingCommaAfterLastProperty,
  propertyNameText,
  toTsInitializer,
  writeText,
} from "./i18n-wave-utils.mjs";
import ts from "typescript";

const inputPath = process.argv[2];
if (!inputPath) {
  fail("Usage: node scripts/i18n-wave-apply.mjs <wave-file.json>");
}

const wavePath = path.resolve(inputPath);
const wave = JSON.parse(await import("node:fs/promises").then(({ readFile }) => readFile(wavePath, "utf8")));
const entries = Array.isArray(wave.entries) ? wave.entries : [];
if (entries.length === 0) {
  fail(`Wave file has no entries: ${wavePath}`);
}

const localeEntryMap = new Map();
for (const entry of entries) {
  const translations = entry.translations ?? {};
  for (const [locale, value] of Object.entries(translations)) {
    if (typeof value !== "string" || value.trim() === "") continue;
    if (!localeEntryMap.has(locale)) localeEntryMap.set(locale, []);
    localeEntryMap.get(locale).push({
      key: entry.key,
      valueType: entry.valueType,
      value,
    });
  }
}

let touchedLocales = 0;
let insertedKeys = 0;

for (const [locale, localeEntries] of localeEntryMap.entries()) {
  const { absPath, content, objectLiteral } = findLocaleObject(locale);
  const existingKeys = new Set(
    objectLiteral.properties
      .map((prop) => {
        if (ts.isShorthandPropertyAssignment(prop)) return prop.name.text;
        if (!ts.isPropertyAssignment(prop)) return null;
        return propertyNameText(prop.name);
      })
      .filter(Boolean),
  );

  const missingEntries = localeEntries.filter((entry) => !existingKeys.has(entry.key));
  if (missingEntries.length === 0) continue;

  const insertPos = getObjectInsertPosition(objectLiteral);
  const hasTrailingComma = hasTrailingCommaAfterLastProperty(content, objectLiteral);
  const needsLeadingComma = objectLiteral.properties.length > 0 && !hasTrailingComma;
  const lines = missingEntries.map((entry) => `    ${entry.key}: ${toTsInitializer(entry.valueType, entry.value)},`);
  const insertion = `${needsLeadingComma ? "," : ""}\n${lines.join("\n")}\n`;
  const nextContent = `${content.slice(0, insertPos)}${insertion}${content.slice(insertPos)}`;

  writeText(absPath, nextContent);
  touchedLocales += 1;
  insertedKeys += missingEntries.length;
}

console.log(`[i18n-wave-apply] Applied ${insertedKeys} translations across ${touchedLocales} locale files from ${wavePath}`);
