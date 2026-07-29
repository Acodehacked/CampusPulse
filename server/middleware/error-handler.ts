import type { ErrorHandler } from "hono";
import { ZodError } from "zod";
import { AppError } from "@/server/lib/app-error";

/**
 * Centralized error handler for the Hono app. Never lets a raw Postgres or
 * unhandled exception message reach the browser — those are logged
 * server-side and replaced with a generic message.
 */
export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: { code: err.code, message: err.message, details: err.details } }, err.status);
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: err.flatten(),
        },
      },
      422,
    );
  }

  console.error("[api:unhandled]", err);
  return c.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } },
    500,
  );
};
