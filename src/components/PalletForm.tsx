import React from "react";
import { PalletInput, PalletPackingStyle } from "../lib/packer";
import { Translations } from "../i18n";
import { MenuSelect } from "./MenuSelect";

interface Props {
    pallet: PalletInput;
    onChange: (pallet: PalletInput) => void;
    t: Translations;
}

export const PalletForm: React.FC<Props> = ({ pallet, onChange, t }) => {
    const setNumber = (key: "length" | "width" | "maxHeight" | "maxWeight", raw: string) => {
        onChange({ ...pallet, [key]: parseFloat(raw) || 0 });
    };
    const setPackingStyle = (packingStyle: PalletPackingStyle) => {
        onChange({ ...pallet, packingStyle });
    };

    return (
        <>
            <div className="row">
                <div className="field">
                    <label>{t.palletLength}</label>
                    <input type="number" value={pallet.length} onChange={e => setNumber("length", e.target.value)} min={1} />
                </div>
                <div className="field">
                    <label>{t.palletWidth}</label>
                    <input type="number" value={pallet.width} onChange={e => setNumber("width", e.target.value)} min={1} />
                </div>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
                <div className="field">
                    <label>{t.palletMaxHeight}</label>
                    <input type="number" value={pallet.maxHeight} onChange={e => setNumber("maxHeight", e.target.value)} min={1} />
                </div>
                <div className="field">
                    <label>{t.palletMaxWeight}</label>
                    <input type="number" value={pallet.maxWeight} onChange={e => setNumber("maxWeight", e.target.value)} min={1} />
                </div>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
                <div className="field">
                    <label>{t.palletPackingStyle}</label>
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
        </>
    );
};
