import { db } from "./schema";
import type { AlertRecord, MessageRecord, NodeRecord } from "@/lib/types";

// ─── Alerts ─────────────────────────────────────────────

export function insertAlert(alert: AlertRecord): void {
  db.run(
    `INSERT OR REPLACE INTO alerts (id, node_id, node_name, severity, message, gps_lat, gps_lng, status, created_at, acknowledged_at, resolved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [alert.id, alert.node_id, alert.node_name, alert.severity, alert.message,
     alert.gps_lat, alert.gps_lng, alert.status, alert.created_at,
     alert.acknowledged_at, alert.resolved_at],
  );
}

export function getAlerts(limit = 50, offset = 0): AlertRecord[] {
  return db
    .query("SELECT * FROM alerts ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as AlertRecord[];
}

export function getAlertById(id: string): AlertRecord | null {
  return db
    .query("SELECT * FROM alerts WHERE id = ?")
    .get(id) as AlertRecord | null;
}

export function updateAlertStatus(
  id: string,
  status: string,
): void {
  const now = new Date().toISOString();
  if (status === "acknowledged") {
    db.run("UPDATE alerts SET status = ?, acknowledged_at = ? WHERE id = ?", [
      status, now, id,
    ]);
  } else if (status === "resolved") {
    db.run("UPDATE alerts SET status = ?, resolved_at = ? WHERE id = ?", [
      status, now, id,
    ]);
  } else {
    db.run("UPDATE alerts SET status = ? WHERE id = ?", [status, id]);
  }
}

// ─── Messages ───────────────────────────────────────────

export function insertMessage(msg: MessageRecord): void {
  db.run(
    `INSERT OR REPLACE INTO messages (id, text, from_node, to_node, channel, direction, emergency, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [msg.id, msg.text, msg.from_node, msg.to_node, msg.channel,
     msg.direction, msg.emergency ? 1 : 0, msg.created_at],
  );
}

export function getMessages(limit = 100, offset = 0): MessageRecord[] {
  return db
    .query("SELECT * FROM messages ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as MessageRecord[];
}

// ─── Nodes ──────────────────────────────────────────────

export function upsertNode(node: NodeRecord): void {
  db.run(
    `INSERT INTO nodes (node_num, short_name, long_name, role, last_heard, gps_lat, gps_lng, battery_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (node_num) DO UPDATE SET
       short_name = excluded.short_name,
       long_name = excluded.long_name,
       role = excluded.role,
       last_heard = excluded.last_heard,
       gps_lat = excluded.gps_lat,
       gps_lng = excluded.gps_lng,
       battery_level = excluded.battery_level`,
    [node.node_num, node.short_name, node.long_name, node.role,
     node.last_heard, node.gps_lat, node.gps_lng, node.battery_level],
  );
}

export function getNodes(): NodeRecord[] {
  return db
    .query("SELECT * FROM nodes ORDER BY last_heard DESC")
    .all() as NodeRecord[];
}

export function getNode(num: number): NodeRecord | null {
  return db
    .query("SELECT * FROM nodes WHERE node_num = ?")
    .get(num) as NodeRecord | null;
}
