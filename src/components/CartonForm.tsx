import React, { useState, useEffect } from "react";
import type { CartonInput, CartonUprightPolicy, ManualSpawnLevel } from "../lib/packer";
import { v4 as uuidv4 } from "uuid";
import { Plus, Check, Trash2 } from "lucide-react";
import { Translations } from "../i18n";
import { MenuSelect } from "./MenuSelect";
import { buildStoredManualSpawnLevels } from "../lib/manualSpawnPlan";

interface Props {
    showManualSpawnControls: boolean;
    onAdd: (carton: CartonInput) => void;
    onEdit: (carton: CartonInput) => void;
    editing: CartonInput | null;
    existingCartonCount: number;
    onCancelEdit: () => void;
    t: Translations;
}

const COLORS = ["#43b66f", "#f0883e", "#cfc807", "#0a07d5", "#f778ba"];
let colorIdx = 0;
const DEFAULT_MANUAL_SPAWN_LEVEL = (quantity: number): ManualSpawnLevel[] => [{ quantity, zLevel: 0 }];

function sanitizeLevelQuantity(value: number): number {
    if (!Number.isFinite(value)) return 1;
    return Math.max(1, Math.floor(value));
}

function sanitizeLevelIndex(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.floor(value));
}

function getAssignedSpawnQuantity(levels: ManualSpawnLevel[]): number {
    return levels.reduce((sum, level) => sum + sanitizeLevelQuantity(level.quantity), 0);
}

function normalizeManualSpawnLevels(levels: ManualSpawnLevel[], quantity: number): ManualSpawnLevel[] {
    const targetQuantity = Math.max(1, Math.floor(quantity || 0));
    const normalized: ManualSpawnLevel[] = [];
    let remaining = targetQuantity;

    for (const level of levels) {
        if (remaining <= 0) break;
        const levelQuantity = Math.min(sanitizeLevelQuantity(level.quantity), remaining);
        if (levelQuantity <= 0) continue;
        normalized.push({
            quantity: levelQuantity,
            zLevel: sanitizeLevelIndex(level.zLevel),
        });
        remaining -= levelQuantity;
    }

    return normalized.length > 0 ? normalized : DEFAULT_MANUAL_SPAWN_LEVEL(targetQuantity);
}

function buildSuggestedCartonName(defaultCartonName: string, nextIndex: number): string {
    const withoutNote = defaultCartonName.replace(/\s*\([^)]*\)\s*$/u, "").trim();
    const parts = withoutNote.split(/\s+/u).filter(Boolean);
    const base = parts.length > 1 ? parts.slice(0, -1).join(" ") : withoutNote;
    const safeBase = base.trim() || withoutNote || "Carton";
    return `${safeBase} ${nextIndex}`.trim();
}

