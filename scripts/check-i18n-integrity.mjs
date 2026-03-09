import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const i18nPath = path.resolve(root, "src/i18n.ts");
const i18nLanguagesPath = path.resolve(root, "src/i18n-languages.ts");
const i18nTranslationsPath = path.resolve(root, "src/i18n-translations.ts");
const i18nTranslationSchemaPath = path.resolve(root, "src/i18n-translation-schema.ts");
const i18nOptionalKeysPath = path.resolve(root, "src/i18n-optional-keys.ts");
const i18nTypesPath = path.resolve(root, "src/i18n-types.ts");
const localeDirPath = path.resolve(root, "src/i18n-locales");
const languageFallbackDirPath = path.resolve(root, "src/i18n-language-fallbacks");
const languageFallbackIndexPath = path.resolve(languageFallbackDirPath, "index.ts");
const sidebarPath = path.resolve(root, "src/components/Sidebar.tsx");
const languagePickerPath = path.resolve(root, "src/components/sidebar/LanguagePickerPanel.tsx");
const appPath = path.resolve(root, "src/App.tsx");
const appLanguageHookPath = path.resolve(root, "src/hooks/useAppLanguage.ts");

// Known mojibake markers seen when UTF-8 text was accidentally re-saved via a legacy code page.
const mojibakeMarkers = [
  "Äąâ€š",
  "Äąâ€ş",
  "Ä‚Ĺ‚",
  "Ä‚Â©",
  "maÄ‚",
  "ĹÂ§",
  "Ĺ•Â¤",
  "ÄÂ",
  "ÄŤĹ»",
  "Ä‡â€°",
  "Ă©â€˘",
  "\uFFFD",
];

let hasIssues = false;

function fail(message) {
  hasIssues = true;
  console.error(`[i18n-check] ${message}`);
}

function readText(absPath) {
  return fs.readFileSync(absPath, "utf8");
}

function parseTypeScriptFile(absPath) {
  const content = readText(absPath);
  const sourceFile = ts.createSourceFile(absPath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  return { content, sourceFile };
}

function findVarDeclaration(sourceFile, name) {
  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.name.text === name) {
        return decl;
      }
    }
  }
  return null;
}

function findFirstObjectLiteralVarDeclaration(sourceFile) {
  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (!decl.initializer || !ts.isObjectLiteralExpression(decl.initializer)) continue;
      return decl;
    }
  }
  return null;
}

function propertyNameText(nameNode) {
  if (ts.isIdentifier(nameNode)) return nameNode.text;
  if (ts.isStringLiteral(nameNode)) return nameNode.text;
  if (ts.isNumericLiteral(nameNode)) return nameNode.text;
  if (ts.isComputedPropertyName(nameNode) && ts.isStringLiteral(nameNode.expression)) {
    return nameNode.expression.text;
  }
  return null;
}

function collectObjectLiteralKeys(objectLiteral) {
  const keys = [];
  for (const prop of objectLiteral.properties) {
    if (ts.isShorthandPropertyAssignment(prop)) {
      keys.push(prop.name.text);
      continue;
    }
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = propertyNameText(prop.name);
    if (key) {
      keys.push(key);
    }
  }
  return keys;
}

function collectObjectLiteralStringValues(objectLiteral) {
  const values = new Map();
  for (const prop of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = propertyNameText(prop.name);
    if (!key) continue;
    if (ts.isStringLiteral(prop.initializer) || ts.isNoSubstitutionTemplateLiteral(prop.initializer)) {
      values.set(key, prop.initializer.text);
    }
  }
  return values;
}

function findInterfaceDeclaration(sourceFile, name) {
  for (const stmt of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(stmt) && stmt.name.text === name) {
      return stmt;
    }
  }
  return null;
}

function checkMojibake(relativePaths) {
  for (const relPath of relativePaths) {
    const absPath = path.resolve(root, relPath);
    const content = readText(absPath);
    const found = mojibakeMarkers.filter((marker) => content.includes(marker));
    if (found.length > 0) {
      fail(`Suspected mojibake in ${relPath}: ${found.join(", ")}`);
    }
  }
}

if (!fs.existsSync(localeDirPath) || !fs.statSync(localeDirPath).isDirectory()) {
  fail("Missing locale directory: src/i18n-locales");
}

const localeFiles = fs.existsSync(localeDirPath)
  ? fs
      .readdirSync(localeDirPath)
      .filter((name) => name.endsWith(".ts"))
      .sort()
  : [];
const languageFallbackFiles = fs.existsSync(languageFallbackDirPath)
  ? fs
      .readdirSync(languageFallbackDirPath)
      .filter((name) => name.endsWith(".ts"))
      .sort()
  : [];

