import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { MenuSelectProps } from "./MenuSelect.types";
import {
    buildMenuSelectClassName,
    filterMenuSelectOptions,
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
    searchable = false,
}) => {
    const [open, setOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const [menuMaxHeight, setMenuMaxHeight] = useState(280);
    const [searchValue, setSearchValue] = useState("");
    const [highlightIndex, setHighlightIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const visibleOptions = useMemo(
        () => (searchable ? filterMenuSelectOptions(options, searchValue) : options),
        [options, searchValue, searchable],
    );
    const visibleOptionCount = Math.max(visibleOptions.length, 1);
    const selectedOption = useMemo(
        () => getSelectedOption(options, value),
        [options, value],
    );

    const closeMenu = React.useCallback(() => {
        setOpen(false);
        setSearchValue("");
        setHighlightIndex(0);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!rootRef.current) {
                return;
            }
            if (!rootRef.current.contains(event.target as Node)) {
                closeMenu();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [closeMenu]);

    useEffect(() => {
        if (disabled) {
            closeMenu();
        }
    }, [closeMenu, disabled]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const updateMenuPlacement = () => {
            if (!rootRef.current) {
                return;
            }

            const triggerRect = rootRef.current.getBoundingClientRect();
            const placement = resolveMenuPlacement(triggerRect, visibleOptionCount, window.innerHeight);
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
    }, [closeMenu, open, visibleOptionCount]);

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

    useEffect(() => {
        if (!open || !searchable) {
            return;
        }
        window.requestAnimationFrame(() => {
            searchInputRef.current?.focus();
        });
    }, [open, searchable]);

    useEffect(() => {
        if (!open || !searchable) {
            return;
        }
        if (visibleOptions.length === 0) {
            setHighlightIndex(-1);
            return;
        }
        setHighlightIndex((prev) => {
            if (prev >= 0 && prev < visibleOptions.length) {
                return prev;
            }
            const activeIndex = visibleOptions.findIndex((option) => option.value === value);
            return activeIndex >= 0 ? activeIndex : 0;
        });
    }, [open, searchable, value, visibleOptions]);

    useEffect(() => {
        if (!open || !searchable || highlightIndex < 0) {
            return;
        }
        optionRefs.current[highlightIndex]?.scrollIntoView({ block: "nearest" });
    }, [highlightIndex, open, searchable, visibleOptions]);

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
                    if (open) {
                        closeMenu();
                        return;
                    }
                    setSearchValue("");
                    setOpen(true);
                }}
                disabled={disabled}
            >
                <span className="language-select-primary">{selectedOption?.label ?? ""}</span>
                <ChevronDown size={16} className="language-select-chevron" />
            </button>
            {open && !disabled && (
                <div
                    className="language-select-menu"
                    style={{ maxHeight: `${menuMaxHeight}px` }}
                >
                    {searchable && (
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="language-select-search"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            placeholder={`${ariaLabel}...`}
                            aria-label={ariaLabel}
                            onKeyDown={(event) => {
                                if (event.key === "Escape") {
                                    closeMenu();
                                    return;
                                }
                                if (visibleOptions.length === 0) {
                                    return;
                                }
                                if (event.key === "ArrowDown") {
                                    event.preventDefault();
                                    setHighlightIndex((prev) => Math.min(prev + 1, visibleOptions.length - 1));
                                    return;
                                }
                                if (event.key === "ArrowUp") {
                                    event.preventDefault();
                                    setHighlightIndex((prev) => Math.max(prev - 1, 0));
                                    return;
                                }
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    const nextOption = visibleOptions[Math.max(highlightIndex, 0)];
                                    if (!nextOption) {
                                        return;
                                    }
                                    onChange(nextOption.value);
                                    closeMenu();
                                }
                            }}
                        />
                    )}
                    <div className="language-select-options" role="listbox" aria-label={ariaLabel}>
                        {visibleOptions.map((option, index) => {
                            const isActive = option.value === value;
                            const isHighlighted = searchable && index === highlightIndex;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="option"
                                    aria-selected={isActive}
                                    title={option.label}
                                    className={`language-select-option${isActive ? " is-active" : ""}${isHighlighted ? " is-highlighted" : ""}`}
                                    ref={(node) => {
                                        optionRefs.current[index] = node;
                                    }}
                                    onMouseEnter={() => {
                                        if (searchable) {
                                            setHighlightIndex(index);
                                        }
                                    }}
                                    onClick={() => {
                                        onChange(option.value);
                                        closeMenu();
                                    }}
                                >
                                    <span className="language-select-primary">{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
