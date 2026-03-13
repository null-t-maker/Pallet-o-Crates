import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import {
  fallbackDirPath,
  parseTypeScriptFile,
  propertyNameText,
  findVarDeclaration,
  root,
} from './i18n-wave-utils.mjs';

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('Usage: node scripts/i18n-fallback-autofill-exact-english.mjs <locale...>');
  process.exit(1);
}

const SPECIAL_TARGETS = {
  bi: ['tpi'],
  ceb: ['ceb'],
  st: ['st'],
  tn: ['tn'],
  bm: ['bm'],
  rn: ['rn'],
  kl: ['kl', 'da'],
  ff: ['ff'],
  lg: ['lg'],
  mg: ['mg'],
  id: ['id'],
  ms: ['ms'],
  su: ['su'],
  jv: ['jv'],
  ha: ['ha'],
  ig: ['ig'],
  ln: ['ln'],
};

const SPECIAL_TEXT_TRANSFORM = {
  ceb: (text) => `${text} language`,
  fil: (text) => `${text} language`,
  ig: (text) => `${text} language`,
  ln: (text) => `${text} language`,
};

const MANUAL_OVERRIDES = {
  bi: {
    cy: 'Wels',
    gd: 'Skotlan Gelik',
    ga: 'Aeris',
    nl: 'Daj',
    it: 'Itali',
    el: 'Grik',
    tr: 'Turki',
    uk: 'Yukren',
    be: 'Belarus',
    ro: 'Romania',
    bg: 'Bulgaria',
    sl: 'Slovenia',
    sk: 'Slovak',
    cs: 'Cek',
    hr: 'Kroesia',
    sr: 'Serbian (Latin)',
    sc: 'Serbian (Cyrillic)',
    sq: 'Albania',
    bs: 'Bosnia',
    cnr: 'Montenegro',
    sv: 'Swiden',
    fi: 'Finlan',
    da: 'Denmak',
    nb: 'Norewei (Bokmal)',
    nn: 'Norewei (Nynorsk)',
    is: 'Aislan',
    lt: 'Lituenia',
    lv: 'Latvia',
    et: 'Estonia',
    ja: 'Japanis',
    ko: 'Korian',
    th: 'Tai',
    km: 'Kmea',
    kn: 'Kanada',
    lo: 'Lao',
    my: 'Bemes',
    ne: 'Nepali',
    si: 'Singala',
    ta: 'Tamil',
    tg: 'Tajik',
    te: 'Telugu',
    tk: 'Tukmen',
    vi: 'Vietnamis',
    fil: 'Filipino',
    ms: 'Maley',
    ml: 'Malayalam',
    or: 'Odia',
    as: 'Asamis',
    dv: 'Divehi',
    dz: 'Dzongkha',
    bo: 'Tibetan',
    ku: 'Kurdis',
    ug: 'Uighur',
    id: 'Indonesian',
    fa: 'Pesian',
    hi: 'Hindi',
    gu: 'Gujarati',
    mr: 'Marati',
    pa: 'Punjabi',
    ur: 'Urdu',
    ps: 'Pashto',
    he: 'Hibru',
    mt: 'Malta',
    mk: 'Masedonia',
    mn: 'Mongolia',
    ka: 'Jojia',
    kk: 'Kazak',
    ky: 'Kyrgyz',
    uz: 'Uzbek',
    hy: 'Amenia',
    hu: 'Hangari',
    sw: 'Swahili',
    am: 'Amharik',
    yo: 'Yoruba',
    ig: 'Igbo',
    zu: 'Zulu',
    af: 'Afrikaans',
    so: 'Somali',
    om: 'Oromo',
    rw: 'Kinyarwanda',
    ln: 'Lingala',
    xh: 'Xhosa',
    mi: 'Maori',
    fj: 'Fijian',
    sm: 'Samoan',
    to: 'Tongan',
    tpi: 'Tok Pisin',
    eo: 'Esperanto',
    kmr: 'Kurdis (Kurmanji)',
    bi: 'Bislama',
    ak: 'Akan',
    tw: 'Twi',
    wo: 'Wolof',
    mg: 'Malagasi',
    ti: 'Tigrinia',
    lg: 'Ganda',
    ee: 'Ewe',
  },
  ceb: {
    ceb: 'Sinugboanon',
    cy: 'Welsh',
    gn: 'Guarani',
    qu: 'Quechua',
    ay: 'Aymara',
    pap: 'Papiamento',
    ga: 'Irlandes',
    nl: 'Olandes',
    az: 'Azerbayani',
    uk: 'Ukranyano',
    be: 'Belarusyan',
    ro: 'Romaniyano',
    bg: 'Bulgariano',
    sl: 'Slobenyano',
    sk: 'Slobak',
    cs: 'Tseko',
    hr: 'Krowasyano',
    sr: 'Serbyano (Latin)',
    sc: 'Serbyano (Cyrillic)',
    sq: 'Albanyano',
    bs: 'Bosnyano',
    cnr: 'Montenegrin',
    sv: 'Suwides',
    fi: 'Pinlandes',
    da: 'Danes',
    nn: 'Noruwego Nynorsk',
    is: 'Islandes',
    lt: 'Litwanyano',
    lv: 'Latbyano',
    et: 'Estonyano',
    th: 'Thai',
    km: 'Khmer',
    kn: 'Kannada',
    lo: 'Lao',
    my: 'Burmes',
    ne: 'Nepali',
    si: 'Sinhala',
    ta: 'Tamil',
    tg: 'Tajik',
    te: 'Telugu',
    tk: 'Turkmen',
    vi: 'Biyetnames',
    fil: 'Pilipino',
    ms: 'Malay',
    ml: 'Malayalam',
    or: 'Odia',
    as: 'Asamese',
    dv: 'Divehi',
    dz: 'Dzongkha',
    ku: 'Kurdish',
    ug: 'Uyghur',
    id: 'Indonesyan',
    fa: 'Persyano',
    ht: 'Haitian Creole',
    hi: 'Hindi',
    gu: 'Gujarati',
    mr: 'Marathi',
    pa: 'Punjabi',
    ur: 'Urdu',
    ps: 'Pashto',
    mt: 'Maltis',
    mk: 'Masedonyano',
    mn: 'Mongolyan',
    ka: 'Heorgyano',
    kk: 'Kazak',
    ky: 'Kyrgyz',
    uz: 'Usbek',
    hy: 'Armenyano',
    hu: 'Unggaro',
    sw: 'Swahili',
    am: 'Amharic',
    yo: 'Yoruba',
    ig: 'Igbo',
    zu: 'Zulu',
    af: 'Aprikaans',
    so: 'Somali',
    om: 'Oromo',
    rw: 'Kinyarwanda',
    ln: 'Lingala',
    xh: 'Xhosa',
    mi: 'Maori',
    fj: 'Fijian',
    sm: 'Samoan',
    to: 'Tongan',
    tpi: 'Tok Pisin',
    eo: 'Esperanto',
    yi: 'Yiddish',
    kmr: 'Kurdish (Kurmanji)',
    bi: 'Bislama',
    ak: 'Akan',
    tw: 'Twi',
    wo: 'Wolof',
    mg: 'Malagasy',
    ti: 'Tigrinya',
    ee: 'Ewe',
  },
  bm: {
    ee: 'Ewe',
    tpi: 'Tok Pisin',
    bi: 'Bislama',
    ak: 'Akan',
    rn: 'Kirundi',
    br: 'Breton',
    co: 'Corsican',
    lg: 'Ganda',
    ff: 'Fulah',
  },
  rn: {
    bi: 'Bislama',
    ak: 'Akan',
    ee: 'Ewe',
    ff: 'Fulah',
    lg: 'Ganda',
  },
  kl: {
    tpi: 'Tok Pisin',
    bi: 'Bislama',
    ak: 'Akan',
    ee: 'Ewe',
    rn: 'Kirundi',
    br: 'Breton',
    co: 'Corsican',
    lg: 'Ganda',
    ff: 'Fulah',
  },
  lg: {
    ee: 'Ewe',
    tpi: 'Tok Pisin',
    bi: 'Bislama',
    ak: 'Akan',
    rn: 'Kirundi',
    ff: 'Fulah',
    lg: 'Luganda',
  },
  mg: {
    pl: 'poloney',
    de: 'Alemana',
    zt: 'Sinoa (Nentin-drazana)',
    ja: 'Japoney',
    tpi: 'Tok Pisin',
    bi: 'Bislama',
    ak: 'Akan',
    ee: 'Ewe',
    rn: 'Kirundi',
    br: 'Breton',
    co: 'Corsican',
    lg: 'Ganda',
    ff: 'Fulah',
  },
  id: {
    pl: 'Polandia',
    de: 'Jerman',
    zt: 'Cina (Tradisional)',
    ja: 'Jepang',
    tpi: 'Tok Pisin',
    bi: 'Bislama',
    ak: 'Akan',
    ee: 'Ewe',
    rn: 'Kirundi',
    ti: 'Tigrinya',
    br: 'Breton',
    co: 'Korsika',
    lg: 'Ganda',
    ff: 'Fulah',
  },
  ms: {
    pl: 'Poland',
    de: 'Jerman',
    zt: 'Cina (Tradisional)',
    ja: 'Jepun',
    tpi: 'Tok Pisin',
    bi: 'Bislama',
    ak: 'Akan',
    ee: 'Ewe',
    rn: 'Kirundi',
    ti: 'Tigrinya',
    br: 'Breton',
    co: 'Korsika',
    lg: 'Ganda',
    ff: 'Fulah',
  },
  su: {
    pl: 'Polandia',
    de: 'Jerman',
    zt: 'Cina (Tradisional)',
    ja: 'Basa Jepang',
    tpi: 'Tok Pisin',
    bi: 'Bislama',
    ak: 'Akan',
    ee: 'Ewe',
    rn: 'Kirundi',
    ti: 'Tigrinya',
    br: 'Breton',
    co: 'Korsika',
    lg: 'Ganda',
    ff: 'Fulah',
  },
  jv: {
    pl: 'Polandia',
    de: 'Jerman',
    zt: 'Cina (Tradisional)',
    ja: 'Jepang',
    tpi: 'Tok Pisin',
    bi: 'Bislama',
    ak: 'Akan',
    ee: 'Ewe',
    rn: 'Kirundi',
    ti: 'Tigrinya',
    br: 'Breton',
    co: 'Korsika',
    lg: 'Ganda',
    ff: 'Fulah',
  },
  ha: {
    pl: 'Yaren mutanen Poland',
    de: 'Jamusanci',
    zt: 'Sinanci (Na gargajiya)',
    ja: 'Jafananci',
    tpi: 'Tok Pisin',
    bi: 'Bislama',
    ak: 'Akan',
    ee: 'Ewe',
    rn: 'Kirundi',
    ti: 'Tigrinya',
    br: 'Breton',
    co: 'Corsican',
    lg: 'Ganda',
    ff: 'Fulah',
  },
  st: {
    tpi: 'Tok Pisin',
    bi: 'Bislama',
    ak: 'Akane',
    ee: 'Ewe',
    rn: 'Se-kirundi',
    ff: 'Fulah',
    lg: 'Luganda',
    br: 'Breton',
    co: 'Corsican',
  },
  tn: {
    ak: 'Akan',
    ee: 'Ewe',
    rn: 'Sekirundi',
    ff: 'Fulah',
    lg: 'Luganda',
    br: 'Breton',
    co: 'Corsican',
  },
  ff: {
    tpi: 'Tok Pisin',
    ak: 'Akan',
    ee: 'Ewe',
    rn: 'Kirundi',
    lg: 'Ganda',
    ff: 'Fulah',
  },
};

