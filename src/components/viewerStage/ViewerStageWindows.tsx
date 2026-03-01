import { DiagnosticsWindow } from "../DiagnosticsWindow";
import { UiAccessWindow } from "../UiAccessWindow";
import { UpdateCheckModal } from "../UpdateCheckModal";
import type { ViewerStageProps } from "./viewerStageTypes";

export function ViewerStageWindows({
  uiAccessOpen,
  uiAccessModalRef,
  uiAccessModalStyle,
  uiZoomAndScaleLabel,
  closeLabel,
  closeUiZoomAndScaleLabel,
  uiScaleLabel,
  uiZoomLabel,
  uiScale,
  uiZoom,
  uiScaleMin,
  uiScaleMax,
  uiZoomMin,
  uiZoomMax,
  onSetUiScale,
  onSetUiZoom,
  onCloseUiAccess,
  onBeginDragUiAccess,
  onDragPointerMoveUiAccess,
  onEndDragPointer,
  diagnosticsOpen,
  diagnosticsModalRef,
  diagnosticsModalStyle,
  t,
  closeDiagnosticsLabel,
  diagnostics,
  requestedUnitsLabel,
  packedUnitsLabel,
  overlapCountLabel,
  boundsViolationsLabel,
  windowResolutionLabel,
  hardChecksLabel,
  checksIssuesLabel,
  checksOkLabel,
  diagnosticsHint,
  windowWidth,
  windowHeight,
  onCloseDiagnostics,
  onBeginDragDiagnostics,
  onDragPointerMoveDiagnostics,
  updateCheckModalOpen,
  updateCheckTitle,
  updateCheckQuestion,
  updateCheckYesLabel,
  updateCheckNoLabel,
  onConfirmUpdateCheck,
  onCloseUpdateCheck,
}: ViewerStageProps) {
  return (
    <>
      {uiAccessOpen && (
        <UiAccessWindow
          modalRef={uiAccessModalRef}
          modalStyle={uiAccessModalStyle}
          uiZoomAndScaleLabel={uiZoomAndScaleLabel}
          closeLabel={closeLabel}
          closeUiZoomAndScaleLabel={closeUiZoomAndScaleLabel}
          uiScaleLabel={uiScaleLabel}
          uiZoomLabel={uiZoomLabel}
          uiScale={uiScale}
          uiZoom={uiZoom}
          uiScaleMin={uiScaleMin}
          uiScaleMax={uiScaleMax}
          uiZoomMin={uiZoomMin}
          uiZoomMax={uiZoomMax}
          onSetUiScale={onSetUiScale}
          onSetUiZoom={onSetUiZoom}
          onClose={onCloseUiAccess}
          onPointerDown={onBeginDragUiAccess}
          onPointerMove={onDragPointerMoveUiAccess}
          onPointerUp={onEndDragPointer}
          onPointerCancel={onEndDragPointer}
        />
      )}

      {diagnosticsOpen && (
        <DiagnosticsWindow
          modalRef={diagnosticsModalRef}
          modalStyle={diagnosticsModalStyle}
          diagnosticsLabel={t.diagnostics}
          closeDiagnosticsLabel={closeDiagnosticsLabel}
          diagnostics={diagnostics}
          requestedUnitsLabel={requestedUnitsLabel}
          packedUnitsLabel={packedUnitsLabel}
          overlapCountLabel={overlapCountLabel}
          boundsViolationsLabel={boundsViolationsLabel}
          windowResolutionLabel={windowResolutionLabel}
          hardChecksLabel={hardChecksLabel}
          checksIssuesLabel={checksIssuesLabel}
          checksOkLabel={checksOkLabel}
          diagnosticsHint={diagnosticsHint}
          windowWidth={windowWidth}
          windowHeight={windowHeight}
          onClose={onCloseDiagnostics}
          onPointerDown={onBeginDragDiagnostics}
          onPointerMove={onDragPointerMoveDiagnostics}
          onPointerUp={onEndDragPointer}
          onPointerCancel={onEndDragPointer}
        />
      )}

      {updateCheckModalOpen && (
        <UpdateCheckModal
          updateCheckTitle={updateCheckTitle}
          updateCheckQuestion={updateCheckQuestion}
          updateCheckYesLabel={updateCheckYesLabel}
          updateCheckNoLabel={updateCheckNoLabel}
          onConfirm={onConfirmUpdateCheck}
          onClose={onCloseUpdateCheck}
        />
      )}
    </>
  );
}
