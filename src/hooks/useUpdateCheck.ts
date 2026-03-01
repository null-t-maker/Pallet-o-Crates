import { openUrl } from "@tauri-apps/plugin-opener";
import { useCallback, useState } from "react";

interface UseUpdateCheckArgs {
  releasesPageUrl: string;
}

interface UseUpdateCheckResult {
  updateCheckModalOpen: boolean;
  openUpdateCheckModal: () => void;
  closeUpdateCheckModal: () => void;
  handleConfirmUpdateCheck: () => void;
}

export function useUpdateCheck({ releasesPageUrl }: UseUpdateCheckArgs): UseUpdateCheckResult {
  const [updateCheckModalOpen, setUpdateCheckModalOpen] = useState(false);

  const openUpdateCheckModal = useCallback(() => {
    setUpdateCheckModalOpen(true);
  }, []);

  const closeUpdateCheckModal = useCallback(() => {
    setUpdateCheckModalOpen(false);
  }, []);

  const handleConfirmUpdateCheck = useCallback(() => {
    setUpdateCheckModalOpen(false);
    void openUrl(releasesPageUrl).catch((error) => {
      console.error("Failed to open releases page.", error);
    });
  }, [releasesPageUrl]);

  return {
    updateCheckModalOpen,
    openUpdateCheckModal,
    closeUpdateCheckModal,
    handleConfirmUpdateCheck,
  };
}
