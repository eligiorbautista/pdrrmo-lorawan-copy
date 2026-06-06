import { Hono } from "hono";
import {
  getAlerts,
  getAlertById,
  updateAlertStatus,
} from "@/db/queries";

export const alertsRoute = new Hono()
  .get("/", (c) => {
    const limit = Number(c.req.query("limit") ?? "50");
    const offset = Number(c.req.query("offset") ?? "0");
    const alerts = getAlerts(limit, offset);
    return c.json(alerts);
  })
  .get("/:id", (c) => {
    const id = c.req.param("id");
    const alert = getAlertById(id);
    if (!alert) return c.json({ error: "Not found" }, 404);
    return c.json(alert);
  })
  .patch("/:id/status", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<{ status: string }>();
    const validStatuses = ["received", "acknowledged", "resolved"];
    if (!validStatuses.includes(body.status)) {
      return c.json({ error: "Invalid status" }, 400);
    }
    updateAlertStatus(id, body.status);
    const updated = getAlertById(id);
    return c.json(updated);
  });
