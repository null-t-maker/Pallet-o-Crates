import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { MenuSelectProps } from "./MenuSelect.types";
import {
    buildMenuSelectClassName,
    getSelectedOption,
    resolveMenuPlacement,
} from "./MenuSelect.utils";

export type { MenuSelectOption } from "./MenuSelect.types";

export const MenuSelect: React.FC<MenuSelectProps> = ({
    value,
    options,
    onChange,
    ariaLabel,
    className,
    disabled = false,
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
        if (disabled) {
            setOpen(false);
        }
    }, [disabled]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const updateMenuPlacement = () => {
            if (!rootRef.current) {
                return;
            }

            const triggerRect = rootRef.current.getBoundingClientRect();
            const placement = resolveMenuPlacement(triggerRect, options.length, window.innerHeight);
            setOpenUpward(placement.openUpward);
            setMenuMaxHeight(placement.menuMaxHeight);
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
        () => getSelectedOption(options, value),
        [options, value],
    );

    return (
        <div
            className={buildMenuSelectClassName(open, openUpward, className)}
            ref={rootRef}
        >
            <button
                type="button"
                className="language-select-trigger"
                aria-haspopup="listbox"
                aria-expanded={open}
                title={selectedOption?.label ?? ""}
                onClick={() => {
                    if (disabled) {
                        return;
                    }
                    setOpen((prev) => !prev);
                }}
                disabled={disabled}
            >
                <span className="language-select-primary">{selectedOption?.label ?? ""}</span>
                <ChevronDown size={16} className="language-select-chevron" />
            </button>
            {open && !disabled && (
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
