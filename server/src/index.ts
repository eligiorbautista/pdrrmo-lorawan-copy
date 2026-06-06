import { Hono } from "hono";
import { cors } from "hono/cors";
import { alertsRoute } from "@/routes/alerts";
import { messagesRoute } from "@/routes/messages";
import { nodesRoute } from "@/routes/nodes";
import { handleConnection } from "@/ws/handler";
import { initGateway } from "@/lib/gateway";
import type { GatewayConfig } from "@/lib/gateway";

const app = new Hono();

// CORS for PWA frontend
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:4173", "*"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health check
app.get("/api/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// REST API routes
app.route("/api/alerts", alertsRoute);
app.route("/api/messages", messagesRoute);
app.route("/api/nodes", nodesRoute);

// WebSocket upgrade endpoint
app.get("/api/ws", (c) => {
  const url = new URL(c.req.url);
  // Hono on Bun uses the underlying req to upgrade
  if (c.req.raw.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return c.json({ error: "Expected WebSocket upgrade" }, 400);
  }
  return c.body(null); // Placeholder — Bun upgrade handled below
});

const port = Number(process.env.PORT ?? "3000");
const host = process.env.HOST ?? "0.0.0.0";

const server = Bun.serve({
  port,
  hostname: host,
  fetch: app.fetch,

  websocket: {
    open: (ws) => {
      handleConnection(ws);
    },
    message(ws, msg) {
      // Echo or handle client messages
      ws.send(`Echo: ${msg}`);
    },
  },
});

// Initialize gateway (placeholder mode for MVP)
const gatewayConfig: GatewayConfig = {
  type: "http",
  url: process.env.GATEWAY_URL,
};
initGateway(gatewayConfig);

console.log(`🚀 PDRRMO Command Center running at http://${host}:${port}`);
console.log(`   REST API: http://${host}:${port}/api/`);
console.log(`   WebSocket: ws://${host}:${port}/api/ws`);
