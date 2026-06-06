import { useState, useEffect, useCallback } from "react";

interface OfflineState {
  online: boolean;
  /** The last time we detected online status */
  lastOnline: Date | null;
}

/**
 * Tracks browser online/offline status.
 * Also provides a method to flush queued data when back online.
 */
export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    online: navigator.onLine,
    lastOnline: navigator.onLine ? new Date() : null,
  });

  useEffect(() => {
    const handleOnline = () =>
      setState({ online: true, lastOnline: new Date() });
    const handleOffline = () =>
      setState((s) => ({ ...s, online: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const flushQueue = useCallback(async () => {
    // Will be wired to message queue in Phase 7
    if (!state.online) return;
  }, [state.online]);

  return {
    online: state.online,
    lastOnline: state.lastOnline,
    flushQueue,
  };
}
