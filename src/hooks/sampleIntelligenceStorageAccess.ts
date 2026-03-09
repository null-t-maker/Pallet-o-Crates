function hasStorage(): boolean {
  return typeof window !== "undefined";
}

export function loadStorageValue(key: string): string | null {
  if (!hasStorage()) return null;
  return window.localStorage.getItem(key);
}

export function persistStorageValue(key: string, value: string): void {
  if (!hasStorage()) return;
  window.localStorage.setItem(key, value);
}

export function removeStorageValue(key: string): void {
  if (!hasStorage()) return;
  window.localStorage.removeItem(key);
}
