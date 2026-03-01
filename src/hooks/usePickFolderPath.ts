import { useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";

export function usePickFolderPath(): () => Promise<string | null> {
  return useCallback(async (): Promise<string | null> => {
    const selection = await open({
      directory: true,
      multiple: false,
      title: "Select folder",
    });
    if (typeof selection === "string") return selection;
    if (Array.isArray(selection)) {
      return typeof selection[0] === "string" ? selection[0] : null;
    }
    return null;
  }, []);
}