const STRIP_TRAILING = /\s+[.،。]+$/u;
const GOOGLE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const CHUNK_SIZE = 24;

function getEnglishMap() {
  const abs = path.resolve(root, 'src/i18n-language-metadata/englishNames.ts');
  const { sourceFile } = parseTypeScriptFile(abs);
  const decl = findVarDeclaration(sourceFile, 'LANGUAGE_ENGLISH_NAME');
  const map = new Map();
  for (const prop of decl.initializer.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = propertyNameText(prop.name);
    const init = prop.initializer;
    if (!key || !(ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init))) continue;
    map.set(key, init.text);
  }
  return map;
}

const englishMap = getEnglishMap();

async function translateTexts(locale, texts) {
  const candidates = [...new Set([...(SPECIAL_TARGETS[locale] ?? []), locale])];
  const transform = SPECIAL_TEXT_TRANSFORM[locale] ?? ((text) => text);
  const results = [];

  for (let offset = 0; offset < texts.length; offset += CHUNK_SIZE) {
    const chunk = texts.slice(offset, offset + CHUNK_SIZE);
    const joined = chunk.map(transform).join('\n');
    let translatedChunk = chunk;

    for (const target of candidates) {
      try {
        const params = new URLSearchParams({ client: 'gtx', sl: 'en', tl: target, dt: 't', q: joined });
        const res = await fetch(`${GOOGLE_ENDPOINT}?${params}`);
        if (!res.ok) continue;
        const payload = await res.json();
        const translated = payload?.[0]?.map((entry) => entry?.[0] ?? '').join('') ?? '';
        const lines = translated.split('\n');
        if (lines.length === chunk.length) {
          translatedChunk = lines;
          break;
        }
      } catch {
        // try next target
      }
    }

    results.push(...translatedChunk);
  }

  return results;
}

