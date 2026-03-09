import type { Language } from "./i18n-languages";
import type { Translations } from "./i18n-types";
import { pl } from "./i18n-locales/pl";
import { en } from "./i18n-locales/en";
import { de } from "./i18n-locales/de";
import { lb } from "./i18n-locales/lb";
import { zh } from "./i18n-locales/zh";
import { zt } from "./i18n-locales/zt";
import { yue } from "./i18n-locales/yue";
import { jv } from "./i18n-locales/jv";
import { su } from "./i18n-locales/su";
import { ceb } from "./i18n-locales/ceb";
import { ckb } from "./i18n-locales/ckb";
import { sd } from "./i18n-locales/sd";
import { es } from "./i18n-locales/es";
import { es419 } from "./i18n-locales/es419";
import { ca } from "./i18n-locales/ca";
import { cy } from "./i18n-locales/cy";
import { gd } from "./i18n-locales/gd";
import { gn } from "./i18n-locales/gn";
import { qu } from "./i18n-locales/qu";
import { ay } from "./i18n-locales/ay";
import { pap } from "./i18n-locales/pap";
import { pt } from "./i18n-locales/pt";
import { ptbr } from "./i18n-locales/ptbr";
import { ga } from "./i18n-locales/ga";
import { nl } from "./i18n-locales/nl";
import { fr } from "./i18n-locales/fr";
import { frca } from "./i18n-locales/frca";
import { it } from "./i18n-locales/it";
import { el } from "./i18n-locales/el";
import { tr } from "./i18n-locales/tr";
import { az } from "./i18n-locales/az";
import { uk } from "./i18n-locales/uk";
import { be } from "./i18n-locales/be";
import { ru } from "./i18n-locales/ru";
import { ro } from "./i18n-locales/ro";
import { bg } from "./i18n-locales/bg";
import { sl } from "./i18n-locales/sl";
import { sk } from "./i18n-locales/sk";
import { cs } from "./i18n-locales/cs";
import { hr } from "./i18n-locales/hr";
import { sr } from "./i18n-locales/sr";
import { sc } from "./i18n-locales/sc";
import { sq } from "./i18n-locales/sq";
import { bs } from "./i18n-locales/bs";
import { cnr } from "./i18n-locales/cnr";
import { sv } from "./i18n-locales/sv";
import { fi } from "./i18n-locales/fi";
import { da } from "./i18n-locales/da";
import { nb } from "./i18n-locales/nb";
import { nn } from "./i18n-locales/nn";
import { kl } from "./i18n-locales/kl";
import { is } from "./i18n-locales/is";
import { lt } from "./i18n-locales/lt";
import { lv } from "./i18n-locales/lv";
import { et } from "./i18n-locales/et";
import { ja } from "./i18n-locales/ja";
import { ko } from "./i18n-locales/ko";
import { th } from "./i18n-locales/th";
import { km } from "./i18n-locales/km";
import { kn } from "./i18n-locales/kn";
import { lo } from "./i18n-locales/lo";
import { my } from "./i18n-locales/my";
import { ne } from "./i18n-locales/ne";
import { si } from "./i18n-locales/si";
import { ta } from "./i18n-locales/ta";
import { tg } from "./i18n-locales/tg";
import { te } from "./i18n-locales/te";
import { tk } from "./i18n-locales/tk";
import { vi } from "./i18n-locales/vi";
import { fil } from "./i18n-locales/fil";
import { ms } from "./i18n-locales/ms";
import { ml } from "./i18n-locales/ml";
import { or } from "./i18n-locales/or";
import { as } from "./i18n-locales/as";
import { dv } from "./i18n-locales/dv";
import { dz } from "./i18n-locales/dz";
import { bo } from "./i18n-locales/bo";
import { ku } from "./i18n-locales/ku";
import { ug } from "./i18n-locales/ug";
import { id } from "./i18n-locales/id";
import { ar } from "./i18n-locales/ar";
import { fa } from "./i18n-locales/fa";
import { bn } from "./i18n-locales/bn";
import { ht } from "./i18n-locales/ht";
import { hi } from "./i18n-locales/hi";
import { gu } from "./i18n-locales/gu";
import { mr } from "./i18n-locales/mr";
import { pa } from "./i18n-locales/pa";
import { ur } from "./i18n-locales/ur";
import { ps } from "./i18n-locales/ps";
import { he } from "./i18n-locales/he";
import { mt } from "./i18n-locales/mt";
import { mk } from "./i18n-locales/mk";
import { mn } from "./i18n-locales/mn";
import { ka } from "./i18n-locales/ka";
import { kk } from "./i18n-locales/kk";
import { ky } from "./i18n-locales/ky";
import { uz } from "./i18n-locales/uz";
import { hy } from "./i18n-locales/hy";
import { hu } from "./i18n-locales/hu";
import { sw } from "./i18n-locales/sw";
import { ha } from "./i18n-locales/ha";
import { am } from "./i18n-locales/am";
import { yo } from "./i18n-locales/yo";
import { ig } from "./i18n-locales/ig";
import { zu } from "./i18n-locales/zu";
import { af } from "./i18n-locales/af";
import { so } from "./i18n-locales/so";
import { om } from "./i18n-locales/om";
import { rw } from "./i18n-locales/rw";
import { ln } from "./i18n-locales/ln";
import { xh } from "./i18n-locales/xh";
import { bi } from "./i18n-locales/bi";
import { kmr } from "./i18n-locales/kmr";
import { yi } from "./i18n-locales/yi";
import { eo } from "./i18n-locales/eo";
import { tpi } from "./i18n-locales/tpi";
import { to } from "./i18n-locales/to";
import { sm } from "./i18n-locales/sm";
import { fj } from "./i18n-locales/fj";
import { mi } from "./i18n-locales/mi";
import { eu } from "./i18n-locales/eu";
import { gl } from "./i18n-locales/gl";
import { ak } from "./i18n-locales/ak";
import { tw } from "./i18n-locales/tw";
import { sn } from "./i18n-locales/sn";
import { wo } from "./i18n-locales/wo";
import { mg } from "./i18n-locales/mg";
import { ff } from "./i18n-locales/ff";
import { ti } from "./i18n-locales/ti";
import { lg } from "./i18n-locales/lg";
import { st } from "./i18n-locales/st";
import { tn } from "./i18n-locales/tn";
import { ee } from "./i18n-locales/ee";
import { bm } from "./i18n-locales/bm";
import { rn } from "./i18n-locales/rn";
import { br } from "./i18n-locales/br";
import { co } from "./i18n-locales/co";

