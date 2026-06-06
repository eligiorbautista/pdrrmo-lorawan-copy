import type { ServerWebSocket } from "bun";
import type { WsMessage } from "@/lib/types";

/** Set of connected WebSocket clients */
const clients = new Set<ServerWebSocket<unknown>>();

/**
 * Handle incoming WebSocket connection.
 */
export function handleConnection(ws: ServerWebSocket<unknown>): void {
  clients.add(ws);

  ws.send(
    JSON.stringify({
      type: "connected",
      payload: { clientId: crypto.randomUUID().slice(0, 8) },
    }),
  );

  ws.addEventListener("close", () => {
    clients.delete(ws);
  });

  ws.addEventListener("message", (event) => {
    // Handle client-to-server messages if needed
    // For MVP, clients only receive broadcasts
    void event;
  });
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
