import type { MultiPackResult, PalletInput } from "../../lib/packer";
import type { Translations } from "../../i18n";

interface PackingStatsCardProps {
  t: Translations;
  mode: "generation" | "manual";
  result: MultiPackResult | null;
  pallet: PalletInput;
  layerCount: number;
  palletsUsed: number;
  unpackedCount: number;
  limitsExceeded: boolean;
  unpackedMessage: string;
  manualTotalWeight: number;
  manualMaxHeight: number;
  manualCartonsCount: number;
  palletCountLabel: string;
  manualPlacedCartonsLabel: string;
}

export function PackingStatsCard({
  t,
  mode,
  result,
  pallet,
  layerCount,
  palletsUsed,
  unpackedCount,
  limitsExceeded,
  unpackedMessage,
  manualTotalWeight,
  manualMaxHeight,
  manualCartonsCount,
  palletCountLabel,
  manualPlacedCartonsLabel,
}: PackingStatsCardProps) {
  if (mode === "generation" && result) {
    return (
      <div className="glass stats in-stack">
        <h3 style={{ marginBottom: 6, fontSize: "0.95rem" }} title={t.stats}>{t.stats}</h3>
        <p className="metric-row" style={{ margin: "3px 0", fontSize: "0.85rem" }}>
          <span className="metric-label" title={t.weight}>{t.weight}</span>
          <strong className="metric-value">{result.totalWeight.toFixed(1)} / {(pallet.maxWeight * palletsUsed).toFixed(0)} kg</strong>
        </p>
        <p className="metric-row" style={{ margin: "3px 0", fontSize: "0.85rem" }}>
          <span className="metric-label" title={t.height}>{t.height}</span>
          <strong className="metric-value">{result.maxHeight.toFixed(0)} / {pallet.maxHeight} mm</strong>
        </p>
        <p className="metric-row" style={{ margin: "3px 0", fontSize: "0.85rem" }}>
          <span className="metric-label" title={t.layerCount}>{t.layerCount}</span>
          <strong className="metric-value">{layerCount}</strong>
        </p>
        <p className="metric-row" style={{ margin: "3px 0", fontSize: "0.85rem" }}>
          <span className="metric-label" title={palletCountLabel}>{palletCountLabel}</span>
          <strong className="metric-value">{palletsUsed}</strong>
        </p>
        {unpackedCount > 0 && (
          <p className="truncate-text" title={unpackedMessage} style={{ margin: "3px 0", color: limitsExceeded ? "var(--error)" : "var(--text-muted)", fontSize: "0.85rem" }}>
            <strong>{unpackedMessage}</strong>
          </p>
        )}
      </div>
    );
  }

  if (mode === "manual") {
    return (
      <div className="glass stats in-stack">
        <h3 style={{ marginBottom: 6, fontSize: "0.95rem" }} title={t.stats}>{t.stats}</h3>
        <p className="metric-row" style={{ margin: "3px 0", fontSize: "0.85rem" }}>
          <span className="metric-label" title={t.weight}>{t.weight}</span>
          <strong className="metric-value">{manualTotalWeight.toFixed(1)} / {pallet.maxWeight.toFixed(0)} kg</strong>
        </p>
        <p className="metric-row" style={{ margin: "3px 0", fontSize: "0.85rem" }}>
          <span className="metric-label" title={t.height}>{t.height}</span>
          <strong className="metric-value">{manualMaxHeight.toFixed(0)} / {pallet.maxHeight} mm</strong>
        </p>
        <p className="metric-row" style={{ margin: "3px 0", fontSize: "0.85rem" }}>
          <span className="metric-label" title={manualPlacedCartonsLabel}>{manualPlacedCartonsLabel}</span>
          <strong className="metric-value">{manualCartonsCount}</strong>
        </p>
      </div>
    );
  }

  return null;
}
