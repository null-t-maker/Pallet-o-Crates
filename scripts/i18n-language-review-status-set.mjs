import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const languagesPath = path.resolve(root, "src/i18n-languages.ts");
const reviewStatusPath = path.resolve(root, "src/i18n-language-review-status.json");

const VALID_DEFAULT_STATUSES = new Set(["approved", "machine", "none"]);
const VALID_TARGET_STATUSES = new Set(["approved", "machine", "none", "default"]);

function fail(message) {
  console.error(`[i18n-review-status] ${message}`);
  process.exit(1);
}

function readText(absPath) {
  return fs.readFileSync(absPath, "utf8");
}

function parseTypeScriptFile(absPath) {
  const content = readText(absPath);
  return ts.createSourceFile(absPath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
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

function collectLanguages() {
  const source = parseTypeScriptFile(languagesPath);
  const decl = findVarDeclaration(source, "LANGUAGES");
  if (!decl?.initializer) {
    fail("Missing LANGUAGES constant in src/i18n-languages.ts");
  }
  if (!ts.isAsExpression(decl.initializer) || !ts.isArrayLiteralExpression(decl.initializer.expression)) {
    fail("LANGUAGES in src/i18n-languages.ts is not an `as const` array literal.");
  }

  const languages = [];
  for (const element of decl.initializer.expression.elements) {
    if (!ts.isStringLiteral(element)) {
      fail("LANGUAGES contains a non-string element.");
    }
    languages.push(element.text);
  }
  return languages;
}

function readReviewStatusRegistry(languageSet) {
  const raw = JSON.parse(readText(reviewStatusPath));
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    fail("src/i18n-language-review-status.json must be an object.");
  }

  const { defaultStatus, overrides } = raw;
  if (typeof defaultStatus !== "string" || !VALID_DEFAULT_STATUSES.has(defaultStatus)) {
    fail("Review status registry has an invalid defaultStatus.");
  }
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    fail("Review status registry must define an overrides object.");
  }

  const parsedOverrides = {};
  for (const [language, status] of Object.entries(overrides)) {
    if (!languageSet.has(language)) {
      fail(`Review status registry contains unknown language '${language}'.`);
    }
    if (typeof status !== "string" || !VALID_DEFAULT_STATUSES.has(status)) {
      fail(`Review status registry contains invalid status '${String(status)}' for '${language}'.`);
    }
    parsedOverrides[language] = status;
  }

  return {
    defaultStatus,
    overrides: parsedOverrides,
  };
}

function writeReviewStatusRegistry(registry, orderedLanguages) {
  const nextOverrides = {};
  for (const language of orderedLanguages) {
    if (language in registry.overrides) {
      nextOverrides[language] = registry.overrides[language];
    }
  }

  const nextContent = `${JSON.stringify({
    defaultStatus: registry.defaultStatus,
    overrides: nextOverrides,
  }, null, 2)}\n`;

  fs.writeFileSync(reviewStatusPath, nextContent, "utf8");
}

const [languagesArg, statusArg] = process.argv.slice(2);
if (!languagesArg || !statusArg) {
  fail("Usage: node scripts/i18n-language-review-status-set.mjs <lang|lang1,lang2> <approved|machine|none|default>");
}

const normalizedStatus = statusArg.trim().toLowerCase();
if (!VALID_TARGET_STATUSES.has(normalizedStatus)) {
  fail(`Unsupported status '${statusArg}'. Expected one of: approved, machine, none, default.`);
}

const languages = collectLanguages();
const languageSet = new Set(languages);
const targetLanguages = languagesArg
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (targetLanguages.length === 0) {
  fail("No language codes were provided.");
}

const unknownLanguages = targetLanguages.filter((language) => !languageSet.has(language));
if (unknownLanguages.length > 0) {
  fail(`Unknown language codes: ${unknownLanguages.join(", ")}`);
}

const registry = readReviewStatusRegistry(languageSet);
for (const language of targetLanguages) {
  if (normalizedStatus === "default" || normalizedStatus === registry.defaultStatus) {
    delete registry.overrides[language];
    continue;
  }
  registry.overrides[language] = normalizedStatus;
}

writeReviewStatusRegistry(registry, languages);

console.log(`[i18n-review-status] Updated ${targetLanguages.join(", ")} -> ${normalizedStatus}`);
console.log(`[i18n-review-status] File written: ${path.relative(root, reviewStatusPath)}`);
