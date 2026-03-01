import { Layers } from "lucide-react";
import { MenuSelect } from "./MenuSelect";
import type { Translations } from "../i18n";

interface LayerVisibilityControlProps {
  t: Translations;
  visibleLayers: number;
  setVisibleLayers: (value: number) => void;
  maxLayerCount: number;
}

export function LayerVisibilityControl({
  t,
  visibleLayers,
  setVisibleLayers,
  maxLayerCount,
}: LayerVisibilityControlProps) {
  if (maxLayerCount <= 0) return null;

  return (
    <div className="overlay top-right-layer-only">
      <div className="glass layer-ctrl in-stack top-right-layer-ctrl">
        <Layers size={18} color="var(--accent)" />
        <label style={{ fontSize: "0.85rem", fontWeight: 500 }}>{t.layers}:</label>
        <MenuSelect
          className="layer-ctrl-select"
          value={String(visibleLayers)}
          onChange={(value) => setVisibleLayers(Number(value))}
          ariaLabel={t.layers}
          options={[
            { value: "0", label: t.allLayers(maxLayerCount) },
            ...Array.from({ length: maxLayerCount }, (_, i) => ({ value: String(i + 1), label: t.upToLayer(i + 1) })),
          ]}
        />
      </div>
    </div>
  );
}