export const CartonForm: React.FC<Props> = ({ showManualSpawnControls, onAdd, onEdit, editing, existingCartonCount, onCancelEdit, t }) => {
    const [title, setTitle] = useState("");
    const [length, setLength] = useState(300);
    const [width, setWidth] = useState(200);
    const [height, setHeight] = useState(150);
    const [weight, setWeight] = useState(2);
    const [quantity, setQuantity] = useState(10);
    const [color, setColor] = useState(COLORS[0]);
    const [manualSpawnLevels, setManualSpawnLevels] = useState<ManualSpawnLevel[]>(() => DEFAULT_MANUAL_SPAWN_LEVEL(10));
    const [uprightPolicy, setUprightPolicy] = useState<CartonUprightPolicy>("tailOnly");
    const suggestedCartonName = buildSuggestedCartonName(t.defaultCartonName, existingCartonCount + 1);

    useEffect(() => {
        if (editing) {
            setTitle(editing.title);
            setLength(editing.length);
            setWidth(editing.width);
            setHeight(editing.height);
            setWeight(editing.weight);
            setQuantity(editing.quantity);
            setColor(editing.color);
            setManualSpawnLevels(editing.manualSpawnLevels?.map((level) => ({ ...level })) ?? DEFAULT_MANUAL_SPAWN_LEVEL(editing.quantity));
            setUprightPolicy(editing.uprightPolicy ?? (editing.allowUpright === false ? "never" : "prefer"));
            return;
        }
        setTitle("");
        setManualSpawnLevels(DEFAULT_MANUAL_SPAWN_LEVEL(quantity));
    }, [editing]);

    const handleQuantityChange = (nextValue: number) => {
        const nextQuantity = Math.max(1, Math.floor(nextValue || 0));
        setQuantity(nextQuantity);
        setManualSpawnLevels((current) => (
            current.length === 1 && current[0].zLevel === 0
                ? [{ quantity: nextQuantity, zLevel: 0 }]
                : normalizeManualSpawnLevels(current, nextQuantity)
        ));
    };

    const handleManualSpawnLevelChange = (index: number, patch: Partial<ManualSpawnLevel>) => {
        setManualSpawnLevels((current) => {
            const next = [...current];
            const currentLevel = next[index];
            if (!currentLevel) return current;

            const otherAssigned = next.reduce((sum, level, levelIndex) => (
                levelIndex === index ? sum : sum + sanitizeLevelQuantity(level.quantity)
            ), 0);
            const maxAllowedForCurrent = Math.max(1, quantity - otherAssigned);

            next[index] = {
                quantity: patch.quantity === undefined
                    ? currentLevel.quantity
                    : Math.min(sanitizeLevelQuantity(patch.quantity), maxAllowedForCurrent),
                zLevel: patch.zLevel === undefined
                    ? currentLevel.zLevel
                    : sanitizeLevelIndex(patch.zLevel),
            };

            return normalizeManualSpawnLevels(next, quantity);
        });
    };

    const handleAddManualSpawnLevel = () => {
        setManualSpawnLevels((current) => {
            const remaining = quantity - getAssignedSpawnQuantity(current);
            if (remaining <= 0) return current;
            const nextZLevel = current.length > 0
                ? Math.max(...current.map((level) => sanitizeLevelIndex(level.zLevel))) + 1
                : 0;
            return [
                ...current,
                { quantity: 1, zLevel: nextZLevel },
            ];
        });
    };

    const handleRemoveManualSpawnLevel = (index: number) => {
        setManualSpawnLevels((current) => (
            current.length <= 1
                ? current
                : current.filter((_, levelIndex) => levelIndex !== index)
        ));
    };

    const handleSubmit = () => {
        if (!width || !length || !height || !quantity) return;
        const resolvedTitle = title.trim() || suggestedCartonName;
        const storedManualSpawnLevels = buildStoredManualSpawnLevels(Math.floor(quantity), manualSpawnLevels);

        if (editing) {
            onEdit({
                id: editing.id,
                title: resolvedTitle || t.untitledCarton,
                width,
                length,
                height,
                weight: weight || 0.5,
                quantity: Math.floor(quantity),
                color,
                enabled: editing.enabled !== false,
                manualSpawnLevels: storedManualSpawnLevels,
                uprightPolicy,
            });
        } else {
            onAdd({
                id: uuidv4(),
                title: resolvedTitle || t.untitledCarton,
                width,
                length,
                height,
                weight: weight || 0.5,
                quantity: Math.floor(quantity),
                color,
                enabled: true,
                manualSpawnLevels: storedManualSpawnLevels,
                uprightPolicy,
            });
            colorIdx = (colorIdx + 1) % COLORS.length;
            setTitle("");
            setColor(COLORS[colorIdx]);
            setManualSpawnLevels(DEFAULT_MANUAL_SPAWN_LEVEL(Math.floor(quantity)));
        }
    };

    const isEditing = editing !== null;
    const assignedSpawnQuantity = getAssignedSpawnQuantity(manualSpawnLevels);
    const canAddManualSpawnLevel = assignedSpawnQuantity < quantity;

    return (
        <>
            <div className="field" style={{ marginBottom: 10 }}>
                <label title={t.cartonName}>{t.cartonName}</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={editing ? t.cartonNamePlaceholder : suggestedCartonName} />
            </div>

            <div className="row">
                <div className="field"><label title={t.cartonLength}>{t.cartonLength}</label><input type="number" value={length} onChange={e => setLength(+e.target.value)} min={1} /></div>
                <div className="field"><label title={t.cartonWidth}>{t.cartonWidth}</label><input type="number" value={width} onChange={e => setWidth(+e.target.value)} min={1} /></div>
                <div className="field"><label title={t.cartonHeight}>{t.cartonHeight}</label><input type="number" value={height} onChange={e => setHeight(+e.target.value)} min={1} /></div>
            </div>

            <div className="row" style={{ marginTop: 10 }}>
                <div className="field"><label title={t.cartonWeight}>{t.cartonWeight}</label><input type="number" value={weight} onChange={e => setWeight(+e.target.value)} min={0.1} step={0.1} /></div>
                <div className="field"><label title={t.cartonQuantity}>{t.cartonQuantity}</label><input type="number" value={quantity} onChange={e => handleQuantityChange(+e.target.value)} min={1} /></div>
                <div className="field carton-color-field">
                    <label title={t.cartonColor}>{t.cartonColor}</label>
                    <input className="carton-color-input" type="color" value={color} onChange={e => setColor(e.target.value)} />
                </div>
            </div>
            {showManualSpawnControls && (
            <div className="field" style={{ marginTop: 10 }}>
                <label title={t.manualSpawnSectionLabel ?? "Manual spawn levels"}>
                    {t.manualSpawnSectionLabel ?? "Manual spawn levels"}
                </label>
                <p style={{ margin: "4px 0 8px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {t.manualSpawnHelperLabel ?? "Split quantity across stack levels. Level 0 = base, 1 = +1 carton height, 2 = +2 carton heights."}
                </p>
                <div className="manual-spawn-level-list">
                    {manualSpawnLevels.map((level, index) => (
                        <div key={`${index}-${level.zLevel}`} className="manual-spawn-level-row">
                            <div className="field manual-spawn-inline-field">
                                <label title={t.manualSpawnQuantityLabel ?? "Qty"}>
                                    {t.manualSpawnQuantityLabel ?? "Qty"}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={Math.max(1, quantity - manualSpawnLevels.reduce((sum, otherLevel, otherIndex) => (
                                        otherIndex === index ? sum : sum + sanitizeLevelQuantity(otherLevel.quantity)
                                    ), 0))}
                                    value={level.quantity}
                                    onChange={(event) => handleManualSpawnLevelChange(index, { quantity: Math.max(1, Math.floor(+event.target.value || 0)) })}
                                />
                            </div>
                            <div className="field manual-spawn-inline-field">
                                <label title={t.manualSpawnLevelLabel ?? "Level"}>
                                    {t.manualSpawnLevelLabel ?? "Level"}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={level.zLevel}
                                    onChange={(event) => handleManualSpawnLevelChange(index, { zLevel: Math.max(0, Math.floor(+event.target.value || 0)) })}
                                />
                            </div>
                            <button
                                type="button"
                                className="outline manual-spawn-remove-btn"
                                onClick={() => handleRemoveManualSpawnLevel(index)}
                                disabled={manualSpawnLevels.length <= 1}
                                title={t.manualSpawnRemoveLevelLabel ?? "Remove level"}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    className="outline"
                    style={{ marginTop: 8, width: "100%" }}
                    onClick={handleAddManualSpawnLevel}
                    disabled={!canAddManualSpawnLevel}
                    title={t.manualSpawnAddLevelLabel ?? "Add level"}
                >
                    <Plus size={16} /> {t.manualSpawnAddLevelLabel ?? "Add level"}
                </button>
            </div>
            )}
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
