import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { errorHandler } from "@/server/middleware/error-handler";
import { attachSupabase, type AuthVariables } from "@/server/middleware/auth";
import { healthRoute } from "@/server/routes/health";
import { issuesRoute, meIssuesRoute } from "@/server/routes/issues";
import { adminRoute } from "@/server/routes/admin";

const allowedOrigin = process.env.ALLOWED_ORIGIN;

export const app = new Hono<{ Variables: AuthVariables }>().basePath("/api");

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
app.use("*", attachSupabase);

app.onError(errorHandler);

app.route("/health", healthRoute);
app.route("/issues", issuesRoute);
app.route("/me/issues", meIssuesRoute);
app.route("/admin", adminRoute);

export type AppType = typeof app;
