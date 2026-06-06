import { Hono } from "hono";
import { getNodes, getNode } from "@/db/queries";

export const nodesRoute = new Hono()
  .get("/", (c) => {
    const nodes = getNodes();
    return c.json(nodes);
  })
  .get("/:num", (c) => {
    const num = Number(c.req.param("num"));
    if (isNaN(num)) return c.json({ error: "Invalid node number" }, 400);
    const node = getNode(num);
    if (!node) return c.json({ error: "Not found" }, 404);
    return c.json(node);
  });
