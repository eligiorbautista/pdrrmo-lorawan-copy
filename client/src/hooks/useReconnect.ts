import { useEffect, useRef, useState } from "react";
import { useDeviceStore } from "@/store/deviceStore";

/**
 * Exponential backoff reconnection manager.
 *
 * When the device disconnects unexpectedly, this hook attempts to
 * reconnect with increasing delays: 1s → 2s → 4s → 8s → 16s → max 30s.
 */
export function useReconnect(
  onReconnect: () => Promise<void>,
  opts: { enabled?: boolean } = {},
) {
  const phase = useDeviceStore((s) => s.phase);
  const { enabled = true } = opts;

  const [attempt, setAttempt] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;
    // Only auto-reconnect on unexpected disconnects (not user-initiated)
    if (phase !== "disconnected") return;
    if (reconnecting) return;

    const delay = Math.min(1000 * 2 ** attempt, 30000);

    setReconnecting(true);

    timerRef.current = setTimeout(async () => {
      try {
        await onReconnect();
        setAttempt(0);
      } catch {
        setAttempt((a) => a + 1);
      } finally {
        setReconnecting(false);
      }
    }, delay);

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [phase, attempt, enabled, onReconnect, reconnecting]);

  // Reset on successful connection
  useEffect(() => {
    if (phase === "configured") {
      setAttempt(0);
      setReconnecting(false);
    }
  }, [phase]);

  return {
    attempt,
    reconnecting,
    nextDelay: reconnecting
      ? Math.min(1000 * 2 ** (attempt + 1), 30000) / 1000
      : 0,
  };
}
