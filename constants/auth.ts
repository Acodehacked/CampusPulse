/** Fixed SJCET Palai department codes used in the college email convention. */
export const SJCET_DEPARTMENT_CODES = ["ad", "cs", "ec", "es", "cy", "ce", "me", "eee", "it"] as const;
export type SjcetDepartmentCode = (typeof SJCET_DEPARTMENT_CODES)[number];

const deptAlternation = SJCET_DEPARTMENT_CODES.join("|");

/** {name}{4-digit grad year}@{dept}.sjcetpalai.ac.in — students. */
export const STUDENT_EMAIL_PATTERN = new RegExp(`^[a-z]+[0-9]{4}@(?:${deptAlternation})\\.sjcetpalai\\.ac\\.in$`);

/** {name}@{dept}.sjcetpalai.ac.in (no trailing year) — teachers/staff, auto-granted admin. */
export const STAFF_EMAIL_PATTERN = new RegExp(`^[a-z]+@(?:${deptAlternation})\\.sjcetpalai\\.ac\\.in$`);

/** Any valid SJCET address, student or staff shaped. */
export const SJCET_EMAIL_PATTERN = new RegExp(
  `^[a-z]+(?:[0-9]{4})?@(?:${deptAlternation})\\.sjcetpalai\\.ac\\.in$`,
);

export type DerivedRole = "student" | "admin";

/** Mirrors derive_role_from_email() in supabase/migrations/0001 — used for signup form UX only, never trusted as the actual role. */
export function deriveRoleFromEmail(email: string): DerivedRole | null {
  const normalized = email.toLowerCase();
  if (STUDENT_EMAIL_PATTERN.test(normalized)) return "student";
  if (STAFF_EMAIL_PATTERN.test(normalized)) return "admin";
  return null;
}
