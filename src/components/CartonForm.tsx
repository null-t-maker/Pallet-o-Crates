import React, { useState, useEffect } from "react";
import { CartonInput, CartonUprightPolicy } from "../lib/packer";
import { v4 as uuidv4 } from "uuid";
import { Plus, Check } from "lucide-react";
import { Translations } from "../i18n";
import { MenuSelect } from "./MenuSelect";

interface Props {
    onAdd: (carton: CartonInput) => void;
    onEdit: (carton: CartonInput) => void;
    editing: CartonInput | null;
    onCancelEdit: () => void;
    t: Translations;
}

const COLORS = ["#43b66f", "#f0883e", "#5fc486", "#9cd8b3", "#f778ba", "#6cc79a", "#dbab09"];
let colorIdx = 0;

export const CartonForm: React.FC<Props> = ({ onAdd, onEdit, editing, onCancelEdit, t }) => {
    const [title, setTitle] = useState(t.defaultCartonName);
    const [length, setLength] = useState(300);
    const [width, setWidth] = useState(200);
    const [height, setHeight] = useState(150);
    const [weight, setWeight] = useState(2);
    const [quantity, setQuantity] = useState(10);
    const [color, setColor] = useState(COLORS[0]);
    const [uprightPolicy, setUprightPolicy] = useState<CartonUprightPolicy>("tailOnly");

    useEffect(() => {
        if (editing) {
            setTitle(editing.title);
            setLength(editing.length);
            setWidth(editing.width);
            setHeight(editing.height);
            setWeight(editing.weight);
            setQuantity(editing.quantity);
            setColor(editing.color);
            setUprightPolicy(editing.uprightPolicy ?? (editing.allowUpright === false ? "never" : "prefer"));
        }
    }, [editing]);

    useEffect(() => {
        if (!editing && (title === "Karton A" || title === "Carton A")) {
            setTitle(t.defaultCartonName);
        }
    }, [editing, t.defaultCartonName, title]);

    const handleSubmit = () => {
        if (!width || !length || !height || !quantity) return;

        if (editing) {
            onEdit({
                id: editing.id,
                title: title || t.untitledCarton,
                width,
                length,
                height,
                weight: weight || 0.5,
                quantity: Math.floor(quantity),
                color,
                uprightPolicy,
            });
        } else {
            onAdd({
                id: uuidv4(),
                title: title || t.untitledCarton,
                width,
                length,
                height,
                weight: weight || 0.5,
                quantity: Math.floor(quantity),
                color,
                uprightPolicy,
            });
            colorIdx = (colorIdx + 1) % COLORS.length;
            setColor(COLORS[colorIdx]);
        }
    };

    const isEditing = editing !== null;

    return (
        <>
            <div className="field" style={{ marginBottom: 10 }}>
                <label title={t.cartonName}>{t.cartonName}</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t.cartonNamePlaceholder} />
            </div>

            <div className="row">
                <div className="field"><label title={t.cartonLength}>{t.cartonLength}</label><input type="number" value={length} onChange={e => setLength(+e.target.value)} min={1} /></div>
                <div className="field"><label title={t.cartonWidth}>{t.cartonWidth}</label><input type="number" value={width} onChange={e => setWidth(+e.target.value)} min={1} /></div>
                <div className="field"><label title={t.cartonHeight}>{t.cartonHeight}</label><input type="number" value={height} onChange={e => setHeight(+e.target.value)} min={1} /></div>
            </div>

            <div className="row" style={{ marginTop: 10 }}>
                <div className="field"><label title={t.cartonWeight}>{t.cartonWeight}</label><input type="number" value={weight} onChange={e => setWeight(+e.target.value)} min={0.1} step={0.1} /></div>
                <div className="field"><label title={t.cartonQuantity}>{t.cartonQuantity}</label><input type="number" value={quantity} onChange={e => setQuantity(+e.target.value)} min={1} /></div>
                <div className="field" style={{ maxWidth: 60 }}>
                    <label title={t.cartonColor}>{t.cartonColor}</label>
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ height: 36, padding: 2, borderRadius: 8 }} />
                </div>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
                <div className="field">
                    <label title={t.cartonAllowUpright}>{t.cartonAllowUpright}</label>
                    <MenuSelect
                        value={uprightPolicy}
                        onChange={(value) => setUprightPolicy(value as CartonUprightPolicy)}
                        ariaLabel={t.cartonAllowUpright}
                        options={[
                            { value: "never", label: t.cartonUprightNever },
                            { value: "tailOnly", label: t.cartonUprightTailOnly },
                            { value: "prefer", label: t.cartonUprightPrefer },
                        ]}
                    />
                </div>
            </div>

            <div className="row" style={{ marginTop: 12, gap: 8 }}>
                <button onClick={handleSubmit} style={{ flex: 1 }} title={isEditing ? t.updateCarton : t.addCartons}>
                    {isEditing ? <><Check size={16} /> {t.updateCarton}</> : <><Plus size={16} /> {t.addCartons}</>}
                </button>
                {isEditing && (
                    <button className="outline" onClick={onCancelEdit} style={{ flex: 0 }} title={t.cancel}>
                        {t.cancel}
                    </button>
                )}
            </div>
        </>
    );
};