export const translations: Record<Language, Translations> = {
  pl,
  en,
  de,
  lb,
  zh,
  zt,
  yue,
  jv,
  su,
  ceb,
  ckb,
  sd,
  es,
  es419,
  ca,
  cy,
  gd,
  gn,
  qu,
  ay,
  pap,
  pt,
  ptbr,
  ga,
  nl,
  fr,
  frca,
  it,
  el,
  tr,
  az,
  uk,
  be,
  ru,
  ro,
  bg,
  sl,
  sk,
  cs,
  hr,
  sr,
  sc,
  sq,
  bs,
  cnr,
  sv,
  fi,
  da,
  nb,
  nn,
  kl,
  is,
  lt,
  lv,
  et,
  ja,
  ko,
  th,
  km,
  kn,
  lo,
  my,
  ne,
  si,
  ta,
  tg,
  te,
  tk,
  vi,
  fil,
  ms,
  ml,
  or,
  as,
  dv,
  dz,
  bo,
  ku,
  ug,
  id,
  ar,
  fa,
  bn,
  ht,
  hi,
  gu,
  mr,
  pa,
  ur,
  ps,
  he,
  mt,
  mk,
  mn,
  ka,
  kk,
  ky,
  uz,
  hy,
  hu,
  sw,
  ha,
  am,
  yo,
  ig,
  zu,
  af,
  so,
  om,
  rw,
  ln,
  xh,
  mi,
  fj,
  sm,
  to,
  tpi,
  eo,
  yi,
  kmr,
  bi,
  eu,
  gl,
  ak,
  tw,
  sn,
  wo,
  mg,
  ff,
  ti,
  lg,
  st,
  tn,
  ee,
  bm,
  rn,
  br,
  co,
};

export function resolveTranslation(language: Language): Translations {
  const englishBase = translations.en;
  const selected = translations[language] ?? englishBase ?? translations.pl;
  if (!englishBase) return selected;
  if (language === "en") return englishBase;
  return {
    ...englishBase,
    ...selected,
  };
}
