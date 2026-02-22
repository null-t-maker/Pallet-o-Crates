import React, { useEffect, useMemo, useRef, useState } from "react";
import { PalletInput, CartonInput } from "../lib/packer";
import { PalletForm } from "./PalletForm";
import { CartonForm } from "./CartonForm";
import { Play, Trash2, Pencil, ChevronDown, ChevronRight } from "lucide-react";
import logoIcon from "../assets/Pallet-o-Crates.svg";
import { LANGUAGES, Language, Translations } from "../i18n";

interface Props {
    pallet: PalletInput;
    setPallet: (p: PalletInput) => void;
    cartons: CartonInput[];
    setCartons: (c: CartonInput[]) => void;
    onCalculate: () => void;
    language: Language;
    setLanguage: (language: Language) => void;
    t: Translations;
}

type SectionKey = "language" | "pallet" | "cartonType" | "cartons";

interface SectionPanelProps {
    title: string;
    collapsed: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    className?: string;
}

const SectionPanel: React.FC<SectionPanelProps> = ({ title, collapsed, onToggle, children, className }) => {
    return (
        <div className={`section-card${className ? ` ${className}` : ""}`}>
            <button type="button" className="section-titlebar" onClick={onToggle}>
                <span className="section-title">{title}</span>
                <span className="section-arrow">{collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}</span>
            </button>
            {!collapsed && <div className="section-body">{children}</div>}
        </div>
    );
};

const LANGUAGE_ORDER: readonly Language[] = LANGUAGES;

const LANGUAGE_NATIVE_NAME: Record<Language, string> = {
    pl: "Polski",
    en: "English",
    de: "Deutsch",
    lb: "Lëtzebuergesch",
    zh: "中文（简体）",
    zt: "中文（繁體）",
    es: "Español",
    es419: "Español (Latinoamérica)",
    ca: "Català",
    cy: "Cymraeg",
    gd: "Gàidhlig",
    gn: "Avañe'ẽ",
    qu: "Runa Simi",
    ay: "Aymar aru",
    pap: "Papiamento",
    nl: "Nederlands",
    fr: "Français",
    frca: "Français (Canada)",
    it: "Italiano",
    el: "Ελληνικά",
    tr: "Türkçe",
    az: "Azərbaycan dili",
    uk: "Українська",
    ro: "Română",
    bg: "Български",
    sl: "Slovenščina",
    sk: "Slovenčina",
    cs: "Čeština",
    hr: "Hrvatski",
    sr: "Srpski (latinica)",
    sc: "Српски (ћирилица)",
    sq: "Shqip",
    bs: "Bosanski",
    cnr: "Crnogorski",
    sv: "Svenska",
    fi: "Suomi",
    da: "Dansk",
    nb: "Norsk (Bokmål)",
    nn: "Norsk (Nynorsk)",
    kl: "Kalaallisut",
    pt: "Português",
    ptbr: "Português (Brasil)",
    ga: "Gaeilge",
    is: "Íslenska",
    lt: "Lietuvių",
    lv: "Latviešu",
    et: "Eesti",
    ja: "日本語",
    ko: "한국어",
    th: "ไทย",
    vi: "Tiếng Việt",
    fil: "Filipino",
    ms: "Bahasa Melayu",
    id: "Bahasa Indonesia",
    ar: "العربية",
    ht: "Kreyòl ayisyen",
    hi: "हिन्दी",
    ur: "اردو",
    he: "עברית",
    mt: "Malti",
    mk: "Македонски",
    ka: "ქართული",
    kk: "Қазақ тілі",
    ky: "Кыргызча",
    uz: "O'zbekcha",
    hy: "Հայերեն",
    hu: "Magyar",
};

