import { Buffer } from "buffer";

// Provide Node.js Buffer globally for @meshtastic/core (uses Buffer.isBuffer in protobuf serializer)
(window as unknown as Record<string, unknown>).Buffer = Buffer;

// Provide process globally for tslog in @meshtastic/core
(window as unknown as Record<string, unknown>).process = {
  env: {},
  version: "",
  platform: "browser",
  argv: [],
  cwd: () => "/",
};

// Provide global for tslog
(window as unknown as Record<string, unknown>).global = window;

// Suppress benign Web Bluetooth GATT errors from cluttering the console as uncaught rejections
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason?.message ?? String(event.reason);
  if (
    reason.includes("GATT") ||
    reason.includes("Bluetooth") ||
    reason.includes("stopNotifications") ||
    reason.includes("writeValue") ||
    reason.includes("Connection attempt failed")
  ) {
    event.preventDefault(); // Prevent browser default console logging/crashing
  }
});
