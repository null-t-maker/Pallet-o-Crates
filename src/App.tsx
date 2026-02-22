import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Visualizer } from "./components/Visualizer";
import { PalletInput, CartonInput, PackResult, packPallet } from "./lib/packer";
import "./App.css";
import { Layers } from "lucide-react";
import { DEFAULT_LANGUAGE, Language, isLanguage, resolveTranslation } from "./i18n";
import { MenuSelect } from "./components/MenuSelect";

const LEGACY_LANGUAGE_STORAGE_KEY = "palettevision.language";
const LEGACY_DIAGNOSTICS_STORAGE_KEY = "palettevision.showDiagnostics";
const LANGUAGE_STORAGE_KEY = "palletocrates.language";
const DIAGNOSTICS_STORAGE_KEY = "palletocrates.showDiagnostics";

function App() {
  const [pallet, setPallet] = useState<PalletInput>({
    width: 800,
    length: 1200,
    maxHeight: 1800,
    maxWeight: 1000,
    packingStyle: "edgeAligned",
  });

  const [cartons, setCartons] = useState<CartonInput[]>([]);
  const [result, setResult] = useState<PackResult | null>(null);
  const [visibleLayers, setVisibleLayers] = useState(0);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved =
      window.localStorage.getItem(DIAGNOSTICS_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_DIAGNOSTICS_STORAGE_KEY);
    return saved === "1";
  });
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return DEFAULT_LANGUAGE;
    const saved =
      window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
    return isLanguage(saved) ? saved : DEFAULT_LANGUAGE;
  });
  const t = useMemo(() => resolveTranslation(language), [language]);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem(DIAGNOSTICS_STORAGE_KEY, showDiagnostics ? "1" : "0");
  }, [showDiagnostics]);

  const handleCalculate = () => {
    const res = packPallet({ ...pallet }, cartons.map(c => ({ ...c })));
    setResult(res);
    setVisibleLayers(0);
  };

  return (
    <div className="app">
      <Sidebar
        pallet={pallet}
        setPallet={setPallet}
        cartons={cartons}
        setCartons={setCartons}
        onCalculate={handleCalculate}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
      <main className="viewer">
        <Visualizer
          pallet={pallet}
          result={result}
          visibleLayers={visibleLayers}
          diagnosticsVisible={showDiagnostics}
          onToggleDiagnostics={() => setShowDiagnostics((prev) => !prev)}
          t={t}
        />

        {result && result.layers.length > 0 && (
          <div className="glass overlay layer-ctrl">
            <Layers size={18} color="var(--accent)" />
            <label style={{ fontSize: "0.85rem", fontWeight: 500 }}>{t.layers}:</label>
            <MenuSelect
              className="layer-ctrl-select"
              value={String(visibleLayers)}
              onChange={(value) => setVisibleLayers(Number(value))}
              ariaLabel={t.layers}
              options={[
                { value: "0", label: t.allLayers(result.layers.length) },
                ...result.layers.map((_, i) => ({ value: String(i + 1), label: t.upToLayer(i + 1) })),
              ]}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
