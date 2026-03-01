import { useEffect, useState } from "react";

const UI_SCALE_STORAGE_KEY = "palletocrates.uiScale";
const UI_ZOOM_STORAGE_KEY = "palletocrates.uiZoom";

export const UI_SCALE_MIN = 0.85;
export const UI_SCALE_MAX = 1.4;
export const UI_ZOOM_MIN = 0.75;
export const UI_ZOOM_MAX = 1.6;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function loadStoredNumber(key: string, fallback: number, min: number, max: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
}

interface UseUiScaleResult {
  uiScale: number;
  setUiScale: React.Dispatch<React.SetStateAction<number>>;
  uiZoom: number;
  setUiZoom: React.Dispatch<React.SetStateAction<number>>;
}

export function useUiScale(): UseUiScaleResult {
  const [uiScale, setUiScale] = useState<number>(() =>
    loadStoredNumber(UI_SCALE_STORAGE_KEY, 1, UI_SCALE_MIN, UI_SCALE_MAX),
  );
  const [uiZoom, setUiZoom] = useState<number>(() =>
    loadStoredNumber(UI_ZOOM_STORAGE_KEY, 1, UI_ZOOM_MIN, UI_ZOOM_MAX),
  );

  useEffect(() => {
    window.localStorage.setItem(UI_SCALE_STORAGE_KEY, uiScale.toString());
  }, [uiScale]);

  useEffect(() => {
    window.localStorage.setItem(UI_ZOOM_STORAGE_KEY, uiZoom.toString());
  }, [uiZoom]);

  useEffect(() => {
    document.documentElement.style.setProperty("--ui-scale", uiScale.toFixed(2));
    return () => {
      document.documentElement.style.removeProperty("--ui-scale");
    };
  }, [uiScale]);

  useEffect(() => {
    document.documentElement.style.setProperty("--ui-zoom", uiZoom.toFixed(2));
    return () => {
      document.documentElement.style.removeProperty("--ui-zoom");
    };
  }, [uiZoom]);

  return {
    uiScale,
    setUiScale,
    uiZoom,
    setUiZoom,
  };
}
