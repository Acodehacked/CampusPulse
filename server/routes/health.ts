import { Hono } from "hono";
import { ok } from "@/server/lib/response";

export const healthRoute = new Hono().get("/", (c) => {
  return c.json(ok({ status: "ok", timestamp: new Date().toISOString() }));
});
