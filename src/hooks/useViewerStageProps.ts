import type { ViewerStageProps } from "../components/ViewerStage";
import { mapViewerStageProps } from "./viewerStagePropsMapping";
import type { UseViewerStagePropsArgs } from "./viewerStagePropsTypes";

export function useViewerStageProps(args: UseViewerStagePropsArgs): ViewerStageProps {
  return mapViewerStageProps(args);
}
