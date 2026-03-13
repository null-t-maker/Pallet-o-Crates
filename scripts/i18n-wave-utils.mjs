import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export const root = process.cwd();
export const localeDirPath = path.resolve(root, "src/i18n-locales");
export const fallbackDirPath = path.resolve(root, "src/i18n-language-fallbacks");
export const i18nLanguagesPath = path.resolve(root, "src/i18n-languages.ts");
export const i18nSchemaPath = path.resolve(root, "src/i18n-translation-schema.ts");

export function readText(absPath) {
  return fs.readFileSync(absPath, "utf8");
}

export function writeText(absPath, content) {
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content, "utf8");
}

export function parseTypeScriptFile(absPath) {
  const content = readText(absPath);
  const sourceFile = ts.createSourceFile(absPath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  return { content, sourceFile };
}

export function fail(message) {
  console.error(`[i18n-wave] ${message}`);
  process.exit(1);
}

export function propertyNameText(nameNode) {
  if (ts.isIdentifier(nameNode)) return nameNode.text;
  if (ts.isStringLiteral(nameNode)) return nameNode.text;
  if (ts.isNumericLiteral(nameNode)) return nameNode.text;
  if (ts.isComputedPropertyName(nameNode) && ts.isStringLiteral(nameNode.expression)) {
    return nameNode.expression.text;
  }
  return null;
}

export function findVarDeclaration(sourceFile, name) {
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

export function findInterfaceDeclaration(sourceFile, name) {
  for (const stmt of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(stmt) && stmt.name.text === name) {
      return stmt;
    }
  }
  return null;
}

export function getLanguages() {
  const { sourceFile } = parseTypeScriptFile(i18nLanguagesPath);
  const decl = findVarDeclaration(sourceFile, "LANGUAGES");
  if (!decl?.initializer) fail("Missing LANGUAGES constant.");
  if (!ts.isAsExpression(decl.initializer) || !ts.isArrayLiteralExpression(decl.initializer.expression)) {
    fail("LANGUAGES is not an `as const` array.");
  }

  return decl.initializer.expression.elements.map((element) => {
    if (!ts.isStringLiteral(element)) fail("LANGUAGES contains non-string value.");
    return element.text;
  });
}

export function getOptionalKeys() {
  const { sourceFile } = parseTypeScriptFile(i18nSchemaPath);
  const translationsInterface = findInterfaceDeclaration(sourceFile, "Translations");
  if (!translationsInterface) fail("Missing Translations interface.");

  const optionalKeys = [];
  for (const member of translationsInterface.members) {
    if (!ts.isPropertySignature(member) || !member.name || !member.questionToken) continue;
    const key = propertyNameText(member.name);
    if (key) optionalKeys.push(key);
  }
  return optionalKeys;
}

export function findLocaleObject(locale) {
  const absPath = path.resolve(localeDirPath, `${locale}.ts`);
  if (!fs.existsSync(absPath)) fail(`Missing locale file for '${locale}'.`);
  const { content, sourceFile } = parseTypeScriptFile(absPath);
  const decl = findVarDeclaration(sourceFile, locale);
  if (!decl?.initializer || !ts.isObjectLiteralExpression(decl.initializer)) {
    fail(`Invalid locale export in ${path.relative(root, absPath)}.`);
  }
  return { absPath, content, sourceFile, objectLiteral: decl.initializer };
}

export function collectLocaleKeys(locale) {
  const { objectLiteral } = findLocaleObject(locale);
  return new Set(
    objectLiteral.properties
      .map((prop) => {
        if (ts.isShorthandPropertyAssignment(prop)) return prop.name.text;
        if (!ts.isPropertyAssignment(prop)) return null;
        return propertyNameText(prop.name);
      })
      .filter(Boolean),
  );
}

export function getEnglishPropertyMap() {
  const { content, objectLiteral } = findLocaleObject("en");
  const propertyMap = new Map();
  const propertyOrder = [];

  for (const prop of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = propertyNameText(prop.name);
    if (!key) continue;

    const initializer = prop.initializer;
    let valueType = "raw";
    let value = content.slice(initializer.getStart(), initializer.getEnd());

    if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
      valueType = "string";
      value = initializer.text;
    }

    propertyMap.set(key, { valueType, value });
    propertyOrder.push(key);
  }

  return { propertyMap, propertyOrder };
}

export function getMissingOptionalMatrix({ excludeLocales = ["en"] } = {}) {
  const optionalKeys = getOptionalKeys();
  const languages = getLanguages().filter((locale) => !excludeLocales.includes(locale));
  const matrix = new Map();

  for (const key of optionalKeys) {
    matrix.set(key, []);
  }

  for (const locale of languages) {
    const localeKeys = collectLocaleKeys(locale);
    for (const key of optionalKeys) {
      if (!localeKeys.has(key)) {
        matrix.get(key).push(locale);
      }
    }
  }

  return { optionalKeys, languages, matrix };
}

export function getObjectInsertPosition(objectLiteral) {
  return objectLiteral.getEnd() - 1;
}

export function hasTrailingCommaAfterLastProperty(content, objectLiteral) {
  const lastProp = objectLiteral.properties.at(-1);
  if (!lastProp) return false;
  const between = content.slice(lastProp.getEnd(), objectLiteral.getEnd());
  return between.includes(",");
}

export function toTsInitializer(valueType, value) {
  if (valueType === "string") {
    return JSON.stringify(value);
  }
  return value;
}

export function defaultWaveOutPath(stem = "feature-followup") {
  const isoDate = new Date().toISOString().slice(0, 10);
  return path.resolve(root, "i18n-waves", `${isoDate}-${stem}.json`);
}
