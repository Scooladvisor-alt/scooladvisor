import { useState, useCallback, useRef } from "react";

export function useJoinFamily() {
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [actionDescription, setActionDescription] = useState("");
  const onCancelCallbackRef = useRef(null);

  const requireAuth = useCallback((user, action = "faire ça", onCancel) => {
    if (!user) {
      setActionDescription(action);
      setShowJoinDialog(true);
      onCancelCallbackRef.current = onCancel || null;
      return false;
    }
    return true;
  }, []);

  const closeDialog = useCallback(() => {
    setShowJoinDialog(false);
    if (onCancelCallbackRef.current) {
      onCancelCallbackRef.current();
      onCancelCallbackRef.current = null;
    }
  }, []);

  return {
    showJoinDialog,
    actionDescription,
    requireAuth,
    closeDialog
  };
}