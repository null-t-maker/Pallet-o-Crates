import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface MenuSelectOption {
    value: string;
    label: string;
}

interface Props {
    value: string;
    options: readonly MenuSelectOption[];
    onChange: (value: string) => void;
    ariaLabel: string;
    className?: string;
}

export const MenuSelect: React.FC<Props> = ({
    value,
    options,
    onChange,
    ariaLabel,
    className,
}) => {
    const [open, setOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const [menuMaxHeight, setMenuMaxHeight] = useState(280);
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!rootRef.current) {
                return;
            }
            if (!rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        const updateMenuPlacement = () => {
            if (!rootRef.current) {
                return;
            }

            const triggerRect = rootRef.current.getBoundingClientRect();
            const estimatedMenuHeight = Math.min(280, Math.max(120, options.length * 44 + 12));
            const spaceBelow = Math.max(0, window.innerHeight - triggerRect.bottom - 12);
            const spaceAbove = Math.max(0, triggerRect.top - 12);

            const shouldOpenUpward = spaceBelow < Math.min(estimatedMenuHeight, 180) && spaceAbove > spaceBelow;
            setOpenUpward(shouldOpenUpward);
            const availableSpace = shouldOpenUpward ? spaceAbove : spaceBelow;
            setMenuMaxHeight(Math.max(120, Math.min(280, availableSpace)));
        };

        updateMenuPlacement();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        window.addEventListener("resize", updateMenuPlacement);
        window.addEventListener("scroll", updateMenuPlacement, true);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("resize", updateMenuPlacement);
            window.removeEventListener("scroll", updateMenuPlacement, true);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, options.length]);

    useEffect(() => {
        const host = rootRef.current?.closest<HTMLElement>(".section-card, .layer-ctrl");
        if (!host) {
            return;
        }
        if (open) {
            host.classList.add("has-open-select");
        } else {
            host.classList.remove("has-open-select");
        }
        return () => {
            host.classList.remove("has-open-select");
        };
    }, [open]);

    const selectedOption = useMemo(
        () => options.find((option) => option.value === value) ?? options[0],
        [options, value],
    );

    return (
        <div
            className={`language-select ${open ? "open" : ""}${openUpward ? " open-up" : ""}${className ? ` ${className}` : ""}`}
            ref={rootRef}
        >
            <button
                type="button"
                className="language-select-trigger"
                aria-haspopup="listbox"
                aria-expanded={open}
                title={selectedOption?.label ?? ""}
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className="language-select-primary">{selectedOption?.label ?? ""}</span>
                <ChevronDown size={16} className="language-select-chevron" />
            </button>
            {open && (
                <div
                    className="language-select-menu"
                    role="listbox"
                    aria-label={ariaLabel}
                    style={{ maxHeight: `${menuMaxHeight}px` }}
                >
                    {options.map((option) => {
                        const isActive = option.value === value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                title={option.label}
                                className={`language-select-option${isActive ? " is-active" : ""}`}
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                            >
                                <span className="language-select-primary">{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