checkMojibake([
  "src/i18n.ts",
  ...(fs.existsSync(i18nLanguagesPath) ? ["src/i18n-languages.ts"] : []),
  ...(fs.existsSync(i18nTranslationsPath) ? ["src/i18n-translations.ts"] : []),
  ...(fs.existsSync(i18nTranslationSchemaPath) ? ["src/i18n-translation-schema.ts"] : []),
  ...(fs.existsSync(i18nOptionalKeysPath) ? ["src/i18n-optional-keys.ts"] : []),
  "src/i18n-types.ts",
  "src/components/Sidebar.tsx",
  ...(fs.existsSync(languagePickerPath) ? ["src/components/sidebar/LanguagePickerPanel.tsx"] : []),
  ...localeFiles.map((name) => `src/i18n-locales/${name}`),
  ...languageFallbackFiles.map((name) => `src/i18n-language-fallbacks/${name}`),
]);

const languageSourcePath = fs.existsSync(i18nLanguagesPath) ? i18nLanguagesPath : i18nPath;
const translationSourcePath = fs.existsSync(i18nTranslationsPath) ? i18nTranslationsPath : i18nPath;

const { sourceFile: i18nLanguageSource } = parseTypeScriptFile(languageSourcePath);
const { sourceFile: i18nTranslationSource } = parseTypeScriptFile(translationSourcePath);

const languagesDecl = findVarDeclaration(i18nLanguageSource, "LANGUAGES");
let declaredLanguages = [];
if (!languagesDecl || !languagesDecl.initializer) {
  fail(`Missing LANGUAGES constant in ${path.relative(root, languageSourcePath)}`);
} else if (!ts.isAsExpression(languagesDecl.initializer) || !ts.isArrayLiteralExpression(languagesDecl.initializer.expression)) {
  fail(`LANGUAGES in ${path.relative(root, languageSourcePath)} is not an \`as const\` array literal.`);
} else {
  for (const element of languagesDecl.initializer.expression.elements) {
    if (!ts.isStringLiteral(element)) {
      fail("LANGUAGES contains a non-string element.");
      continue;
    }
    declaredLanguages.push(element.text);
  }
}

const translationsDecl = findVarDeclaration(i18nTranslationSource, "translations");
let mappedLanguages = [];
if (!translationsDecl || !translationsDecl.initializer || !ts.isObjectLiteralExpression(translationsDecl.initializer)) {
  fail(`Missing translations object in ${path.relative(root, translationSourcePath)}`);
} else {
  mappedLanguages = collectObjectLiteralKeys(translationsDecl.initializer);
}

if (declaredLanguages.length > 0 && mappedLanguages.length > 0) {
  const missingInMap = declaredLanguages.filter((lang) => !mappedLanguages.includes(lang));
  const extraInMap = mappedLanguages.filter((lang) => !declaredLanguages.includes(lang));
  if (missingInMap.length > 0) {
    fail(`translations map is missing language keys: ${missingInMap.join(", ")}`);
  }
  if (extraInMap.length > 0) {
    fail(`translations map has unknown language keys: ${extraInMap.join(", ")}`);
  }
}

if (declaredLanguages.length > 0) {
  const fileLanguages = localeFiles.map((name) => name.replace(/\.ts$/i, ""));
  const missingLocaleFiles = declaredLanguages.filter((lang) => !fileLanguages.includes(lang));
  const extraLocaleFiles = fileLanguages.filter((lang) => !declaredLanguages.includes(lang));
  if (missingLocaleFiles.length > 0) {
    fail(`Missing locale files for languages: ${missingLocaleFiles.join(", ")}`);
  }
  if (extraLocaleFiles.length > 0) {
    fail(`Locale directory has files for unknown languages: ${extraLocaleFiles.join(", ")}`);
  }
}

if (declaredLanguages.length > 0 && fs.existsSync(languageFallbackIndexPath)) {
  const { sourceFile: fallbackIndexSource } = parseTypeScriptFile(languageFallbackIndexPath);
  const fallbackByUiDecl = findVarDeclaration(fallbackIndexSource, "LANGUAGE_NAME_FALLBACK_BY_UI");
  if (!fallbackByUiDecl || !fallbackByUiDecl.initializer || !ts.isObjectLiteralExpression(fallbackByUiDecl.initializer)) {
    fail("Missing LANGUAGE_NAME_FALLBACK_BY_UI object in src/i18n-language-fallbacks/index.ts");
  } else {
    const fallbackUiLanguages = collectObjectLiteralKeys(fallbackByUiDecl.initializer);
    const unknownFallbackUiLanguages = fallbackUiLanguages.filter((lang) => !declaredLanguages.includes(lang));
    if (unknownFallbackUiLanguages.length > 0) {
      fail(`LANGUAGE_NAME_FALLBACK_BY_UI has unknown UI languages: ${unknownFallbackUiLanguages.join(", ")}`);
    }

    for (const uiLanguage of fallbackUiLanguages) {
      const fallbackFilePath = path.resolve(languageFallbackDirPath, `${uiLanguage}.ts`);
      if (!fs.existsSync(fallbackFilePath)) {
        fail(`Missing fallback map file for UI language '${uiLanguage}': src/i18n-language-fallbacks/${uiLanguage}.ts`);
        continue;
      }

      const { sourceFile: fallbackSource } = parseTypeScriptFile(fallbackFilePath);
      const fallbackDecl = findFirstObjectLiteralVarDeclaration(fallbackSource);
      if (!fallbackDecl || !fallbackDecl.initializer || !ts.isObjectLiteralExpression(fallbackDecl.initializer)) {
        fail(`Fallback file src/i18n-language-fallbacks/${uiLanguage}.ts is missing an exported object literal map.`);
        continue;
      }

      const fallbackKeys = collectObjectLiteralKeys(fallbackDecl.initializer);
      const missingFallbackEntries = declaredLanguages.filter((lang) => !fallbackKeys.includes(lang));
      const extraFallbackEntries = fallbackKeys.filter((lang) => !declaredLanguages.includes(lang));
      if (missingFallbackEntries.length > 0) {
        fail(`Fallback map '${uiLanguage}' is missing language-name entries for: ${missingFallbackEntries.join(", ")}`);
      }
      if (extraFallbackEntries.length > 0) {
        fail(`Fallback map '${uiLanguage}' has unknown language-name entries: ${extraFallbackEntries.join(", ")}`);
      }
    }
  }
}

