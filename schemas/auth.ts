import { z } from "zod";
import { SJCET_EMAIL_PATTERN } from "@/constants/auth";

const sjcetEmail = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .regex(
    SJCET_EMAIL_PATTERN,
    "Use your SJCET college email, e.g. name2028@cs.sjcetpalai.ac.in (students) or name@cs.sjcetpalai.ac.in (staff)",
  );

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const signUpSchema = z.object({
  email: sjcetEmail,
  password,
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: sjcetEmail,
  password: z.string().min(1, "Password is required"),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const resendVerificationSchema = z.object({
  email: sjcetEmail,
});
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
