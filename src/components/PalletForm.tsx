import React from "react";
import { ExtraPalletMode, PalletInput, PalletPackingStyle } from "../lib/packer";
import { Translations } from "../i18n";
import { MenuSelect } from "./MenuSelect";

interface Props {
    pallet: PalletInput;
    onChange: (pallet: PalletInput) => void;
    t: Translations;
    showExtraPalletMode?: boolean;
}

export const PalletForm: React.FC<Props> = ({ pallet, onChange, t, showExtraPalletMode = true }) => {
    const setNumber = (key: "length" | "width" | "maxHeight" | "maxWeight", raw: string) => {
        onChange({ ...pallet, [key]: parseFloat(raw) || 0 });
    };
    const setPackingStyle = (packingStyle: PalletPackingStyle) => {
        onChange({ ...pallet, packingStyle });
    };
    const setExtraPalletMode = (extraPalletMode: ExtraPalletMode) => {
        onChange({ ...pallet, extraPalletMode });
    };

    const extraModeLabel = t.palletExtraPalletMode ?? "Additional pallets";
    const extraModeNone = t.extraPalletModeNone ?? "No";
    const extraModeLimitsOnly = t.extraPalletModeLimitsOnly ?? "Yes, only when pallet #1 reaches height or weight limit";
    const extraModeFull = t.extraPalletModeFull ?? "Yes, full flexibility";

    return (
        <>
            <div className="row">
                <div className="field">
                    <label title={t.palletLength}>{t.palletLength}</label>
                    <input type="number" value={pallet.length} onChange={e => setNumber("length", e.target.value)} min={1} />
                </div>
                <div className="field">
                    <label title={t.palletWidth}>{t.palletWidth}</label>
                    <input type="number" value={pallet.width} onChange={e => setNumber("width", e.target.value)} min={1} />
                </div>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
                <div className="field">
                    <label title={t.palletMaxHeight}>{t.palletMaxHeight}</label>
                    <input type="number" value={pallet.maxHeight} onChange={e => setNumber("maxHeight", e.target.value)} min={1} />
                </div>
                <div className="field">
                    <label title={t.palletMaxWeight}>{t.palletMaxWeight}</label>
                    <input type="number" value={pallet.maxWeight} onChange={e => setNumber("maxWeight", e.target.value)} min={1} />
                </div>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
                <div className="field">
                    <label title={t.palletPackingStyle}>{t.palletPackingStyle}</label>
                    <MenuSelect
                        value={pallet.packingStyle ?? "edgeAligned"}
                        onChange={(value) => setPackingStyle(value as PalletPackingStyle)}
                        ariaLabel={t.palletPackingStyle}
                        options={[
                            { value: "centerCompact", label: t.packingStyleCenterCompact },
                            { value: "edgeAligned", label: t.packingStyleEdgeAligned },
                        ]}
                    />
                </div>
            </div>
            {showExtraPalletMode && (
                <div className="row" style={{ marginTop: 10 }}>
                    <div className="field">
                        <label title={extraModeLabel}>{extraModeLabel}</label>
                        <MenuSelect
                            value={pallet.extraPalletMode ?? "none"}
                            onChange={(value) => setExtraPalletMode(value as ExtraPalletMode)}
                            ariaLabel={extraModeLabel}
                            options={[
                                { value: "none", label: extraModeNone },
                                { value: "limitsOnly", label: extraModeLimitsOnly },
                                { value: "full", label: extraModeFull },
                            ]}
                        />
                    </div>
                </div>
            )}
        </>
    );
};