const i18nSchemaSourcePath = fs.existsSync(i18nTranslationSchemaPath) ? i18nTranslationSchemaPath : i18nTypesPath;
const { sourceFile: i18nTypesSource } = parseTypeScriptFile(i18nSchemaSourcePath);
const translationsInterface = findInterfaceDeclaration(i18nTypesSource, "Translations");
const requiredTranslationKeys = [];
const optionalTranslationKeys = [];

if (!translationsInterface) {
  fail(`Missing Translations interface in ${path.relative(root, i18nSchemaSourcePath)}`);
} else {
  for (const member of translationsInterface.members) {
    if (!ts.isPropertySignature(member) || !member.name) continue;
    const key = propertyNameText(member.name);
    if (!key) continue;
    if (member.questionToken) {
      optionalTranslationKeys.push(key);
    } else {
      requiredTranslationKeys.push(key);
    }
  }
}

const allTranslationKeys = [...requiredTranslationKeys, ...optionalTranslationKeys];

for (const lang of declaredLanguages) {
  const localeFilePath = path.resolve(localeDirPath, `${lang}.ts`);
  if (!fs.existsSync(localeFilePath)) {
    continue;
  }

  const { sourceFile: localeSource } = parseTypeScriptFile(localeFilePath);
  const localeDecl = findVarDeclaration(localeSource, lang);
  if (!localeDecl || !localeDecl.initializer || !ts.isObjectLiteralExpression(localeDecl.initializer)) {
    fail(`Locale file src/i18n-locales/${lang}.ts is missing \`export const ${lang} = { ... }\`.`);
    continue;
  }

  const localeKeys = collectObjectLiteralKeys(localeDecl.initializer);
  const localeStringValues = collectObjectLiteralStringValues(localeDecl.initializer);
  const missingRequired = requiredTranslationKeys.filter((key) => !localeKeys.includes(key));
  const unknownKeys = localeKeys.filter((key) => !allTranslationKeys.includes(key));

  if (missingRequired.length > 0) {
    fail(`Locale '${lang}' is missing required keys: ${missingRequired.join(", ")}`);
  }
  if (unknownKeys.length > 0) {
    fail(`Locale '${lang}' has unknown keys: ${unknownKeys.join(", ")}`);
  }

  // Guard against accidental regression where a curated locale falls back to raw English labels.
  if (lang === "ku") {
    const englishRegressionSentinels = new Map([
      ["languageLabel", "Language"],
      ["calculatePacking", "Calculate packing"],
      ["diagnostics", "Diagnostics"],
    ]);
    for (const [key, englishValue] of englishRegressionSentinels.entries()) {
      const actual = localeStringValues.get(key);
      if (actual === englishValue) {
        fail(`Locale 'ku' regressed to English at key '${key}' (${JSON.stringify(actual)}).`);
      }
    }
  }
}

const sidebarContent = readText(sidebarPath);
const languagePickerContent = fs.existsSync(languagePickerPath)
  ? readText(languagePickerPath)
  : sidebarContent;

if (!languagePickerContent.includes("const LANGUAGE_ORDER: readonly Language[] = LANGUAGES;")) {
  fail("Language picker order is not sourced from LANGUAGES.");
}
if (languagePickerContent.includes("const LANGUAGE_NAME_BY_UI")) {
  fail("Legacy LANGUAGE_NAME_BY_UI matrix is still present in language picker.");
}
if (!languagePickerContent.includes("new Intl.DisplayNames")) {
  fail("Language picker no longer uses Intl.DisplayNames for localized language names.");
}

const appContent = readText(appPath);
const appLanguageHookContent = fs.existsSync(appLanguageHookPath)
  ? readText(appLanguageHookPath)
  : "";
const languageGuardPresent =
  appContent.includes("return isLanguage(saved) ? saved : DEFAULT_LANGUAGE;")
  || appLanguageHookContent.includes("return isLanguage(saved) ? saved : DEFAULT_LANGUAGE;");
if (!languageGuardPresent) {
  fail("App language restore does not use isLanguage()/DEFAULT_LANGUAGE guard.");
}

if (hasIssues) {
  console.error("[i18n-check] Validation failed. Keep files in UTF-8 and keep locale keys synchronized.");
  process.exit(1);
}

console.log("[i18n-check] OK");
