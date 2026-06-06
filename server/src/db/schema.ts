import { Database } from "bun:sqlite";

const DB_PATH = process.env.DB_PATH ?? "./pdrrmo.db";

export const db = new Database(DB_PATH);

// Enable WAL mode for concurrent reads
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");

export function initSchema(): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      node_id TEXT NOT NULL,
      node_name TEXT NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('EMERGENCY', 'URGENT', 'INFO')),
      message TEXT,
      gps_lat REAL,
      gps_lng REAL,
      status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'acknowledged', 'resolved')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      acknowledged_at TEXT,
      resolved_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      from_node INTEGER NOT NULL,
      to_node INTEGER NOT NULL DEFAULT 4294967295,
      channel INTEGER NOT NULL DEFAULT 0,
      direction TEXT NOT NULL CHECK (direction IN ('sent', 'received')),
      emergency INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS nodes (
      node_num INTEGER PRIMARY KEY,
      short_name TEXT NOT NULL DEFAULT '',
      long_name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'Unknown',
      last_heard TEXT,
      gps_lat REAL,
      gps_lng REAL,
      battery_level INTEGER
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC)
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC)
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_nodes_last_heard ON nodes(last_heard DESC)
  `);
}

// Initialize schema on import
initSchema();
