import { describe, expect, it } from "vitest";
import { issueCreateSchema, issueFiltersSchema } from "@/schemas/issues";
import { signUpSchema } from "@/schemas/auth";
import { adminStatusUpdateSchema } from "@/schemas/admin";

describe("issueCreateSchema", () => {
  const valid = {
    title: "Wi-Fi down in Block C",
    description: "The Wi-Fi has been down since this morning across the whole floor.",
    category: "network",
    location: "Block C, 2nd floor",
  };

  it("accepts a valid payload", () => {
    expect(issueCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a title that's too short", () => {
    const result = issueCreateSchema.safeParse({ ...valid, title: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid category", () => {
    const result = issueCreateSchema.safeParse({ ...valid, category: "not-a-category" });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from string fields", () => {
    const result = issueCreateSchema.safeParse({ ...valid, title: `  ${valid.title}  ` });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe(valid.title);
  });
});

describe("issueFiltersSchema", () => {
  it("defaults pagination when omitted", () => {
    const result = issueFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it("caps pageSize at 50", () => {
    const result = issueFiltersSchema.safeParse({ pageSize: "500" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid status filter", () => {
    const result = issueFiltersSchema.safeParse({ status: "bogus" });
    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("accepts a valid student email", () => {
    const result = signUpSchema.safeParse({
      email: "name2028@cs.sjcetpalai.ac.in",
      password: "supersecret",
      displayName: "Jane Doe",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-SJCET email", () => {
    const result = signUpSchema.safeParse({
      email: "name2028@gmail.com",
      password: "supersecret",
      displayName: "Jane Doe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a short password", () => {
    const result = signUpSchema.safeParse({
      email: "name2028@cs.sjcetpalai.ac.in",
      password: "short",
      displayName: "Jane Doe",
    });
    expect(result.success).toBe(false);
  });
});

describe("adminStatusUpdateSchema", () => {
  it("accepts a known status", () => {
    expect(adminStatusUpdateSchema.safeParse({ status: "verified" }).success).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(adminStatusUpdateSchema.safeParse({ status: "archived" }).success).toBe(false);
  });
});
