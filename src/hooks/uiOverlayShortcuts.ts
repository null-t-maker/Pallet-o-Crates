export interface ShortcutConfig {
  alt: boolean;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
  key: string;
}

export type ShortcutTarget = "uiAccess" | "diagnostics";

export function normalizeShortcutKey(key: string): string {
  if (!key) return "";
  if (key === " ") return "Space";
  if (key.length === 1) return key.toUpperCase();
  if (key === "Esc") return "Escape";
  return key;
}

export function isModifierOnlyKey(key: string): boolean {
  return key === "Alt" || key === "Control" || key === "Shift" || key === "Meta";
}

function isShortcutConfig(value: unknown): value is ShortcutConfig {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ShortcutConfig>;
  return typeof candidate.alt === "boolean"
    && typeof candidate.ctrl === "boolean"
    && typeof candidate.shift === "boolean"
    && typeof candidate.meta === "boolean"
    && typeof candidate.key === "string"
    && candidate.key.trim().length > 0;
}

export function loadStoredShortcut(key: string, fallback: ShortcutConfig): ShortcutConfig {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isShortcutConfig(parsed)) return fallback;
    const normalizedKey = normalizeShortcutKey(parsed.key);
    if (!normalizedKey || isModifierOnlyKey(normalizedKey)) return fallback;
    return { ...parsed, key: normalizedKey };
  } catch {
    return fallback;
  }
}

export function shortcutEquals(a: ShortcutConfig, b: ShortcutConfig): boolean {
  return a.alt === b.alt
    && a.ctrl === b.ctrl
    && a.shift === b.shift
    && a.meta === b.meta
    && a.key === b.key;
}

export function shortcutToLabel(shortcut: ShortcutConfig): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.shift) parts.push("Shift");
  if (shortcut.meta) parts.push("Meta");
  parts.push(shortcut.key);
  return parts.join("+");
}

export function eventMatchesShortcut(event: KeyboardEvent, shortcut: ShortcutConfig): boolean {
  const pressedKey = normalizeShortcutKey(event.key);
  return pressedKey === shortcut.key
    && event.altKey === shortcut.alt
    && event.ctrlKey === shortcut.ctrl
    && event.shiftKey === shortcut.shift
    && event.metaKey === shortcut.meta;
}
