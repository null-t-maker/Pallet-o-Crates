import type { MenuSelectOption } from "./MenuSelect.types";

interface MenuPlacement {
  openUpward: boolean;
  menuMaxHeight: number;
}

export function getSelectedOption(
  options: readonly MenuSelectOption[],
  value: string,
): MenuSelectOption | undefined {
  return options.find((option) => option.value === value) ?? options[0];
}

export function resolveMenuPlacement(
  triggerRect: DOMRect,
  optionsCount: number,
  viewportHeight: number,
): MenuPlacement {
  const estimatedMenuHeight = Math.min(280, Math.max(120, optionsCount * 44 + 12));
  const spaceBelow = Math.max(0, viewportHeight - triggerRect.bottom - 12);
  const spaceAbove = Math.max(0, triggerRect.top - 12);

  const shouldOpenUpward = spaceBelow < Math.min(estimatedMenuHeight, 180) && spaceAbove > spaceBelow;
  const availableSpace = shouldOpenUpward ? spaceAbove : spaceBelow;
  const menuMaxHeight = Math.max(120, Math.min(280, availableSpace));
  return {
    openUpward: shouldOpenUpward,
    menuMaxHeight,
  };
}

export function buildMenuSelectClassName(
  open: boolean,
  openUpward: boolean,
  className?: string,
): string {
  return `language-select ${open ? "open" : ""}${openUpward ? " open-up" : ""}${className ? ` ${className}` : ""}`;
}
