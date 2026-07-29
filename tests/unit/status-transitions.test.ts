import { describe, expect, it } from "vitest";
import { isValidIssueStatusTransition } from "@/constants/status-transitions";
import { ISSUE_STATUSES } from "@/constants/issues";

describe("isValidIssueStatusTransition", () => {
  it("allows the documented happy path", () => {
    expect(isValidIssueStatusTransition("reported", "verified")).toBe(true);
    expect(isValidIssueStatusTransition("verified", "in_progress")).toBe(true);
    expect(isValidIssueStatusTransition("in_progress", "resolved")).toBe(true);
  });

  it("allows rejecting from any active state", () => {
    expect(isValidIssueStatusTransition("reported", "rejected")).toBe(true);
    expect(isValidIssueStatusTransition("verified", "rejected")).toBe(true);
    expect(isValidIssueStatusTransition("in_progress", "rejected")).toBe(true);
  });

  it("allows reopening a resolved issue back to in_progress", () => {
    expect(isValidIssueStatusTransition("resolved", "in_progress")).toBe(true);
  });

  it("allows reopening a rejected issue back to reported", () => {
    expect(isValidIssueStatusTransition("rejected", "reported")).toBe(true);
  });

  it("treats a same-status transition as a no-op success", () => {
    for (const status of ISSUE_STATUSES) {
      expect(isValidIssueStatusTransition(status, status)).toBe(true);
    }
  });

  it("rejects skipping states", () => {
    expect(isValidIssueStatusTransition("reported", "in_progress")).toBe(false);
    expect(isValidIssueStatusTransition("reported", "resolved")).toBe(false);
    expect(isValidIssueStatusTransition("verified", "resolved")).toBe(false);
  });

  it("rejects resolving directly from rejected", () => {
    expect(isValidIssueStatusTransition("rejected", "resolved")).toBe(false);
  });

  it("rejects resolved going directly to rejected", () => {
    expect(isValidIssueStatusTransition("resolved", "rejected")).toBe(false);
  });
});
