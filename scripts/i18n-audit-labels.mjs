import fs from "node:fs";
import path from "node:path";
import { fallbackDirPath, localeDirPath, root, readText } from "./i18n-wave-utils.mjs";

const suspiciousQuestionMark = /[\p{L}\p{N}]\?[\p{L}\p{N}]/u;
const obviousEnglishLeak =
  /\b(Traditional|Canadian|French|Spanish|Chinese|German|Portuguese|Japanese|Korean|English|Latin American|Maori|Fijian|Samoan|Tongan|Tok Pisin|Esperanto|Yiddish|Kurdish|Bislama|Akan|Twi|Wolof|Malagasy|Fulfulde|Tigrinya|Luganda|Sesotho|Setswana|Ewe|Bamanankan|Ikirundi|Brezhoneg|Corsu|chiShona|Euskara|Galego)\b/;

const scriptHeavyLocales = new Set([
  "ar", "fa", "ur", "ps", "he", "yi", "bo", "dz", "hy", "ka", "am", "ti", "bn", "ta", "te", "kn", "ml",
  "my", "lo", "th", "zh", "zt", "yue", "ja", "ko", "ug", "dv", "ne", "si",
]);

function auditDir(label, dirPath) {
  const rows = [];
  const notes = [];
  for (const entry of fs.readdirSync(dirPath)) {
    if (!entry.endsWith(".ts")) continue;
    const absPath = path.resolve(dirPath, entry);
    const content = readText(absPath);
    const locale = path.basename(entry, ".ts");
    if (
      label === "fallbacks" &&
      locale === "dv" &&
      content.includes("fallback-draft:")
    ) {
      const draftKind = content.match(/fallback-draft:\s*([^\n]+)/)?.[1]?.trim() ?? "draft";
      notes.push({
        label,
        locale,
        path: path.relative(root, absPath),
        findings: `${draftKind}-draft`,
      });
      continue;
    }
    const findings = [];

    if (content.includes("\uFFFD")) {
      findings.push("replacement-char");
    }
    if (suspiciousQuestionMark.test(content)) {
      findings.push("embedded-question-mark");
    }
    if (scriptHeavyLocales.has(locale) && obviousEnglishLeak.test(content)) {
      findings.push("possible-english-leak");
    }
    if (label === "fallbacks" && scriptHeavyLocales.has(locale)) {
      const values = [...content.matchAll(/:\s*"([^"]+)"/g)].map((match) => match[1]);
      if (values.some((value) => /[A-Za-z]/.test(value))) {
        findings.push("latin-tail-in-script-heavy-fallback");
      }
    }

    if (findings.length > 0) {
      rows.push({
        label,
        locale,
        path: path.relative(root, absPath),
        findings: findings.join(", "),
      });
    }
  }
  return { rows, notes };
}

const localeAudit = auditDir("locales", localeDirPath);
const fallbackAudit = auditDir("fallbacks", fallbackDirPath);
const rows = [...localeAudit.rows, ...fallbackAudit.rows];
const notes = [...localeAudit.notes, ...fallbackAudit.notes];

for (const note of notes) {
  console.log(`[i18n-audit-labels] ${note.label}/${note.locale}: ${note.findings} -> ${note.path}`);
}

if (rows.length === 0) {
  console.log("[i18n-audit-labels] No suspicious label files detected.");
  process.exit(0);
}

for (const row of rows) {
  console.log(`[i18n-audit-labels] ${row.label}/${row.locale}: ${row.findings} -> ${row.path}`);
}
console.log(`[i18n-audit-labels] Suspicious files: ${rows.length}`);
