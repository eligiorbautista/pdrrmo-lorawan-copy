import { useCallback, useRef, useState } from "react";
import { useDeviceStore } from "@/store/deviceStore";
import { useMessageStore } from "@/store/messageStore";
import {
  formatEmergencyMessage,
  createAlert,
} from "@/lib/emergency";
import type { EmergencyAlert } from "@/lib/types";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

interface EmergencyState {
  sending: boolean;
  lastAlert: EmergencyAlert | null;
  error: string | null;
}

/**
 * Hook for the emergency alert workflow.
 *
 * Sends a structured emergency message over the mesh with
 * automatic retry (up to 3x) if no ACK is received.
 * Stores alerts in messageStore for history.
 */
export function useEmergency() {
  const connection = useDeviceStore((s) => s.connection);
  const myNodeNum = useDeviceStore((s) => s.myNodeNum);
  const addAlert = useMessageStore((s) => s.addAlert);
  const updateAlert = useMessageStore((s) => s.updateAlert);
  const [state, setState] = useState<EmergencyState>({
    sending: false,
    lastAlert: null,
    error: null,
  });
  const cancelRef = useRef(false);

  const sendEmergency = useCallback(
    async (message?: string): Promise<EmergencyAlert> => {
      if (!connection || myNodeNum === null) {
        throw new Error("Device not connected");
      }

      cancelRef.current = false;
      setState((s) => ({ ...s, sending: true, error: null }));

      const gps = await getCurrentPosition().catch(() => undefined);

      const payload = {
        type: "EMERGENCY" as const,
        severity: "EMERGENCY" as const,
        timestamp: Date.now(),
        nodeId: myNodeNum.toString(16).toUpperCase(),
        nodeName: `Node ${myNodeNum.toString(16).toUpperCase()}`,
        gps,
        message,
      };

      const alert = createAlert(payload);
      addAlert(alert);

      const text = formatEmergencyMessage(payload);

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (cancelRef.current) break;

        try {
          await connection.sendText(text, "broadcast", true);
          const updated: EmergencyAlert = {
            ...alert,
            status: "acked",
            retryCount: attempt - 1,
            ackedAt: new Date(),
          };
          updateAlert(alert.id, updated);
          setState({ sending: false, lastAlert: updated, error: null });
          return updated;
        } catch (err) {
          if (attempt < MAX_RETRIES && !cancelRef.current) {
            updateAlert(alert.id, { retryCount: attempt });
            await delay(RETRY_DELAY_MS);
          } else {
            const updated: EmergencyAlert = {
              ...alert,
              status: "failed",
              retryCount: attempt,
            };
            const errMsg =
              err instanceof Error ? err.message : "Send failed";
            updateAlert(alert.id, updated);
            setState({ sending: false, lastAlert: updated, error: errMsg });
            return updated;
          }
        }
      }

      // Should not reach here, but satisfy exhaustiveness
      const failed: EmergencyAlert = {
        ...alert,
        status: "failed",
        retryCount: MAX_RETRIES,
      };
      setState({ sending: false, lastAlert: failed, error: "Max retries exceeded" });
      return failed;
    },
    [connection, myNodeNum, addAlert, updateAlert],
  );

  const cancel = useCallback(() => {
    cancelRef.current = true;
    setState((s) => ({ ...s, sending: false }));
  }, []);

  return {
    sendEmergency,
    cancel,
    sending: state.sending,
    lastAlert: state.lastAlert,
    error: state.error,
    isReady: connection !== null && myNodeNum !== null,
  };
}

function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not available"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 5000, enableHighAccuracy: true },
    );
  });
}
