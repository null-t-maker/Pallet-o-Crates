import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const i18nPath = path.resolve(root, "src/i18n.ts");
const i18nTypesPath = path.resolve(root, "src/i18n-types.ts");
const localeDirPath = path.resolve(root, "src/i18n-locales");
const strictMode = process.argv.includes("--strict");

function readText(absPath) {
  return fs.readFileSync(absPath, "utf8");
}

function parseTypeScriptFile(absPath) {
  const content = readText(absPath);
  const sourceFile = ts.createSourceFile(absPath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  return { sourceFile };
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

function findInterfaceDeclaration(sourceFile, name) {
  for (const stmt of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(stmt) && stmt.name.text === name) {
      return stmt;
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
    if (key) keys.push(key);
  }
  return keys;
}

function fail(message) {
  console.error(`[i18n-missing] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(i18nPath)) fail("Missing src/i18n.ts");
if (!fs.existsSync(i18nTypesPath)) fail("Missing src/i18n-types.ts");
if (!fs.existsSync(localeDirPath) || !fs.statSync(localeDirPath).isDirectory()) {
  fail("Missing locale directory: src/i18n-locales");
}

const { sourceFile: i18nSource } = parseTypeScriptFile(i18nPath);
const languagesDecl = findVarDeclaration(i18nSource, "LANGUAGES");
if (!languagesDecl || !languagesDecl.initializer) {
  fail("Missing LANGUAGES constant in src/i18n.ts");
}
if (!ts.isAsExpression(languagesDecl.initializer) || !ts.isArrayLiteralExpression(languagesDecl.initializer.expression)) {
  fail("LANGUAGES in src/i18n.ts is not an `as const` array literal.");
}

const declaredLanguages = [];
for (const element of languagesDecl.initializer.expression.elements) {
  if (!ts.isStringLiteral(element)) {
    fail("LANGUAGES contains a non-string element.");
  }
  declaredLanguages.push(element.text);
}

const { sourceFile: i18nTypesSource } = parseTypeScriptFile(i18nTypesPath);
const translationsInterface = findInterfaceDeclaration(i18nTypesSource, "Translations");
if (!translationsInterface) {
  fail("Missing Translations interface in src/i18n-types.ts");
}

const requiredKeys = [];
const optionalKeys = [];
for (const member of translationsInterface.members) {
  if (!ts.isPropertySignature(member) || !member.name) continue;
  const key = propertyNameText(member.name);
  if (!key) continue;
  if (member.questionToken) {
    optionalKeys.push(key);
  } else {
    requiredKeys.push(key);
  }
}

const allIssues = [];
let missingRequiredCount = 0;
let missingOptionalCount = 0;

for (const lang of declaredLanguages) {
  const localePath = path.resolve(localeDirPath, `${lang}.ts`);
  if (!fs.existsSync(localePath)) {
    allIssues.push({ lang, missingFile: true, missingRequired: requiredKeys, missingOptional: optionalKeys });
    missingRequiredCount += requiredKeys.length;
    missingOptionalCount += optionalKeys.length;
    continue;
  }

  const { sourceFile: localeSource } = parseTypeScriptFile(localePath);
  const localeDecl = findVarDeclaration(localeSource, lang);
  if (!localeDecl || !localeDecl.initializer || !ts.isObjectLiteralExpression(localeDecl.initializer)) {
    allIssues.push({ lang, missingFile: false, invalidExport: true, missingRequired: requiredKeys, missingOptional: optionalKeys });
    missingRequiredCount += requiredKeys.length;
    missingOptionalCount += optionalKeys.length;
    continue;
  }

  const localeKeys = collectObjectLiteralKeys(localeDecl.initializer);
  const missingRequired = requiredKeys.filter((key) => !localeKeys.includes(key));
  const missingOptional = optionalKeys.filter((key) => !localeKeys.includes(key));

  if (missingRequired.length > 0 || missingOptional.length > 0) {
    allIssues.push({
      lang,
      missingFile: false,
      invalidExport: false,
      missingRequired,
      missingOptional,
    });
    missingRequiredCount += missingRequired.length;
    missingOptionalCount += missingOptional.length;
  }
}

console.log(`[i18n-missing] Languages: ${declaredLanguages.length}`);
console.log(`[i18n-missing] Required keys: ${requiredKeys.length}, optional keys: ${optionalKeys.length}`);

if (allIssues.length === 0) {
  console.log("[i18n-missing] No missing translation keys.");
  process.exit(0);
}

for (const issue of allIssues) {
  if (issue.missingFile) {
    console.log(`[i18n-missing] ${issue.lang}: missing locale file`);
  } else if (issue.invalidExport) {
    console.log(`[i18n-missing] ${issue.lang}: invalid locale export (expected 'export const ${issue.lang} = { ... }')`);
  }

  if (issue.missingRequired.length > 0) {
    console.log(`[i18n-missing] ${issue.lang}: missing required -> ${issue.missingRequired.join(", ")}`);
  }
  if (issue.missingOptional.length > 0) {
    console.log(`[i18n-missing] ${issue.lang}: missing optional -> ${issue.missingOptional.join(", ")}`);
  }
}

console.log(`[i18n-missing] Languages with gaps: ${allIssues.length}`);
console.log(`[i18n-missing] Missing required total: ${missingRequiredCount}`);
console.log(`[i18n-missing] Missing optional total: ${missingOptionalCount}`);

if (strictMode) {
  process.exit(1);
}