const LANGUAGE_ENGLISH_NAME: Record<Language, string> = {
    pl: "Polish",
    en: "English",
    de: "German",
    lb: "Luxembourgish",
    zh: "Chinese (Simplified)",
    zt: "Chinese (Traditional)",
    es: "Spanish",
    es419: "Spanish (Latin America)",
    ca: "Catalan",
    cy: "Welsh",
    gd: "Scottish Gaelic",
    gn: "Guarani",
    qu: "Quechua",
    ay: "Aymara",
    pap: "Papiamento",
    nl: "Dutch",
    fr: "French",
    frca: "French (Canada)",
    it: "Italian",
    el: "Greek",
    tr: "Turkish",
    az: "Azerbaijani",
    uk: "Ukrainian",
    ro: "Romanian",
    bg: "Bulgarian",
    sl: "Slovenian",
    sk: "Slovak",
    cs: "Czech",
    hr: "Croatian",
    sr: "Serbian (Latin)",
    sc: "Serbian (Cyrillic)",
    sq: "Albanian",
    bs: "Bosnian",
    cnr: "Montenegrin",
    sv: "Swedish",
    fi: "Finnish",
    da: "Danish",
    nb: "Norwegian Bokmål",
    nn: "Norwegian Nynorsk",
    kl: "Greenlandic",
    pt: "Portuguese",
    ptbr: "Portuguese (Brazil)",
    ga: "Irish",
    is: "Icelandic",
    lt: "Lithuanian",
    lv: "Latvian",
    et: "Estonian",
    ja: "Japanese",
    ko: "Korean",
    th: "Thai",
    vi: "Vietnamese",
    fil: "Filipino",
    ms: "Malay",
    id: "Indonesian",
    ar: "Arabic",
    ht: "Haitian Creole",
    hi: "Hindi",
    ur: "Urdu",
    he: "Hebrew",
    mt: "Maltese",
    mk: "Macedonian",
    ka: "Georgian",
    kk: "Kazakh",
    ky: "Kyrgyz",
    uz: "Uzbek",
    hy: "Armenian",
    hu: "Hungarian",
};

const LANGUAGE_COLLATOR_LOCALE: Record<Language, string> = {
    pl: "pl-PL",
    en: "en-US",
    de: "de-DE",
    lb: "lb-LU",
    zh: "zh-CN",
    zt: "zh-TW",
    es: "es-ES",
    es419: "es-419",
    ca: "ca-ES",
    cy: "cy-GB",
    gd: "gd-GB",
    gn: "gn-PY",
    qu: "qu-PE",
    ay: "ay-BO",
    pap: "pap-AW",
    nl: "nl-NL",
    fr: "fr-FR",
    frca: "fr-CA",
    it: "it-IT",
    el: "el-GR",
    tr: "tr-TR",
    az: "az-AZ",
    uk: "uk-UA",
    ro: "ro-RO",
    bg: "bg-BG",
    sl: "sl-SI",
    sk: "sk-SK",
    cs: "cs-CZ",
    hr: "hr-HR",
    sr: "sr-Latn-RS",
    sc: "sr-Cyrl-RS",
    sq: "sq-AL",
    bs: "bs-BA",
    cnr: "sr-Latn-ME",
    sv: "sv-SE",
    fi: "fi-FI",
    da: "da-DK",
    nb: "nb-NO",
    nn: "nn-NO",
    kl: "kl-GL",
    pt: "pt-PT",
    ptbr: "pt-BR",
    ga: "ga-IE",
    is: "is-IS",
    lt: "lt-LT",
    lv: "lv-LV",
    et: "et-EE",
    ja: "ja-JP",
    ko: "ko-KR",
    th: "th-TH",
    vi: "vi-VN",
    fil: "fil-PH",
    ms: "ms-MY",
    id: "id-ID",
    ar: "ar",
    ht: "ht-HT",
    hi: "hi-IN",
    ur: "ur-PK",
    he: "he-IL",
    mt: "mt-MT",
    mk: "mk-MK",
    ka: "ka-GE",
    kk: "kk-KZ",
    ky: "ky-KG",
    uz: "uz-UZ",
    hy: "hy-AM",
    hu: "hu-HU",
};
const LANGUAGE_DISPLAY_CODE: Record<Language, string> = {
    pl: "pl",
    en: "en",
    de: "de",
    lb: "lb",
    zh: "zh-Hans",
    zt: "zh-Hant",
    es: "es",
    es419: "es-419",
    ca: "ca",
    cy: "cy",
    gd: "gd",
    gn: "gn",
    qu: "qu",
    ay: "ay",
    pap: "pap",
    nl: "nl",
    fr: "fr",
    frca: "fr-CA",
    it: "it",
    el: "el",
    tr: "tr",
    az: "az",
    uk: "uk",
    ro: "ro",
    bg: "bg",
    sl: "sl",
    sk: "sk",
    cs: "cs",
    hr: "hr",
    sr: "sr-Latn",
    sc: "sr-Cyrl",
    sq: "sq",
    bs: "bs",
    cnr: "cnr",
    sv: "sv",
    fi: "fi",
    da: "da",
    nb: "nb",
    nn: "nn",
    kl: "kl",
    pt: "pt",
    ptbr: "pt-BR",
    ga: "ga",
    is: "is",
    lt: "lt",
    lv: "lv",
    et: "et",
    ja: "ja",
    ko: "ko",
    th: "th",
    vi: "vi",
    fil: "fil",
    ms: "ms",
    id: "id",
    ar: "ar",
    ht: "ht",
    hi: "hi",
    ur: "ur",
    he: "he",
    mt: "mt",
    mk: "mk",
    ka: "ka",
    kk: "kk",
    ky: "ky",
    uz: "uz",
    hy: "hy",
    hu: "hu",
};

