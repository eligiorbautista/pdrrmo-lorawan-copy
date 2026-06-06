import type { EmergencyPayload, EmergencyAlert } from "@/lib/types";

const EMERGENCY_PREFIX = "🚨EMERGENCY";

/**
 * Serializes an EmergencyPayload to a compact text format
 * suitable for sending over the Meshtastic TEXT_MESSAGE_APP port.
 */
export function formatEmergencyMessage(payload: EmergencyPayload): string {
  const parts = [
    EMERGENCY_PREFIX,
    payload.severity,
    payload.nodeId,
    payload.nodeName,
  ];
  if (payload.gps) {
    parts.push(`${payload.gps.lat},${payload.gps.lng}`);
  }
  if (payload.message) {
    parts.push(payload.message);
  }
  return parts.join("|");
}

/**
 * Attempts to parse an emergency message from a received text string.
 * Returns null if the message is not a recognized emergency format.
 */
export function parseEmergencyMessage(text: string): EmergencyPayload | null {
  if (!text.startsWith(EMERGENCY_PREFIX)) return null;

  const parts = text.split("|");
  if (parts.length < 4) return null;

  const [, severity, nodeId, nodeName, gpsStr, ...messageParts] = parts;

  if (severity !== "EMERGENCY" && severity !== "URGENT" && severity !== "INFO") {
    return null;
  }

  let gps: { lat: number; lng: number } | undefined;
  if (gpsStr?.includes(",")) {
    const [lat, lng] = gpsStr.split(",").map(Number);
    if (!isNaN(lat) && !isNaN(lng)) {
      gps = { lat, lng };
    }
  }

  return {
    type: "EMERGENCY",
    timestamp: Date.now(),
    nodeId,
    nodeName,
    gps,
    message: messageParts.length > 0 ? messageParts.join("|") : undefined,
    severity: severity as EmergencyPayload["severity"],
  };
}

/**
 * Creates an EmergencyAlert record from a payload.
 */
export function createAlert(payload: EmergencyPayload): EmergencyAlert {
  return {
    id: `alert-${payload.timestamp}-${payload.nodeId}`,
    payload,
    status: "sent",
    retryCount: 0,
    createdAt: new Date(),
  };
}
