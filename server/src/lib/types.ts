export interface AlertRecord {
  id: string;
  node_id: string;
  node_name: string;
  severity: "EMERGENCY" | "URGENT" | "INFO";
  message: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  status: "received" | "acknowledged" | "resolved";
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
}

export interface MessageRecord {
  id: string;
  text: string;
  from_node: number;
  to_node: number;
  channel: number;
  direction: "sent" | "received";
  emergency: boolean;
  created_at: string;
}

export interface NodeRecord {
  node_num: number;
  short_name: string;
  long_name: string;
  role: string;
  last_heard: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  battery_level: number | null;
}

export interface WsMessage {
  type: "alert" | "message" | "node_update" | "connected";
  payload: unknown;
}
