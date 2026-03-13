import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import {
  fail,
  findLocaleObject,
  propertyNameText,
} from "./i18n-wave-utils.mjs";

const inputPath = process.argv[2];
if (!inputPath) {
  fail("Usage: node scripts/i18n-wave-autofill.mjs <wave-file.json>");
}
const overwrite = process.argv.includes("--overwrite");

const wavePath = path.resolve(inputPath);
const wave = JSON.parse(await fs.readFile(wavePath, "utf8"));
const entries = Array.isArray(wave.entries) ? wave.entries : [];
if (entries.length === 0) {
  fail(`Wave file has no entries: ${wavePath}`);
}

const SPECIAL_TARGETS = {
  zh: ["zh-CN"],
  zt: ["zh-TW", "zh-CN"],
  yue: ["zh-TW", "zh-CN"],
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

const REUSED_KEYS = {
  manualShadowModeOnLabel: ["sampleTemplateLockOnLabel", "sampleGuidanceOnLabel"],
  manualShadowModeOffLabel: ["sampleTemplateLockOffLabel", "sampleGuidanceOffOptionLabel"],
  cartonEnabledLabel: ["sampleTemplateLockOnLabel", "sampleGuidanceOnLabel"],
  cartonDisabledLabel: ["sampleTemplateLockOffLabel", "sampleGuidanceOffOptionLabel"],
  manualSpawnQuantityLabel: ["cartonQuantity"],
};

const FORCED_OVERRIDES = {
  pl: {
    manualShadowModeOnLabel: "Włączony",
    manualShadowModeOffLabel: "Wyłączony",
    manualShadowModeBlockedHint: "Trybu ducha nie można wyłączyć, dopóki nakładanie się kartonów nie zostanie usunięte.",
    manualAxisInputAutoLabel: "Auto",
    manualAxisInputManualLabel: "Ręcznie",
    sampleSaveBlockedByShadowMode: "Wyłącz tryb ducha przed zapisaniem próbki układu.",
    sampleSaveBlockedByManualOverlap: "Usuń ręczne nakładanie się kartonów przed zapisaniem próbki układu.",
    cartonGenerationToggleLabel: "Uwzględnij w generowaniu",
    cartonDisabledLabel: "Wyłączony",
    manualSpawnSectionLabel: "Ręczne poziomy startowe",
  },
  de: {
    manualAxisInputManualLabel: "Manuell",
    manualAxisApplyLabel: "Anwenden",
    cartonGenerationToggleLabel: "In Generierung verwenden",
  },
  ar: {
    manualShadowModeOnLabel: "تشغيل",
    manualShadowModeOffLabel: "إيقاف",
    manualShadowModeBlockedHint: "لا يمكن تعطيل وضع الشبح حتى تتم معالجة التداخلات.",
    manualAlignYButtonLabel: "الحافة Y",
    manualAxisInputManualLabel: "يدوي",
    sampleSaveBlockedByShadowMode: "عطّل وضع الشبح قبل حفظ نموذج التخطيط.",
    sampleSaveBlockedByManualOverlap: "عالج تداخلات الكراتين اليدوية قبل حفظ نموذج التخطيط.",
    cartonGenerationToggleLabel: "استخدم في التوليد",
    manualSpawnSectionLabel: "مستويات الإنشاء اليدوي",
  },
  fa: {
    manualShadowModeBlockedHint: "حالت شبح تا زمانی که همپوشانی‌ها برطرف نشوند غیرفعال نمی‌شود.",
    manualAxisApplyLabel: "اعمال",
    sampleSaveBlockedByShadowMode: "پیش از ذخیره نمونه چیدمان، حالت شبح را غیرفعال کنید.",
    sampleSaveBlockedByManualOverlap: "پیش از ذخیره نمونه چیدمان، همپوشانی دستی کارتن‌ها را برطرف کنید.",
    cartonGenerationToggleLabel: "در تولید استفاده شود",
    cartonDisabledLabel: "غیرفعال",
    manualSpawnSectionLabel: "سطوح ایجاد دستی",
  },
  zh: {
    manualAlignXButtonLabel: "边缘 X",
    manualAlignYButtonLabel: "边缘 Y",
    manualAxisInputAutoLabel: "自动",
    manualAxisInputManualLabel: "手动",
    manualAxisApplyLabel: "应用",
    sampleSaveBlockedByShadowMode: "保存布局样本前请先关闭幽灵模式。",
    sampleSaveBlockedByManualOverlap: "保存布局样本前请先解决手动纸箱重叠。",
    cartonGenerationToggleLabel: "参与生成",
    cartonDisabledLabel: "禁用",
    manualSpawnSectionLabel: "手动生成层级",
  },
  zt: {
    manualAlignXButtonLabel: "邊緣 X",
    manualAlignYButtonLabel: "邊緣 Y",
    manualAxisInputAutoLabel: "自動",
    manualAxisInputManualLabel: "手動",
    manualAxisApplyLabel: "套用",
    sampleSaveBlockedByShadowMode: "儲存佈局樣本前請先關閉幽靈模式。",
    sampleSaveBlockedByManualOverlap: "儲存佈局樣本前請先解決手動紙箱重疊。",
    cartonGenerationToggleLabel: "參與生成",
    cartonDisabledLabel: "停用",
    manualSpawnSectionLabel: "手動生成層級",
  },
  yue: {
    manualAlignXButtonLabel: "邊緣 X",
    manualAlignYButtonLabel: "邊緣 Y",
    manualAxisInputAutoLabel: "自動",
    manualAxisInputManualLabel: "手動",
    manualAxisApplyLabel: "套用",
    sampleSaveBlockedByShadowMode: "儲存排版樣本之前，請先關閉幽靈模式。",
    sampleSaveBlockedByManualOverlap: "儲存排版樣本之前，請先處理手動紙箱重疊。",
    cartonGenerationToggleLabel: "參與生成",
    cartonDisabledLabel: "停用",
    manualSpawnSectionLabel: "手動生成層級",
  },
  ptbr: {
    manualAxisInputManualLabel: "Manual",
    sampleSaveBlockedByShadowMode: "Desative o modo fantasma antes de salvar uma amostra de layout.",
    cartonGenerationToggleLabel: "Usar na geração",
    manualSpawnSectionLabel: "Níveis manuais de geração",
  },
  ak: {
    manualAlignXButtonLabel: "Edge X",
    manualAlignYButtonLabel: "Edge Y",
    manualAxisInputAutoLabel: "Auto",
    manualAxisInputManualLabel: "Manual",
  },
  tw: {
    manualAlignXButtonLabel: "Edge X",
    manualAlignYButtonLabel: "Edge Y",
    manualAxisInputAutoLabel: "Auto",
    manualAxisInputManualLabel: "Manual",
  },
  ff: {
    manualAlignSectionLabel: "Align to edge below",
    manualAlignXButtonLabel: "Edge X",
    manualAlignYButtonLabel: "Edge Y",
    manualAxisInputAutoLabel: "Auto",
    manualAxisInputManualLabel: "Manual",
  },
};

const GOOGLE_ENDPOINT = "https://translate.googleapis.com/translate_a/single";

function collectLocaleStringMap(locale) {
  const { content, objectLiteral } = findLocaleObject(locale);
  const propertyMap = new Map();

  for (const prop of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = propertyNameText(prop.name);
    if (!key) continue;
    const initializer = prop.initializer;
    if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
      propertyMap.set(key, initializer.text);
      continue;
    }
    propertyMap.set(key, content.slice(initializer.getStart(), initializer.getEnd()));
  }

  return propertyMap;
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

async function translateTexts(texts, locale) {
  if (texts.length === 0) return [];
  const joined = texts.join("\n");

  for (const target of getTargetCandidates(locale)) {
    try {
      const params = new URLSearchParams({
        client: "gtx",
        sl: "en",
        tl: target,
        dt: "t",
        q: joined,
      });

      const response = await fetch(`${GOOGLE_ENDPOINT}?${params}`);
      if (!response.ok) {
        continue;
      }

      const payload = await response.json();
      const translated = payload?.[0]?.map((chunk) => chunk?.[0] ?? "").join("") ?? "";
      const lines = translated.split("\n");
      if (lines.length === texts.length) {
        return lines;
      }
    } catch {
      // Try the next candidate target.
    }
  }

  return texts;
}

let updatedLocales = 0;
let updatedValues = 0;

for (const entry of entries) {
  if (!entry.translations || typeof entry.translations !== "object") {
    entry.translations = {};
  }
}

const locales = Object.keys(entries[0]?.translations ?? {}).filter((locale) => locale !== "en");
for (const locale of locales) {
  const localeStrings = collectLocaleStringMap(locale);
  const pending = [];

  for (const entry of entries) {
    const current = entry.translations?.[locale];
    if (!overwrite && typeof current === "string" && current.trim() !== "") continue;

    const reusedKeys = REUSED_KEYS[entry.key] ?? [];
    const reused = reusedKeys.map((key) => localeStrings.get(key)).find((value) => typeof value === "string" && value.trim() !== "");
    if (typeof reused === "string" && reused.trim() !== "") {
      entry.translations[locale] = reused;
      updatedValues += 1;
      continue;
    }

    pending.push(entry);
  }

  const translatedValues = await translateTexts(
    pending.map((entry) => entry.english),
    locale,
  );

  let localeTouched = false;
  for (let index = 0; index < pending.length; index += 1) {
    const entry = pending[index];
    const translated = translatedValues[index] || entry.english;
    entry.translations[locale] = translated;
    updatedValues += 1;
    localeTouched = true;
  }

  if (localeTouched) {
    updatedLocales += 1;
  }

  const localeOverrides = FORCED_OVERRIDES[locale];
  if (localeOverrides) {
    for (const entry of entries) {
      const value = localeOverrides[entry.key];
      if (typeof value !== "string") continue;
      entry.translations[locale] = value;
    }
  }
}

await fs.writeFile(wavePath, `${JSON.stringify(wave, null, 2)}\n`, "utf8");
console.log(`[i18n-wave-autofill] Filled ${updatedValues} values across ${updatedLocales} locales in ${wavePath}`);
