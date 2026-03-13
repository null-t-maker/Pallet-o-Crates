import type { ViewerStageProps } from "../components/ViewerStage";
import { useDiagnosticsTelemetry } from "./useDiagnosticsTelemetry";
import { mapViewerStageProps } from "./viewerStagePropsMapping";
import type { UseViewerStagePropsArgs } from "./viewerStagePropsTypes";

export function useViewerStageProps(args: UseViewerStagePropsArgs): ViewerStageProps {
  const diagnosticsTelemetry = useDiagnosticsTelemetry(args.uiOverlays.diagnosticsOpen);
  return mapViewerStageProps(args, diagnosticsTelemetry);
}
