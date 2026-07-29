import { describe, expect, it } from "vitest";
import { deriveRoleFromEmail, SJCET_EMAIL_PATTERN } from "@/constants/auth";

describe("deriveRoleFromEmail", () => {
  it("classifies student emails (trailing 4-digit grad year)", () => {
    expect(deriveRoleFromEmail("abinantony2028@es.sjcetpalai.ac.in")).toBe("student");
    expect(deriveRoleFromEmail("johndoe2027@cs.sjcetpalai.ac.in")).toBe("student");
  });

  it("classifies staff emails (no trailing digits) as admin", () => {
    expect(deriveRoleFromEmail("johndoe@cs.sjcetpalai.ac.in")).toBe("admin");
    expect(deriveRoleFromEmail("principal@ad.sjcetpalai.ac.in")).toBe("admin");
  });

  it("is case-insensitive", () => {
    expect(deriveRoleFromEmail("AbinAntony2028@ES.sjcetpalai.ac.in")).toBe("student");
  });

  it("rejects unknown department codes", () => {
    expect(deriveRoleFromEmail("name2028@xx.sjcetpalai.ac.in")).toBe(null);
  });

  it("rejects non-SJCET domains", () => {
    expect(deriveRoleFromEmail("name2028@cs.gmail.com")).toBe(null);
  });

  it("rejects malformed local parts", () => {
    expect(deriveRoleFromEmail("2028name@cs.sjcetpalai.ac.in")).toBe(null);
    expect(deriveRoleFromEmail("name20289@cs.sjcetpalai.ac.in")).toBe(null);
  });
});

describe("SJCET_EMAIL_PATTERN", () => {
  it("accepts every fixed department code", () => {
    for (const dept of ["ad", "cs", "ec", "es", "cy", "ce", "me", "eee", "it"]) {
      expect(SJCET_EMAIL_PATTERN.test(`name2028@${dept}.sjcetpalai.ac.in`)).toBe(true);
    }
  });
});
