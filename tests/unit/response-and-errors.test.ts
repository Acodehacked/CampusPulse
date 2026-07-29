import { describe, expect, it } from "vitest";
import { ok } from "@/server/lib/response";
import { AppError } from "@/server/lib/app-error";

describe("ok()", () => {
  it("wraps data with an empty meta object by default", () => {
    expect(ok({ id: "1" })).toEqual({ data: { id: "1" }, meta: {} });
  });

  it("includes provided meta", () => {
    expect(ok([1, 2], { total: 2 })).toEqual({ data: [1, 2], meta: { total: 2 } });
  });
});

describe("AppError", () => {
  it("unauthorized() defaults to 401", () => {
    const error = AppError.unauthorized();
    expect(error.status).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });

  it("forbidden() defaults to 403", () => {
    expect(AppError.forbidden().status).toBe(403);
  });

  it("notFound() defaults to 404", () => {
    expect(AppError.notFound().status).toBe(404);
  });

  it("conflict() carries a 409 status and message", () => {
    const error = AppError.conflict("duplicate");
    expect(error.status).toBe(409);
    expect(error.message).toBe("duplicate");
  });

  it("validation() carries a 422 status and details", () => {
    const error = AppError.validation("bad input", { field: "title" });
    expect(error.status).toBe(422);
    expect(error.details).toEqual({ field: "title" });
  });
});
