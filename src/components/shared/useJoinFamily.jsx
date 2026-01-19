import { useState, useCallback } from "react";

export function useJoinFamily() {
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [actionDescription, setActionDescription] = useState("");

  const requireAuth = useCallback((user, action = "faire ça") => {
    if (!user) {
      setActionDescription(action);
      setShowJoinDialog(true);
      return false;
    }
    return true;
  }, []);

  const closeDialog = useCallback(() => {
    setShowJoinDialog(false);
  }, []);

  return {
    showJoinDialog,
    actionDescription,
    requireAuth,
    closeDialog
  };
}