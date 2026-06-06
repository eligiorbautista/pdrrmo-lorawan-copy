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
