import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useState } from "react";
import type { DiagnosticsTelemetry } from "../lib/diagnostics";

interface SystemStatsResponse {
  cpuUsage: number;
  cpuSystemUsage: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  memoryWorkingMb: number;
  memoryPrivateMb: number;
}

const FPS_REPORT_INTERVAL_MS = 500;
const SYSTEM_STATS_POLL_INTERVAL_MS = 1000;

export function useDiagnosticsTelemetry(enabled: boolean): DiagnosticsTelemetry {
  const [fps, setFps] = useState<number | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStatsResponse | null>(null);

  useEffect(() => {
    if (!enabled) {
      setFps(null);
      return;
    }
    if (typeof window === "undefined" || typeof performance === "undefined") {
      setFps(null);
      return;
    }

    let rafId = 0;
    let lastReport = performance.now();
    let frames = 0;

    const tick = (now: number) => {
      frames += 1;
      const elapsed = now - lastReport;
      if (elapsed >= FPS_REPORT_INTERVAL_MS) {
        setFps(Math.max(0, Math.round((frames * 1000) / elapsed)));
        frames = 0;
        lastReport = now;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      if (typeof window !== "undefined") {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setSystemStats(null);
      return;
    }

    let canceled = false;
    let intervalId: number | null = null;

    const fetchStats = () => {
      void invoke<SystemStatsResponse>("get_system_stats")
        .then((stats) => {
          if (canceled) return;
          setSystemStats({
            cpuUsage: Math.round(stats.cpuUsage),
            cpuSystemUsage: Math.round(stats.cpuSystemUsage),
            memoryUsedMb: Math.round(stats.memoryUsedMb),
            memoryTotalMb: Math.round(stats.memoryTotalMb),
            memoryWorkingMb: Math.round(stats.memoryWorkingMb),
            memoryPrivateMb: Math.round(stats.memoryPrivateMb),
          });
        })
        .catch(() => {
          if (canceled) return;
          setSystemStats(null);
        });
    };

    fetchStats();
    if (typeof window !== "undefined") {
      intervalId = window.setInterval(fetchStats, SYSTEM_STATS_POLL_INTERVAL_MS);
    }

    return () => {
      canceled = true;
      if (intervalId !== null && typeof window !== "undefined") {
        window.clearInterval(intervalId);
      }
    };
  }, [enabled]);

  return useMemo(() => ({
    fps,
    cpuAppUsage: systemStats?.cpuUsage ?? null,
    cpuSystemUsage: systemStats?.cpuSystemUsage ?? null,
    memorySystemUsedMb: systemStats?.memoryUsedMb ?? null,
    memorySystemTotalMb: systemStats?.memoryTotalMb ?? null,
    memoryAppWorkingSetMb: systemStats?.memoryWorkingMb ?? null,
    memoryAppPrivateMb: systemStats?.memoryPrivateMb ?? null,
  }), [fps, systemStats]);
}
