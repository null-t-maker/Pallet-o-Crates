import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const languagesPath = path.resolve(root, "src/i18n-languages.ts");
const fallbackIndexPath = path.resolve(root, "src/i18n-language-fallbacks/index.ts");
const reviewStatusPath = path.resolve(root, "src/i18n-language-review-status.json");
const reportPath = path.resolve(root, "docs/i18n-language-status.md");
const VALID_REVIEW_STATUSES = new Set(["approved", "machine", "none"]);

function readText(absPath) {
  return fs.readFileSync(absPath, "utf8");
}

function parseTypeScriptFile(absPath) {
  const content = readText(absPath);
  const sourceFile = ts.createSourceFile(absPath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  return sourceFile;
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

function collectLanguages() {
  const source = parseTypeScriptFile(languagesPath);
  const decl = findVarDeclaration(source, "LANGUAGES");
  if (!decl || !decl.initializer) {
    throw new Error("Missing LANGUAGES constant in src/i18n-languages.ts");
  }
  if (!ts.isAsExpression(decl.initializer) || !ts.isArrayLiteralExpression(decl.initializer.expression)) {
    throw new Error("LANGUAGES in src/i18n-languages.ts is not an `as const` array literal.");
  }
  const languages = [];
  for (const element of decl.initializer.expression.elements) {
    if (!ts.isStringLiteral(element)) continue;
    languages.push(element.text);
  }
  return languages;
}

function collectFallbackUiLanguages() {
  const source = parseTypeScriptFile(fallbackIndexPath);
  const decl = findVarDeclaration(source, "LANGUAGE_NAME_FALLBACK_BY_UI");
  if (!decl || !decl.initializer || !ts.isObjectLiteralExpression(decl.initializer)) {
    throw new Error("Missing LANGUAGE_NAME_FALLBACK_BY_UI in src/i18n-language-fallbacks/index.ts");
  }
  return collectObjectLiteralKeys(decl.initializer);
}

function readReviewStatusRegistry(languages) {
  const languageSet = new Set(languages);
  const raw = JSON.parse(readText(reviewStatusPath));

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("src/i18n-language-review-status.json must be an object.");
  }

  const { defaultStatus, overrides } = raw;
  if (typeof defaultStatus !== "string" || !VALID_REVIEW_STATUSES.has(defaultStatus)) {
    throw new Error("Language review status registry has an invalid defaultStatus.");
  }
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    throw new Error("Language review status registry must define an overrides object.");
  }

  const parsedOverrides = {};
  for (const [language, status] of Object.entries(overrides)) {
    if (!languageSet.has(language)) {
      throw new Error(`Language review status registry contains unknown language '${language}'.`);
    }
    if (typeof status !== "string" || !VALID_REVIEW_STATUSES.has(status)) {
      throw new Error(`Language review status registry contains invalid status '${String(status)}' for '${language}'.`);
    }
    parsedOverrides[language] = status;
  }

  return {
    defaultStatus,
    overrides: parsedOverrides,
  };
}

