import type { AppMessage, EmergencyAlert } from "@/lib/types";

const DB_NAME = "pdrrmo-mesh";
const DB_VERSION = 1;
const STORE_MESSAGES = "messages";
const STORE_ALERTS = "alerts";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
        const store = db.createObjectStore(STORE_MESSAGES, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("from", "from", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_ALERTS)) {
        const store = db.createObjectStore(STORE_ALERTS, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

export async function persistMessages(messages: AppMessage[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_MESSAGES, "readwrite");
  const store = tx.objectStore(STORE_MESSAGES);
  for (const msg of messages) {
    store.put(msg);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Persist failed"));
  });
}

export async function loadMessages(): Promise<AppMessage[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_MESSAGES, "readonly");
  const store = tx.objectStore(STORE_MESSAGES);
  const index = store.index("timestamp");

  return new Promise((resolve, reject) => {
    const req = index.openCursor(null, "prev");
    const results: AppMessage[] = [];
    let count = 0;
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor && count < 500) {
        results.push(cursor.value);
        count++;
        cursor.continue();
      } else {
        resolve(results.reverse());
      }
    };
    req.onerror = () => reject(req.error ?? new Error("Load failed"));
  });
}

export async function persistAlerts(alerts: EmergencyAlert[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_ALERTS, "readwrite");
  const store = tx.objectStore(STORE_ALERTS);
  for (const alert of alerts) {
    store.put(alert);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Persist alerts failed"));
  });
}

export async function loadAlerts(): Promise<EmergencyAlert[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_ALERTS, "readonly");
  const store = tx.objectStore(STORE_ALERTS);
  const index = store.index("createdAt");

  return new Promise((resolve, reject) => {
    const req = index.openCursor(null, "prev");
    const results: EmergencyAlert[] = [];
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error ?? new Error("Load alerts failed"));
  });
}