const LANGUAGE_NAME_FALLBACK_BY_UI: Partial<Record<Language, Record<Language, string>>> = {
    ga: {
        pl: "Polainnis",
        en: "Bearla",
        de: "Gearmainis",
        lb: "Lucsambuirgis",
        zh: "Sínis shimplithe",
        zt: "Sínis thraidisiúnta",
        es: "Spáinnis",
        es419: "Spáinnis (Meiriceá Laidineach)",
        ca: "Catalóinis",
        cy: "Breatnais",
        gd: "Gàidhlig na hAlban",
        gn: "Guaráinis",
        qu: "Ceatsuais",
        ay: "Aymara",
        pap: "Papaiamaintis",
        nl: "Ollainnis",
        fr: "Fraincis",
        frca: "Fraincis (Ceanada)",
        it: "Iodáilis",
        el: "Gréigis",
        tr: "Tuircis",
        az: "Asarbaiseáinis",
        uk: "Úcráinis",
        ro: "Rómáinis",
        bg: "Bulgáiris",
        sl: "Slóivéinis",
        sk: "Slóvaicis",
        cs: "Seicis",
        hr: "Cróitis",
        sr: "Seirbis (Laidin)",
        sc: "Seirbis (Coireallach)",
        sq: "Albáinis",
        bs: "Boisnis",
        cnr: "Montainéagróis",
        sv: "Sualainnis",
        fi: "Fionlainnis",
        da: "Danmhairgis",
        nb: "Ioruais (Bokmål)",
        nn: "Ioruais (Nynorsk)",
        kl: "Graonlainnis",
        pt: "Portaingéilis",
        ptbr: "Portaingéilis (an Bhrasaíl)",
        ga: "Gaeilge",
        is: "Íoslainnis",
        lt: "Liotuáinis",
        lv: "Laitvis",
        et: "Eastóinis",
        ja: "Seapáinis",
        ko: "Cóiréis",
        th: "Téalainnis",
        vi: "Vítneaimis",
        fil: "Filipínis",
        ms: "Malaeis",
        id: "Indinéisis",
        ar: "Araibis",
        ht: "Criól Háítíoch",
        hi: "Hiondúis",
        ur: "Urdais",
        he: "Eabhrais",
        mt: "Máltais",
        mk: "Macadóinis",
        ka: "Seoirsis",
        kk: "Casaicis",
        ky: "Cirgisis",
        uz: "Úisbéicis",
        hy: "Airméinis",
        hu: "Ungáiris",
    },
    id: {
        pl: "Bahasa Polandia",
        en: "Bahasa Inggris",
        de: "Bahasa Jerman",
        lb: "Bahasa Luksemburg",
        zh: "Bahasa Tionghoa (Sederhana)",
        zt: "Bahasa Tionghoa (Tradisional)",
        es: "Bahasa Spanyol",
        es419: "Bahasa Spanyol (Amerika Latin)",
        ca: "Bahasa Katalan",
        cy: "Bahasa Wales",
        gd: "Bahasa Gaelik Skotlandia",
        gn: "Bahasa Guarani",
        qu: "Bahasa Quechua",
        ay: "Bahasa Aymara",
        pap: "Bahasa Papiamento",
        nl: "Bahasa Belanda",
        fr: "Bahasa Prancis",
        frca: "Bahasa Prancis (Kanada)",
        it: "Bahasa Italia",
        el: "Bahasa Yunani",
        tr: "Bahasa Turki",
        az: "Bahasa Azeri",
        uk: "Bahasa Ukraina",
        ro: "Bahasa Rumania",
        bg: "Bahasa Bulgaria",
        sl: "Bahasa Slovenia",
        sk: "Bahasa Slowakia",
        cs: "Bahasa Ceko",
        hr: "Bahasa Kroasia",
        sr: "Bahasa Serbia (Latin)",
        sc: "Bahasa Serbia (Sirilik)",
        sq: "Bahasa Albania",
        bs: "Bahasa Bosnia",
        cnr: "Bahasa Montenegro",
        sv: "Bahasa Swedia",
        fi: "Bahasa Finlandia",
        da: "Bahasa Denmark",
        nb: "Bahasa Norwegia Bokmal",
        nn: "Bahasa Norwegia Nynorsk",
        kl: "Bahasa Kalaallisut",
        pt: "Bahasa Portugis",
        ptbr: "Bahasa Portugis (Brasil)",
        ga: "Bahasa Irlandia",
        is: "Bahasa Islandia",
        lt: "Bahasa Lituania",
        lv: "Bahasa Latvia",
        et: "Bahasa Estonia",
        ja: "Bahasa Jepang",
        ko: "Bahasa Korea",
        th: "Bahasa Thai",
        vi: "Bahasa Vietnam",
        fil: "Bahasa Filipino",
        ms: "Bahasa Melayu",
        id: "Bahasa Indonesia",
        ar: "Bahasa Arab",
        ht: "Bahasa Kreol Haiti",
        hi: "Bahasa Hindi",
        ur: "Bahasa Urdu",
        he: "Bahasa Ibrani",
        mt: "Bahasa Malta",
        mk: "Bahasa Makedonia",
        ka: "Bahasa Georgia",
        kk: "Bahasa Kazakh",
        ky: "Bahasa Kirgiz",
        uz: "Bahasa Uzbek",
        hy: "Bahasa Armenia",
        hu: "Bahasa Hungaria",
    },
    hy: {
        pl: "լեհերեն",
        en: "անգլերեն",
        de: "գերմաներեն",
        lb: "լյուքսեմբուրգերեն",
        zh: "պարզեցված չինարեն",
        zt: "ավանդական չինարեն",
        es: "իսպաներեն",
        es419: "իսպաներեն (Լատինական Ամերիկա)",
        ca: "կատալաներեն",
        cy: "ուելսերեն",
        gd: "շոտլանդական գաելերեն",
        gn: "գուարաներեն",
        qu: "կեչուա",
        ay: "այմարա",
        pap: "պապիամենտո",
        pt: "պորտուգալերեն",
        ptbr: "պորտուգալերեն (Բրազիլիա)",
        ga: "իռլանդերեն",
        nl: "հոլանդերեն",
        fr: "ֆրանսերեն",
        frca: "ֆրանսերեն (Կանադա)",
        it: "իտալերեն",
        el: "հունարեն",
        tr: "թուրքերեն",
        az: "ադրբեջաներեն",
        uk: "ուկրաիներեն",
        ro: "ռումիներեն",
        bg: "բուլղարերեն",
        sl: "սլովեներեն",
        sk: "սլովակերեն",
        cs: "չեխերեն",
        hr: "խորվաթերեն",
        sr: "սերբերեն (լատինական)",
        sc: "սերբերեն (կյուրեղագիր)",
        sq: "ալբաներեն",
        bs: "բոսնիերեն",
        cnr: "սերբերեն (Չեռնոգորիա)",
        sv: "շվեդերեն",
        fi: "ֆիններեն",
        da: "դանիերեն",
        nb: "գրքային նորվեգերեն",
        nn: "նոր նորվեգերեն",
        kl: "գրենլանդերեն",
        is: "իսլանդերեն",
        lt: "լիտվերեն",
        lv: "լատվիերեն",
        et: "էստոներեն",
        ja: "ճապոներեն",
        ko: "կորեերեն",
        th: "թայերեն",
        vi: "վիետնամերեն",
        fil: "ֆիլիպիներեն",
        ms: "մալայերեն",
        id: "ինդոնեզերեն",
        ar: "արաբերեն",
        ht: "հայիթիական կրեոլ",
        hi: "հինդի",
        ur: "ուրդու",
        he: "եբրայերեն",
        mt: "մալթայերեն",
        mk: "մակեդոներեն",
        ka: "վրացերեն",
        kk: "ղազախերեն",
        ky: "ղրղզերեն",
        uz: "ուզբեկերեն",
        hy: "հայերեն",
        hu: "հունգարերեն",
    },
};

