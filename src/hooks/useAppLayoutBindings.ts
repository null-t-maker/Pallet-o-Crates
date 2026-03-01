import { useAppTopbarBindings } from "./useAppTopbarBindings";
import { useSidebarProps } from "./useSidebarProps";
import { useViewerStageProps } from "./useViewerStageProps";
import type { UseAppLayoutBindingsArgs } from "./useAppLayoutBindingsTypes";
import {
  mapSidebarBindingsArgs,
  mapTopbarBindingsArgs,
  mapViewerStageBindingsArgs,
} from "./useAppLayoutBindingsMaps";

export function useAppLayoutBindings({
  ...args
}: UseAppLayoutBindingsArgs) {
  const topbarProps = useAppTopbarBindings(mapTopbarBindingsArgs(args));
  const viewerStageProps = useViewerStageProps(mapViewerStageBindingsArgs(args));
  const sidebarProps = useSidebarProps(mapSidebarBindingsArgs(args));

  return {
    topbarProps,
    viewerStageProps,
    sidebarProps,
  };
}
