import type { ViewerStageProps } from "./viewerStage/viewerStageTypes";
import { Visualizer } from "./Visualizer";
import { LayerVisibilityControl } from "./LayerVisibilityControl";
import { ViewerStageWindows } from "./viewerStage/ViewerStageWindows";
export type { ViewerStageProps } from "./viewerStage/viewerStageTypes";

export function ViewerStage(props: ViewerStageProps) {
  const {
    pallet,
    result,
    visibleLayers,
    setVisibleLayers,
    t,
    workflowMode,
    manualCartons,
    onManualCartonUpdate,
    maxLayerCount,
  } = props;

  return (
    <main className="viewer">
      <Visualizer
        pallet={pallet}
        result={result}
        visibleLayers={visibleLayers}
        t={t}
        mode={workflowMode}
        manualCartons={manualCartons}
        onManualCartonUpdate={onManualCartonUpdate}
      />

      <ViewerStageWindows {...props} />

      {workflowMode === "generation" && result && (
        <LayerVisibilityControl
          t={t}
          visibleLayers={visibleLayers}
          setVisibleLayers={setVisibleLayers}
          maxLayerCount={maxLayerCount}
        />
      )}
    </main>
  );
}