function createDisplayNames(activeLanguage: Language): Intl.DisplayNames | null {
    try {
        return new Intl.DisplayNames([LANGUAGE_COLLATOR_LOCALE[activeLanguage]], {
            type: "language",
        });
    } catch {
        return null;
    }
}

function primaryLanguageTag(locale: string): string {
    return locale.toLowerCase().split("-")[0];
}

function isDisplayNamesReliable(activeLanguage: Language, displayNames: Intl.DisplayNames | null): boolean {
    if (!displayNames) {
        return false;
    }

    // Reject runtime fallback to a different UI language (e.g. active "ga" resolving to "pl").
    try {
        const resolvedLocale = displayNames.resolvedOptions().locale;
        const expectedTag = primaryLanguageTag(LANGUAGE_COLLATOR_LOCALE[activeLanguage]);
        const resolvedTag = primaryLanguageTag(resolvedLocale);
        if (resolvedTag !== expectedTag) {
            return false;
        }
    } catch {
        return false;
    }

    const selfDisplayCode = LANGUAGE_DISPLAY_CODE[activeLanguage];
    const selfLocalized = displayNames.of(selfDisplayCode);
    if (typeof selfLocalized !== "string" || selfLocalized.trim().length === 0) {
        return false;
    }

    const normalizedLocalized = normalizeForSearch(selfLocalized);
    const normalizedNative = normalizeForSearch(LANGUAGE_NATIVE_NAME[activeLanguage]);
    return (
        normalizedLocalized === normalizedNative ||
        normalizedLocalized.includes(normalizedNative) ||
        normalizedNative.includes(normalizedLocalized)
    );
}

