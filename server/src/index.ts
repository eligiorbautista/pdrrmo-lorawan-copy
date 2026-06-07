import { Hono } from "hono";
import { cors } from "hono/cors";
import { alertsRoute } from "@/routes/alerts";
import { messagesRoute } from "@/routes/messages";
import { nodesRoute } from "@/routes/nodes";
import { handleOpen, handleClose } from "@/ws/handler";
import { initGateway } from "@/lib/gateway";
import type { GatewayConfig } from "@/lib/gateway";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Please copy server/.env.example to server/.env and fill in your values.`,
    );
  }
  return value;
}

const app = new Hono();

// CORS for PWA frontend
const corsOrigins = requireEnv("CORS_ORIGINS")
  .split(",")
  .map((s) => s.trim());

app.use(
  "*",
  cors({
    origin: corsOrigins,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health checks
app.get("/healthcheck", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

app.get("/api/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// REST API routes
app.route("/api/alerts", alertsRoute);
app.route("/api/messages", messagesRoute);
app.route("/api/nodes", nodesRoute);

// WebSocket upgrade endpoint
app.get("/api/ws", (c) => {
  const success = server.upgrade(c.req.raw);
  if (success) {
    return new Response(null);
  }
  return c.json({ error: "Expected WebSocket upgrade" }, 400);
});

const port = Number(requireEnv("PORT"));
const host = requireEnv("HOST");

const server = Bun.serve({
  port,
  hostname: host,
  fetch: app.fetch,

  websocket: {
    open: (ws) => {
      handleOpen(ws);
    },
    message(ws, msg) {
      // Echo or handle client messages
      ws.send(`Echo: ${msg}`);
    },
    close: (ws) => {
      handleClose(ws);
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
