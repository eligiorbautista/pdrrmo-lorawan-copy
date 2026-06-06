/**
 * Meshtastic gateway node connection stub.
 *
 * In production, this would connect to a dedicated Meshtastic node
 * via serial (Web Serial API on Chromium) or HTTP (if node runs a web server).
 * It receives mesh messages and forwards them to the backend for processing.
 *
 * For the MVP, this is a placeholder that logs gateway status.
 * The actual implementation depends on the deployment environment:
 * - Serial: use @meshtastic/core + TransportWebSerial on a Chromium-based machine
 * - HTTP: connect to node's built-in HTTP API
 * - MQTT: bridge via MQTT broker for internet-to-mesh forwarding
 */

import { broadcast } from "@/ws/handler";
import { insertAlert, insertMessage, upsertNode } from "@/db/queries";
import type { WsMessage } from "@/lib/types";

export interface GatewayConfig {
  /** Connection type: "serial", "http", or "mqtt" */
  type: "serial" | "http" | "mqtt";
  /** Serial port path (for serial type) */
  port?: string;
  /** HTTP base URL (for http type) */
  url?: string;
  /** MQTT broker URL (for mqtt type) */
  broker?: string;
}

/**
 * Initialize the gateway connection.
 *
 * Currently a placeholder. When connected to a real Meshtastic node,
 * this would subscribe to incoming messages and forward them to the
 * backend stores + WebSocket broadcast.
 */
export function initGateway(_config: GatewayConfig): void {
  console.log(`[Gateway] Initializing ${_config.type} connection...`);
  console.log("[Gateway] Gateway mode not yet implemented — run the PWA as a field client instead.");

  // Placeholder: periodically check for simulated alerts
  // In production, replace this with real Meshtastic event subscriptions.
}

/**
 * Called when a mesh message is received from the gateway node.
 * Processes it and broadcasts to connected WebSocket clients.
 */
export function onMeshMessageReceived(message: {
  text: string;
  from: number;
  to: number;
  channel: number;
  isEmergency: boolean;
}): void {
  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  insertMessage({
    id,
    text: message.text,
    from_node: message.from,
    to_node: message.to,
    channel: message.channel,
    direction: "received",
    emergency: message.isEmergency,
    created_at: now,
  });

  const wsMsg: WsMessage = {
    type: "message",
    payload: {
      id,
      text: message.text,
      from: message.from,
      to: message.to,
      channel: message.channel,
      emergency: message.isEmergency,
      timestamp: now,
    },
  };
  broadcast(wsMsg);

  // If it's an emergency message, process as alert
  if (message.isEmergency && message.text.startsWith("🚨EMERGENCY")) {
    const alertId = `alert-${Date.now()}`;
    insertAlert({
      id: alertId,
      node_id: message.from.toString(16).toUpperCase(),
      node_name: `Node ${message.from.toString(16).toUpperCase()}`,
      severity: "EMERGENCY",
      message: message.text,
      gps_lat: null,
      gps_lng: null,
      status: "received",
      created_at: now,
      acknowledged_at: null,
      resolved_at: null,
    });

    broadcast({
      type: "alert",
      payload: {
        id: alertId,
        nodeId: message.from.toString(16).toUpperCase(),
        severity: "EMERGENCY",
        message: message.text,
      },
    });
  }
}

/**
 * Update node information from a received position or node info packet.
 */
export function onNodeUpdate(node: {
  nodeNum: number;
  shortName: string;
  longName: string;
  role: string;
  gpsLat?: number;
  gpsLng?: number;
  batteryLevel?: number;
}): void {
  upsertNode({
    node_num: node.nodeNum,
    short_name: node.shortName,
    long_name: node.longName,
    role: node.role,
    last_heard: new Date().toISOString(),
    gps_lat: node.gpsLat ?? null,
    gps_lng: node.gpsLng ?? null,
    battery_level: node.batteryLevel ?? null,
  });

  broadcast({
    type: "node_update",
    payload: node,
  });
}
