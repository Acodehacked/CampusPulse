import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Thrown by services/repositories to produce a stable {error:{code,message,details}} response. */
export class AppError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: ContentfulStatusCode, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static unauthorized(message = "Authentication required") {
    return new AppError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "You do not have permission to perform this action") {
    return new AppError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource not found") {
    return new AppError(404, "NOT_FOUND", message);
  }

  static conflict(message: string, details?: unknown) {
    return new AppError(409, "CONFLICT", message, details);
  }

  static validation(message: string, details?: unknown) {
    return new AppError(422, "VALIDATION_ERROR", message, details);
  }
}
