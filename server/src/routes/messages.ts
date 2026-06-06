import { Hono } from "hono";
import { getMessages } from "@/db/queries";

export const messagesRoute = new Hono().get("/", (c) => {
  const limit = Number(c.req.query("limit") ?? "100");
  const offset = Number(c.req.query("offset") ?? "0");
  const messages = getMessages(limit, offset);
  return c.json(messages);
});
