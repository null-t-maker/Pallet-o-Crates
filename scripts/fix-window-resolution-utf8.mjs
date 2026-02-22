import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const localesDir = path.join(root, "src", "i18n-locales");

const labels = {
  pl: "Rozdzielczość okna",
  en: "Window resolution",
  de: "Fensterauflösung",
  lb: "Fënsteropléisung",
  zh: "窗口分辨率",
  zt: "視窗解析度",
  es: "Resolución de ventana",
  es419: "Resolución de ventana",
  ca: "Resolució de la finestra",
  cy: "Datrysiad ffenestr",
  gd: "Dùmhlachd-bhreacaidh uinneige",
  gn: "Mbojuehecha ventána rehegua",
  qu: "Resolución de ventana",
  ay: "Resolución de ventana",
  pap: "Resolushon di bentana",
  pt: "Resolução da janela",
  ptbr: "Resolução da janela",
  ga: "Taifeach fuinneoige",
  nl: "Vensterresolutie",
  fr: "Résolution de la fenêtre",
  frca: "Résolution de la fenêtre",
  it: "Risoluzione finestra",
  el: "Ανάλυση παραθύρου",
  tr: "Pencere çözünürlüğü",
  az: "Pəncərə təsvir ölçüsü",
  uk: "Роздільна здатність вікна",
  ro: "Rezoluția ferestrei",
  bg: "Разделителна способност на прозореца",
  sl: "Ločljivost okna",
  sk: "Rozlíšenie okna",
  cs: "Rozlišení okna",
  hr: "Razlučivost prozora",
  sr: "Rezolucija prozora",
  sc: "Резолуција прозора",
  sq: "Rezolucioni i dritares",
  bs: "Rezolucija prozora",
  cnr: "Rezolucija prozora",
  sv: "Fönsterupplösning",
  fi: "Ikkunan tarkkuus",
  da: "Vinduesopløsning",
  nb: "Vindusoppløsning",
  nn: "Vindaugsoppløysing",
  kl: "Ikkussuup ersarissusia",
  is: "Upplausn glugga",
  lt: "Lango skiriamoji geba",
  lv: "Loga izšķirtspēja",
  et: "Akna eraldusvõime",
  ja: "ウィンドウ解像度",
  ko: "창 해상도",
  th: "ความละเอียดหน้าต่าง",
  vi: "Độ phân giải cửa sổ",
  ms: "Resolusi tetingkap",
  ar: "دقة النافذة",
  ht: "Rezolisyon fenèt la",
  hi: "विंडो रेज़ोल्यूशन",
  ur: "ونڈو ریزولوشن",
  he: "רזולוציית חלון",
  mt: "Riżoluzzjoni tat-tieqa",
  mk: "Резолуција на прозорец",
  ka: "ფანჯრის გარჩევადობა",
  kk: "Терезе ажыратымдылығы",
  ky: "Терезе чечилиши",
  uz: "Oyna aniqligi",
  hy: "Պատուհանի լուծաչափ",
  hu: "Ablakfelbontás",
};

let updated = 0;
const missingFiles = [];
const missingKey = [];

for (const [code, label] of Object.entries(labels)) {
  const filePath = path.join(localesDir, `${code}.ts`);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(code);
    continue;
  }

  const source = fs.readFileSync(filePath, "utf8");
  const eol = source.includes("\r\n") ? "\r\n" : "\n";

  const lineRegex = /^([ \t]*)windowResolution:\s*".*",\s*$/m;
  if (!lineRegex.test(source)) {
    missingKey.push(code);
    continue;
  }

  const next = source.replace(lineRegex, (_full, indent) => `${indent}windowResolution: ${JSON.stringify(label)},`);
  if (next !== source) {
    fs.writeFileSync(filePath, next, "utf8");
    updated++;
  }
}

if (missingFiles.length > 0) {
  console.log(`[fix-window-resolution-utf8] Missing files: ${missingFiles.join(", ")}`);
}
if (missingKey.length > 0) {
  console.log(`[fix-window-resolution-utf8] Missing key in: ${missingKey.join(", ")}`);
}
console.log(`[fix-window-resolution-utf8] Updated locales: ${updated}`);

// Quick safety report: did any windowResolution line still contain '?'.
const leftovers = [];
for (const code of Object.keys(labels)) {
  const filePath = path.join(localesDir, `${code}.ts`);
  if (!fs.existsSync(filePath)) continue;
  const src = fs.readFileSync(filePath, "utf8");
  const match = src.match(/windowResolution:\s*"([^"]*)"/);
  if (match && match[1].includes("?")) {
    leftovers.push(code);
  }
}
if (leftovers.length > 0) {
  console.log(`[fix-window-resolution-utf8] WARNING leftover '?': ${leftovers.join(", ")}`);
}
