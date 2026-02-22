import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const i18nPath = path.resolve(root, "src/i18n.ts");
const i18nTypesPath = path.resolve(root, "src/i18n-types.ts");
const localeDirPath = path.resolve(root, "src/i18n-locales");
const sidebarPath = path.resolve(root, "src/components/Sidebar.tsx");
const appPath = path.resolve(root, "src/App.tsx");

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

checkMojibake([
  "src/i18n.ts",
  "src/i18n-types.ts",
  "src/components/Sidebar.tsx",
  ...localeFiles.map((name) => `src/i18n-locales/${name}`),
]);

const { sourceFile: i18nSource } = parseTypeScriptFile(i18nPath);

const languagesDecl = findVarDeclaration(i18nSource, "LANGUAGES");
let declaredLanguages = [];
if (!languagesDecl || !languagesDecl.initializer) {
  fail("Missing LANGUAGES constant in src/i18n.ts");
} else if (!ts.isAsExpression(languagesDecl.initializer) || !ts.isArrayLiteralExpression(languagesDecl.initializer.expression)) {
  fail("LANGUAGES in src/i18n.ts is not an `as const` array literal.");
} else {
  for (const element of languagesDecl.initializer.expression.elements) {
    if (!ts.isStringLiteral(element)) {
      fail("LANGUAGES contains a non-string element.");
      continue;
    }
    declaredLanguages.push(element.text);
  }
}

const translationsDecl = findVarDeclaration(i18nSource, "translations");
let mappedLanguages = [];
if (!translationsDecl || !translationsDecl.initializer || !ts.isObjectLiteralExpression(translationsDecl.initializer)) {
  fail("Missing translations object in src/i18n.ts");
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

const { sourceFile: i18nTypesSource } = parseTypeScriptFile(i18nTypesPath);
const translationsInterface = findInterfaceDeclaration(i18nTypesSource, "Translations");
const requiredTranslationKeys = [];
const optionalTranslationKeys = [];

if (!translationsInterface) {
  fail("Missing Translations interface in src/i18n-types.ts");
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
  const missingRequired = requiredTranslationKeys.filter((key) => !localeKeys.includes(key));
  const unknownKeys = localeKeys.filter((key) => !allTranslationKeys.includes(key));

  if (missingRequired.length > 0) {
    fail(`Locale '${lang}' is missing required keys: ${missingRequired.join(", ")}`);
  }
  if (unknownKeys.length > 0) {
    fail(`Locale '${lang}' has unknown keys: ${unknownKeys.join(", ")}`);
  }
}

const sidebarContent = readText(sidebarPath);
if (!sidebarContent.includes("const LANGUAGE_ORDER: readonly Language[] = LANGUAGES;")) {
  fail("Sidebar language order is not sourced from LANGUAGES.");
}
if (sidebarContent.includes("const LANGUAGE_NAME_BY_UI")) {
  fail("Legacy LANGUAGE_NAME_BY_UI matrix is still present in Sidebar.");
}
if (!sidebarContent.includes("new Intl.DisplayNames")) {
  fail("Sidebar no longer uses Intl.DisplayNames for localized language names.");
}

const appContent = readText(appPath);
if (!appContent.includes("return isLanguage(saved) ? saved : DEFAULT_LANGUAGE;")) {
  fail("App language restore does not use isLanguage()/DEFAULT_LANGUAGE guard.");
}

if (hasIssues) {
  console.error("[i18n-check] Validation failed. Keep files in UTF-8 and keep locale keys synchronized.");
  process.exit(1);
}

console.log("[i18n-check] OK");
