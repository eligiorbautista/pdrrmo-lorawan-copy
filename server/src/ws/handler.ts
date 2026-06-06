import type { ServerWebSocket } from "bun";
import type { WsMessage } from "@/lib/types";

/** Set of connected WebSocket clients */
export const clients = new Set<ServerWebSocket<unknown>>();

/**
 * Handle incoming WebSocket connection.
 */
export function handleOpen(ws: ServerWebSocket<unknown>): void {
  clients.add(ws);

  ws.send(
    JSON.stringify({
      type: "connected",
      payload: { clientId: crypto.randomUUID().slice(0, 8) },
    }),
  );
}

/**
 * Handle closed WebSocket connection.
 */
export function handleClose(ws: ServerWebSocket<unknown>): void {
  clients.delete(ws);
}

/**
 * Broadcast a message to all connected WebSocket clients.
 */
export function broadcast(message: WsMessage): void {
  const data = JSON.stringify(message);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

/** Get the number of connected clients */
export function clientCount(): number {
  return clients.size;
}