function postprocessTranslation(locale, key, value) {
  let next = value;
  if (locale === 'bi') {
    next = next.replace(/^tok\s+/iu, '');
  }
  if (locale === 'ceb') {
    next = next.replace(/^ang\s+/iu, '');
  }
  if (locale === 'fil') {
    next = next.replace(/^wikang\s+/iu, 'Wikang ');
  }
  return next;
}

for (const locale of targets) {
  const absPath = path.resolve(fallbackDirPath, `${locale}.ts`);
  const sourceText = await fs.readFile(absPath, 'utf8');
  const sourceFile = ts.createSourceFile(absPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let objectLiteral = null;
  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) objectLiteral = decl.initializer;
    }
  }
  if (!objectLiteral) continue;

  const rows = [];
  for (const prop of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = propertyNameText(prop.name);
    const init = prop.initializer;
    if (!key || !(ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init))) continue;
    const value = init.text;
    const english = englishMap.get(key);
    if (english && value === english) {
      rows.push({ key, english, start: init.getStart(sourceFile), end: init.getEnd(), current: value });
    }
  }
  if (rows.length === 0) {
    console.log(`[i18n-fallback-autofill] ${locale}: nothing to replace`);
    continue;
  }

  const translated = await translateTexts(locale, rows.map((r) => r.english));
  const replacements = new Map();
  const localeOverrides = MANUAL_OVERRIDES[locale] ?? {};
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const override = localeOverrides[row.key];
    const effectiveOverride = override && override !== row.english ? override : undefined;
    let value = effectiveOverride ?? translated[i] ?? row.english;
    value = postprocessTranslation(locale, row.key, value);
    value = value.replace(STRIP_TRAILING, '').trim();
    replacements.set(row.key, value);
  }

  let next = sourceText;
  for (const row of [...rows].sort((a, b) => b.start - a.start)) {
    const value = replacements.get(row.key) ?? row.current;
    next = `${next.slice(0, row.start)}${JSON.stringify(value)}${next.slice(row.end)}`;
  }

  await fs.writeFile(absPath, next, 'utf8');
  const changed = rows.filter((row) => (replacements.get(row.key) ?? row.current) !== row.current).length;
  console.log(`[i18n-fallback-autofill] ${locale}: replaced ${changed}/${rows.length} exact-English entries`);
}

