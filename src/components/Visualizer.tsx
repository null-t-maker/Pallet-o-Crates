import React from "react";
import { VisualizerCanvasScene } from "./visualizer/VisualizerCanvasScene";
import { VisualizerOverlays } from "./visualizer/VisualizerOverlays";
import { useVisualizerRuntime } from "./visualizer/useVisualizerRuntime";
import type { VisualizerProps } from "./visualizer/visualizerTypes";

export type { WorkflowMode } from "./visualizer/visualizerTypes";

export const Visualizer: React.FC<VisualizerProps> = (props) => {
  const runtime = useVisualizerRuntime(props);

  return (
    <div ref={runtime.cameraState.containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <VisualizerCanvasScene
        pallet={props.pallet}
        basePallets={runtime.sceneState.basePallets}
        sceneCartons={runtime.sceneState.sceneCartons}
        mode={props.mode}
        selectedId={runtime.selectedId}
        onHover={runtime.setHovered}
        onSelectCarton={runtime.setSelectedId}
        manualMeshRefs={runtime.manualMeshRefs}
        selectedManualCarton={runtime.sceneState.selectedManualCarton}
        selectedManualMesh={runtime.selectedManualMesh}
        setTransformControlsRef={runtime.setTransformControlsRef}
        manualMoveStepMm={runtime.manualMoveStepMm}
        beginManualDrag={runtime.manualEditing.beginManualDrag}
        handleManualTransformEnd={runtime.manualEditing.handleManualTransformEnd}
        clampDraggedMeshAbovePalletTop={runtime.manualEditing.clampDraggedMeshAbovePalletTop}
        orbitControlsRef={runtime.cameraState.orbitControlsRef}
        cameraRef={runtime.cameraState.cameraRef}
        cameraPosition={runtime.cameraState.cameraPosition}
        cameraFar={runtime.cameraState.cameraFar}
        orbitTarget={runtime.cameraState.orbitTarget}
        handleControlsChange={runtime.cameraState.handleControlsChange}
        sceneCenterX={runtime.sceneState.sceneCenterX}
        sceneCenterZ={runtime.sceneState.sceneCenterZ}
        sceneVisualDim={runtime.cameraState.sceneVisualDim}
        gridSpan={runtime.cameraState.gridSpan}
        gridDivisions={runtime.cameraState.gridDivisions}
      />

      <VisualizerOverlays
        t={props.t}
        mode={props.mode}
        hovered={runtime.hovered}
        selectedCarton={runtime.sceneState.selectedCarton}
        selectedManualCarton={runtime.sceneState.selectedManualCarton}
        onClearSelected={() => runtime.setSelectedId(null)}
        pallet={props.pallet}
        manualMoveStepMm={runtime.manualMoveStepMm}
        setManualMoveStepMm={runtime.setManualMoveStepMm}
        manualHint={runtime.manualHint}
        handleManualRotate={runtime.manualEditing.handleManualRotate}
        handleManualAxisInput={runtime.manualEditing.handleManualAxisInput}
        result={props.result}
        layerCount={runtime.sceneState.layerCount}
        palletsUsed={runtime.sceneState.palletsUsed}
        unpackedCount={runtime.sceneState.unpackedCount}
        limitsExceeded={runtime.sceneState.limitsExceeded}
        unpackedMessage={runtime.sceneState.unpackedMessage}
        manualTotalWeight={runtime.sceneState.manualTotalWeight}
        manualMaxHeight={runtime.sceneState.manualMaxHeight}
        manualCartonsCount={props.manualCartons.length}
        palletCountLabel={runtime.sceneState.palletCountLabel}
        manualMoveStepLabel={runtime.sceneState.manualMoveStepLabel}
        manualRotateLabel={runtime.sceneState.manualRotateLabel}
        manualRotateHorizontalLabel={runtime.sceneState.manualRotateHorizontalLabel}
        manualRotateVerticalXLabel={runtime.sceneState.manualRotateVerticalXLabel}
        manualRotateVerticalYLabel={runtime.sceneState.manualRotateVerticalYLabel}
        manualPalletAreaLabel={runtime.sceneState.manualPalletAreaLabel}
        manualClearSelectedCartonAriaLabel={runtime.sceneState.manualClearSelectedCartonAriaLabel}
        manualPlacedCartonsLabel={runtime.sceneState.manualPlacedCartonsLabel}
      />
    </div>
  );
};
