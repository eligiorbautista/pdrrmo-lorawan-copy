/** Connection lifecycle phases for the PDRRMO app */
export type ConnectionPhase =
  | "idle"
  | "scanning"
  | "connecting"
  | "configuring"
  | "configured"
  | "disconnected"
  | "error";

/** A simplified node view for the UI */
export interface MeshNode {
  nodeNum: number;
  shortName: string;
  longName: string;
  lastHeard: Date | null;
  position?: {
    latitude: number;
    longitude: number;
  };
  role: string;
  batteryLevel?: number;
}

/** A text message in the app */
export interface AppMessage {
  id: string;
  text: string;
  from: number;
  to: number | "broadcast";
  channel: number;
  timestamp: Date;
  direction: "sent" | "received";
  acked: boolean;
  /** Whether this was an emergency alert */
  emergency: boolean;
}

/** Emergency alert payload sent over the mesh */
export interface EmergencyPayload {
  type: "EMERGENCY";
  timestamp: number;
  nodeId: string;
  nodeName: string;
  gps?: { lat: number; lng: number };
  message?: string;
  severity: "EMERGENCY" | "URGENT" | "INFO";
}

/** Emergency alert stored locally + synced to backend */
export interface EmergencyAlert {
  id: string;
  payload: EmergencyPayload;
  status: "sent" | "acked" | "failed" | "received" | "acknowledged" | "resolved";
  retryCount: number;
  createdAt: Date;
  ackedAt?: Date;
}

/** Role-based view mode */
export type ViewMode = "field-ops" | "dispatch" | "dashboard";

/** Backend WebSocket message types */
export type WsMessage =
  | { type: "alert"; alert: EmergencyAlert }
  | { type: "message"; message: AppMessage }
  | { type: "node_update"; node: MeshNode }
  | { type: "connected"; clientId: string };