function buildReport() {
  const languages = collectLanguages();
  const fallbackUiLanguages = collectFallbackUiLanguages();
  const fallbackSet = new Set(fallbackUiLanguages);
  const reviewStatusRegistry = readReviewStatusRegistry(languages);

  const fallbackManaged = languages.filter((lang) => fallbackSet.has(lang));
  const intlManaged = languages.filter((lang) => !fallbackSet.has(lang));
  const unknownFallbackKeys = fallbackUiLanguages.filter((lang) => !languages.includes(lang));
  const approvedLanguages = languages.filter((lang) => (
    (reviewStatusRegistry.overrides[lang] ?? reviewStatusRegistry.defaultStatus) === "approved"
  ));
  const machineLanguages = languages.filter((lang) => (
    (reviewStatusRegistry.overrides[lang] ?? reviewStatusRegistry.defaultStatus) === "machine"
  ));
  const noBadgeLanguages = languages.filter((lang) => (
    (reviewStatusRegistry.overrides[lang] ?? reviewStatusRegistry.defaultStatus) === "none"
  ));
  const explicitApprovedOverrides = languages.filter((lang) => reviewStatusRegistry.overrides[lang] === "approved");
  const explicitMachineOverrides = languages.filter((lang) => reviewStatusRegistry.overrides[lang] === "machine");
  const explicitNoBadgeOverrides = languages.filter((lang) => reviewStatusRegistry.overrides[lang] === "none");

  const now = new Date();
  const generatedAt = now.toISOString().replace("T", " ").replace("Z", " UTC");

  const lines = [
    "# i18n Language Status",
    "",
    "_This file is generated by `npm run i18n:status`. Do not edit it manually._",
    "",
    `Generated: ${generatedAt}`,
    "",
    `- Total languages: ${languages.length}`,
    `- Full fallback (no Intl for language-name list): ${fallbackManaged.length}`,
    `- Still relying on Intl.DisplayNames fallback: ${intlManaged.length}`,
    `- Review badge default: ${reviewStatusRegistry.defaultStatus}`,
    `- Human-verified badge (\`approved\`): ${approvedLanguages.length}`,
    `- AI / machine badge (\`machine\`): ${machineLanguages.length}`,
    `- Hidden badge (\`none\`): ${noBadgeLanguages.length}`,
    "",
    "## Review Badge Meaning",
    "",
    "- `approved`: translated and reviewed by a trusted human reviewer",
    "- `machine`: usable draft, but still awaiting confident human review",
    "- `none`: hide the badge when no public review signal should be shown",
    "",
    "## Community Translation Note",
    "",
    "- The repo currently exposes all listed UI languages publicly.",
    "- Most locales still need native-speaker review before they should be treated as high-confidence translations.",
    "- If you are a native speaker, translation-review PRs are welcome.",
    "",
    "## Full Fallback (Done)",
    fallbackManaged.length > 0 ? fallbackManaged.join(", ") : "_none_",
    "",
    "## Intl Fallback (To Do)",
    intlManaged.length > 0 ? intlManaged.join(", ") : "_none_",
    "",
    "## Translation Review Badge Overrides",
    "",
    "### Approved (Human-Verified)",
    explicitApprovedOverrides.length > 0 ? explicitApprovedOverrides.join(", ") : "_none_",
    "",
    "### Machine / AI Badge",
    explicitMachineOverrides.length > 0 ? explicitMachineOverrides.join(", ") : "_none_",
    "",
    "### Hidden Badge",
    explicitNoBadgeOverrides.length > 0 ? explicitNoBadgeOverrides.join(", ") : "_none_",
    "",
    "## Integrity Notes",
    unknownFallbackKeys.length > 0
      ? `- Unknown fallback UI keys (not in LANGUAGES): ${unknownFallbackKeys.join(", ")}`
      : "- No unknown fallback UI keys.",
    `- Review badge source: ${path.relative(root, reviewStatusPath)}`,
    "",
  ];

  return {
    markdown: lines.join("\n"),
    total: languages.length,
    fallbackManaged,
    intlManaged,
    approvedLanguages,
    machineLanguages,
    noBadgeLanguages,
    unknownFallbackKeys,
  };
}

const report = buildReport();
fs.writeFileSync(reportPath, report.markdown, "utf8");

console.log(`[i18n-status] Report written: ${path.relative(root, reportPath)}`);
console.log(`[i18n-status] Full fallback: ${report.fallbackManaged.length}/${report.total}`);
console.log(`[i18n-status] Intl fallback: ${report.intlManaged.length}/${report.total}`);
console.log(`[i18n-status] Approved review badge: ${report.approvedLanguages.length}/${report.total}`);
console.log(`[i18n-status] Machine review badge: ${report.machineLanguages.length}/${report.total}`);