function translatedLanguageName(
    lang: Language,
    activeLanguage: Language,
    displayNames: Intl.DisplayNames | null,
    displayNamesReliable: boolean,
): string {
    const fallbackByActiveLanguage = LANGUAGE_NAME_FALLBACK_BY_UI[activeLanguage]?.[lang];
    if (fallbackByActiveLanguage) {
        return fallbackByActiveLanguage;
    }

    if (displayNamesReliable) {
        const localized = displayNames?.of(LANGUAGE_DISPLAY_CODE[lang]);
        if (typeof localized === "string" && localized.trim().length > 0 && localized !== LANGUAGE_DISPLAY_CODE[lang]) {
            return localized;
        }
    }

    if (activeLanguage === "en") {
        return LANGUAGE_ENGLISH_NAME[lang];
    }

    return LANGUAGE_NATIVE_NAME[lang];
}

function normalizeForSearch(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function getSortedLanguageOrder(
    activeLanguage: Language,
    displayNames: Intl.DisplayNames | null,
    displayNamesReliable: boolean,
): Language[] {
    const collator = new Intl.Collator(LANGUAGE_COLLATOR_LOCALE[activeLanguage], {
        usage: "sort",
        sensitivity: "base",
        numeric: true,
    });

    const sortedRemainder = LANGUAGE_ORDER
        .filter((lang) => lang !== activeLanguage)
        .sort((a, b) => {
            const byLocalizedName = collator.compare(
                translatedLanguageName(a, activeLanguage, displayNames, displayNamesReliable),
                translatedLanguageName(b, activeLanguage, displayNames, displayNamesReliable),
            );
            if (byLocalizedName !== 0) {
                return byLocalizedName;
            }
            return collator.compare(LANGUAGE_NATIVE_NAME[a], LANGUAGE_NATIVE_NAME[b]);
        });

    return [activeLanguage, ...sortedRemainder];
}

export const Sidebar: React.FC<Props> = ({
    pallet,
    setPallet,
    cartons,
    setCartons,
    onCalculate,
    language,
    setLanguage,
    t,
}) => {
    const [editing, setEditing] = useState<CartonInput | null>(null);
    const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
    const [languageSearch, setLanguageSearch] = useState("");
    const [languageHighlightIndex, setLanguageHighlightIndex] = useState(0);
    const languageMenuRef = useRef<HTMLDivElement | null>(null);
    const languageSearchInputRef = useRef<HTMLInputElement | null>(null);
    const languageOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const [collapsedSections, setCollapsedSections] = useState<Record<SectionKey, boolean>>({
        language: false,
        pallet: false,
        cartonType: false,
        cartons: false,
    });

    const toggleSection = (key: SectionKey) => {
        setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAdd = (c: CartonInput) => {
        setCartons([...cartons, c]);
    };

    const handleEdit = (updated: CartonInput) => {
        setCartons(cartons.map(c => c.id === updated.id ? updated : c));
        setEditing(null);
    };

    const handleStartEdit = (c: CartonInput) => {
        setEditing(c);
    };


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!languageMenuRef.current) {
                return;
            }
            if (!languageMenuRef.current.contains(event.target as Node)) {
                setLanguageMenuOpen(false);
                setLanguageSearch("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!languageMenuOpen) {
            return;
        }
        window.requestAnimationFrame(() => {
            languageSearchInputRef.current?.focus();
        });
    }, [languageMenuOpen]);

    const totalCartons = cartons.reduce((a, c) => a + c.quantity, 0);
    const languageDisplayNames = useMemo(() => createDisplayNames(language), [language]);
    const languageDisplayNamesReliable = useMemo(
        () => isDisplayNamesReliable(language, languageDisplayNames),
        [language, languageDisplayNames],
    );
    const sortedLanguageOrder = useMemo(
        () => getSortedLanguageOrder(language, languageDisplayNames, languageDisplayNamesReliable),
        [language, languageDisplayNames, languageDisplayNamesReliable],
    );
    const normalizedLanguageSearch = useMemo(() => normalizeForSearch(languageSearch), [languageSearch]);
    const visibleLanguageOrder = useMemo(() => {
        if (!normalizedLanguageSearch) {
            return sortedLanguageOrder;
        }
        return sortedLanguageOrder.filter((lang) => {
            const localized = translatedLanguageName(lang, language, languageDisplayNames, languageDisplayNamesReliable);
            const nativeName = LANGUAGE_NATIVE_NAME[lang];
            const englishName = LANGUAGE_ENGLISH_NAME[lang];
            const languageCode = lang;
            return [localized, nativeName, englishName, languageCode]
                .map((value) => normalizeForSearch(value))
                .some((value) => value.includes(normalizedLanguageSearch));
        });
    }, [language, languageDisplayNames, languageDisplayNamesReliable, normalizedLanguageSearch, sortedLanguageOrder]);

    useEffect(() => {
        if (!languageMenuOpen) {
            return;
        }
        if (visibleLanguageOrder.length === 0) {
            setLanguageHighlightIndex(-1);
            return;
        }
        setLanguageHighlightIndex((prev) => {
            if (prev >= 0 && prev < visibleLanguageOrder.length) {
                return prev;
            }
            const activeIndex = visibleLanguageOrder.indexOf(language);
            return activeIndex >= 0 ? activeIndex : 0;
        });
    }, [language, languageMenuOpen, visibleLanguageOrder]);

    useEffect(() => {
        if (!languageMenuOpen || languageHighlightIndex < 0) {
            return;
        }
        const highlighted = languageOptionRefs.current[languageHighlightIndex];
        highlighted?.scrollIntoView({ block: "nearest" });
    }, [languageHighlightIndex, languageMenuOpen, visibleLanguageOrder]);

    return (
        <aside className="sidebar">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                <img
                    src={logoIcon}
                    alt="Pallet-o-Crates logo"
                    width={42}
                    height={42}
                    style={{ display: "block", flexShrink: 0, transform: "translateY(-2px)" }}
                />
                <div style={{ minWidth: 0 }}>
                    <h1 style={{ color: "var(--accent)", display: "flex", alignItems: "baseline", gap: 10, fontSize: "1.4rem", margin: 0, lineHeight: 1.08 }}>
                        <span>Pallet-o-Crates</span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.02em" }}>
                            v0.1.0
                        </span>
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 4 }}>{t.appTagline}</p>
                </div>
            </div>

            <SectionPanel
                title={t.languageLabel}
                collapsed={collapsedSections.language}
                onToggle={() => toggleSection("language")}
                className="language-section"
            >
                <div className="field">
                    <div className={`language-select ${languageMenuOpen ? "open" : ""}`} ref={languageMenuRef}>
                        <button
                            type="button"
                            className="language-select-trigger"
                            aria-haspopup="listbox"
                            aria-expanded={languageMenuOpen}
                            onClick={() => {
                                setLanguageMenuOpen((prev) => !prev);
                                setLanguageSearch("");
                            }}
                        >
                            <span className="language-select-primary">
                                {translatedLanguageName(language, language, languageDisplayNames, languageDisplayNamesReliable)}
                            </span>
                            <span className="language-select-native">
                                ({LANGUAGE_NATIVE_NAME[language]})
                            </span>
                            <ChevronDown size={16} className="language-select-chevron" />
                        </button>
                        {languageMenuOpen && (
                            <div className="language-select-menu">
                                <input
                                    ref={languageSearchInputRef}
                                    type="text"
                                    className="language-select-search"
                                    value={languageSearch}
                                    onChange={(event) => setLanguageSearch(event.target.value)}
                                    placeholder={`${t.languageLabel}...`}
                                    aria-label={t.languageLabel}
                                    onKeyDown={(event) => {
                                        if (event.key === "Escape") {
                                            setLanguageMenuOpen(false);
                                            setLanguageSearch("");
                                            return;
                                        }
                                        if (visibleLanguageOrder.length === 0) {
                                            return;
                                        }
                                        if (event.key === "ArrowDown") {
                                            event.preventDefault();
                                            setLanguageHighlightIndex((prev) =>
                                                Math.min(prev + 1, visibleLanguageOrder.length - 1),
                                            );
                                            return;
                                        }
                                        if (event.key === "ArrowUp") {
                                            event.preventDefault();
                                            setLanguageHighlightIndex((prev) => Math.max(prev - 1, 0));
                                            return;
                                        }
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            const index = Math.max(languageHighlightIndex, 0);
                                            const nextLanguage = visibleLanguageOrder[index];
                                            if (!nextLanguage) {
                                                return;
                                            }
                                            setLanguage(nextLanguage);
                                            setLanguageMenuOpen(false);
                                            setLanguageSearch("");
                                        }
                                    }}
                                />
                                <div className="language-select-options" role="listbox" aria-label={t.languageLabel}>
                                    {visibleLanguageOrder.map((lang, index) => {
                                        const isActive = lang === language;
                                        const isHighlighted = index === languageHighlightIndex;
                                        return (
                                            <button
                                                key={lang}
                                                type="button"
                                                role="option"
                                                aria-selected={isActive}
                                                className={`language-select-option${isActive ? " is-active" : ""}${isHighlighted ? " is-highlighted" : ""}`}
                                                ref={(node) => {
                                                    languageOptionRefs.current[index] = node;
                                                }}
                                                onMouseEnter={() => setLanguageHighlightIndex(index)}
                                                onClick={() => {
                                                    setLanguage(lang);
                                                    setLanguageMenuOpen(false);
                                                    setLanguageSearch("");
                                                }}
                                            >
                                                <span className="language-select-primary">
                                                    {translatedLanguageName(lang, language, languageDisplayNames, languageDisplayNamesReliable)}
                                                </span>
                                                <span className="language-select-native">
                                                    ({LANGUAGE_NATIVE_NAME[lang]})
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SectionPanel>

            <SectionPanel
                title={t.palletDimensions}
                collapsed={collapsedSections.pallet}
                onToggle={() => toggleSection("pallet")}
                className="dropdown-section"
            >
                <PalletForm pallet={pallet} onChange={setPallet} t={t} />
            </SectionPanel>

            <SectionPanel
                title={editing ? t.editCartonType : t.addCartonType}
                collapsed={collapsedSections.cartonType}
                onToggle={() => toggleSection("cartonType")}
                className={`dropdown-section${editing ? " is-editing" : ""}`}
            >
                <CartonForm
                    onAdd={handleAdd}
                    onEdit={handleEdit}
                    editing={editing}
                    onCancelEdit={() => setEditing(null)}
                    t={t}
                />
            </SectionPanel>

            {cartons.length > 0 && (
                <SectionPanel
                    title={t.cartonsWithCount(totalCartons)}
                    collapsed={collapsedSections.cartons}
                    onToggle={() => toggleSection("cartons")}
                    className={`carton-list-section ${collapsedSections.cartons ? "collapsed" : "expanded"}`}
                >
                    <div className="carton-list-scroll">
                        {cartons.map(c => (
                            <div key={c.id} className="carton-item" style={editing?.id === c.id ? { borderColor: "var(--accent)" } : undefined}>
                                <div className="carton-dot" style={{ backgroundColor: c.color }} />
                                <div className="carton-meta">
                                    <strong>{c.title}</strong>
                                    <span>
                                        {c.length}x{c.width}x{c.height} mm
                                        <span className="meta-separator">|</span>
                                        {c.weight} kg
                                        <span className="meta-separator">|</span>
                                        x{c.quantity}
                                    </span>
                                </div>
                                <button className="outline" style={{ padding: 5, borderColor: "var(--text-muted)" }} onClick={() => handleStartEdit(c)} title={t.edit}>
                                    <Pencil size={14} />
                                </button>
                                <button className="danger" onClick={() => { setCartons(cartons.filter(x => x.id !== c.id)); if (editing?.id === c.id) setEditing(null); }} title={t.remove}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </SectionPanel>
            )}

            <button onClick={onCalculate} style={{ padding: "14px 0", fontSize: "1rem", marginTop: "auto" }}>
                <Play size={18} fill="currentColor" /> {t.calculatePacking}
            </button>
        </aside>
    );
};
