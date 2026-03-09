import type { PalletInput } from "./packerTypes";
import type {
  CenterStats,
  PlacementRect,
  Rect,
  SelectionMode,
  WallStats,
} from "./packerCoreTypes";
import {
  centerStats as computeCenterStats,
  estimateGapStats as computeEstimateGapStats,
  wallStats as computeWallStats,
} from "./packerLayerMetrics";
import {
  analyzeSupport as computeAnalyzeSupport,
  hasFullSupport as computeHasFullSupport,
  pressureSafe as computePressureSafe,
  structuralSupportSafe as computeStructuralSupportSafe,
  type SupportInfo,
} from "./packerSupportModel";
import {
  compactness as computeCompactness,
  connectedComponentCount as computeConnectedComponentCount,
  cornerCoverage as computeCornerCoverage,
  hasWrapBlockingEdgeProtrusion as computeHasWrapBlockingEdgeProtrusion,
  isWrapFriendlyLayerShape as computeIsWrapFriendlyLayerShape,
} from "./packerShapeAnalysis";
import {
  buildMirrorHashes,
  createLayerMetricDeps,
  createShapeAnalysisDeps,
  createSupportModelDeps,
} from "./packerRuntimeSharedDeps";

export interface GapStats {
  largestGapRatio: number;
  emptyRatio: number;
}

export interface PackerRuntimeWrappers {
  hasWrapBlockingEdgeProtrusion: (rects: Rect[], palletWidth: number, palletLength: number) => boolean;
  isWrapFriendlyLayerShape: (rects: Rect[], supportRects: Rect[], pallet: PalletInput) => boolean;
  compactness: (rects: Rect[], palletWidth: number, palletLength: number, mode: SelectionMode) => number;
  cornerCoverage: (rects: Rect[], palletWidth: number, palletLength: number) => number;
  wallStats: (rects: Rect[], palletWidth: number, palletLength: number) => WallStats;
  estimateGapStats: (rects: Rect[], palletWidth: number, palletLength: number) => GapStats;
  centerStats: (rects: Rect[], palletWidth: number, palletLength: number) => CenterStats;
  connectedComponentCount: (rects: Rect[]) => number;
  analyzeSupport: (rect: Rect, below: PlacementRect[]) => SupportInfo;
  hasFullSupport: (support: SupportInfo) => boolean;
  pressureSafe: (
    cartonWeight: number,
    support: SupportInfo,
    pressureLimitFactor: number,
  ) => { ok: boolean; marginScore: number };
  structuralSupportSafe: (topWeight: number, topArea: number, support: SupportInfo) => boolean;
  mirrorHashes: (rects: Rect[], palletWidth: number, palletLength: number) => Set<string>;
}

export function buildPackerRuntimeWrappers(
  EPS: number,
  minFullSupportRatio: number,
): PackerRuntimeWrappers {
  const shapeAnalysisDeps = createShapeAnalysisDeps(EPS);
  const layerMetricDeps = createLayerMetricDeps(EPS);
  const supportModelDeps = createSupportModelDeps(EPS, minFullSupportRatio);

  const hasWrapBlockingEdgeProtrusion = (rects: Rect[], pw: number, pl: number): boolean => (
    computeHasWrapBlockingEdgeProtrusion(rects, pw, pl, shapeAnalysisDeps)
  );

  const isWrapFriendlyLayerShape = (
    rects: Rect[],
    supportRects: Rect[],
    pallet: PalletInput,
  ): boolean => (
    computeIsWrapFriendlyLayerShape(rects, supportRects, pallet, shapeAnalysisDeps)
  );

  const compactness = (rects: Rect[], pw: number, pl: number, mode: SelectionMode): number => (
    computeCompactness(rects, pw, pl, mode, shapeAnalysisDeps)
  );

  const cornerCoverage = (rects: Rect[], pw: number, pl: number): number => (
    computeCornerCoverage(rects, pw, pl, shapeAnalysisDeps)
  );

  const wallStats = (rects: Rect[], pw: number, pl: number): WallStats => (
    computeWallStats(rects, pw, pl, layerMetricDeps)
  );

  const estimateGapStats = (rects: Rect[], pw: number, pl: number): GapStats => (
    computeEstimateGapStats(rects, pw, pl, layerMetricDeps)
  );

  const centerStats = (rects: Rect[], pw: number, pl: number): CenterStats => (
    computeCenterStats(rects, pw, pl, layerMetricDeps)
  );

  const connectedComponentCount = (rects: Rect[]): number => (
    computeConnectedComponentCount(rects, shapeAnalysisDeps)
  );

  const analyzeSupport = (rect: Rect, below: PlacementRect[]): SupportInfo => (
    computeAnalyzeSupport(rect, below, supportModelDeps)
  );

  const hasFullSupport = (support: SupportInfo): boolean => (
    computeHasFullSupport(support, supportModelDeps)
  );

  const pressureSafe = (
    cartonWeight: number,
    support: SupportInfo,
    pressureLimitFactor: number,
  ): { ok: boolean; marginScore: number } => (
    computePressureSafe(cartonWeight, support, pressureLimitFactor, supportModelDeps)
  );

  const structuralSupportSafe = (
    topWeight: number,
    topArea: number,
    support: SupportInfo,
  ): boolean => (
    computeStructuralSupportSafe(topWeight, topArea, support, supportModelDeps)
  );

  const mirrorHashes = (rects: Rect[], pw: number, pl: number): Set<string> => (
    buildMirrorHashes(rects, pw, pl, EPS)
  );

  return {
    hasWrapBlockingEdgeProtrusion,
    isWrapFriendlyLayerShape,
    compactness,
    cornerCoverage,
    wallStats,
    estimateGapStats,
    centerStats,
    connectedComponentCount,
    analyzeSupport,
    hasFullSupport,
    pressureSafe,
    structuralSupportSafe,
    mirrorHashes,
  };
}

