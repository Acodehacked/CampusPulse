import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { errorHandler } from "@/server/middleware/error-handler";
import { healthRoute } from "@/server/routes/health";

const allowedOrigin = process.env.ALLOWED_ORIGIN;

export const app = new Hono().basePath("/api");

app.use(
  "*",
  cors({
    // Same-origin requests (the browser calling its own Next.js app) don't send an Origin
    // header that needs allow-listing; this only matters if another origin is ever configured.
    origin: allowedOrigin ? [allowedOrigin] : [],
    credentials: true,
  }),
);
app.use("*", secureHeaders());

app.onError(errorHandler);

app.route("/health", healthRoute);

export type AppType = typeof app;
