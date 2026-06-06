import { useEffect, useRef, useState } from "react";
import { useMessageStore } from "@/store/messageStore";
import type { AppMessage, EmergencyAlert, WsMessage } from "@/lib/types";

interface UseWebSocketOptions {
  url: string;
  enabled?: boolean;
}

interface WsState {
  connected: boolean;
  clientId: string | null;
  error: string | null;
}

/**
 * Connects to the PDRRMO command center backend via WebSocket.
 * Receives real-time alerts, messages, and node updates.
 */
export function useWebSocket({ url, enabled = true }: UseWebSocketOptions) {
  const [state, setState] = useState<WsState>({
    connected: false,
    clientId: null,
    error: null,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const addAlert = useMessageStore((s) => s.addAlert);
  const addMessage = useMessageStore((s) => s.addMessage);

  useEffect(() => {
    if (!enabled) return;

    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let shouldReconnect = true;

    const connect = () => {
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setState((s) => ({ ...s, connected: true, error: null }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WsMessage;
            handleWsMessage(data, addAlert, addMessage);
            if (data.type === "connected") {
              setState((s) => ({
                ...s,
                clientId: (data as { clientId: string }).clientId,
              }));
            }
          } catch {
            // Ignore malformed messages
          }
        };

        ws.onclose = () => {
          setState((s) => ({ ...s, connected: false }));
          if (shouldReconnect) {
            reconnectTimer = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          setState((s) => ({
            ...s,
            error: "WebSocket connection failed",
          }));
        };
      } catch (err) {
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Connection failed",
        }));
        if (shouldReconnect) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      shouldReconnect = false;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [url, enabled, addAlert, addMessage]);

  return state;
}

function handleWsMessage(
  data: WsMessage,
  addAlert: (alert: EmergencyAlert) => void,
  addMessage: (msg: AppMessage) => void,
) {
  switch (data.type) {
    case "alert": {
      const a = data.alert;
      addAlert(a);
      break;
    }
    case "message": {
      const m = data.message;
      if (m) addMessage(m);
      break;
    }
    case "node_update": {
      // Node updates are handled via deviceStore when connected via BT
      // For WS-only dashboards, they'd be added here
      break;
    }
  }
}
