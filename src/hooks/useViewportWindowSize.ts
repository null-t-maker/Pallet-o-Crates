import { useEffect, useState } from "react";
import type { WindowSize } from "./uiOverlaysTypes";

export function useViewportWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => ({
    width: typeof window === "undefined" ? 0 : window.innerWidth,
    height: typeof window === "undefined" ? 0 : window.innerHeight,
  }));

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: Math.max(1, window.innerWidth),
        height: Math.max(1, window.innerHeight),
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return windowSize;
}
