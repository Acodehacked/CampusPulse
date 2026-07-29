import { z } from "zod";
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES, ISSUE_STATUSES } from "@/constants/issues";

export const issueCreateSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(150, "Title is too long"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description is too long"),
  category: z.enum(ISSUE_CATEGORIES),
  location: z.string().trim().min(2, "Location is required").max(150, "Location is too long"),
});
export type IssueCreateInput = z.infer<typeof issueCreateSchema>;

export const issueIdParamSchema = z.object({
  id: z.string().uuid("Invalid issue id"),
});

export const issueFiltersSchema = z.object({
  status: z.enum(ISSUE_STATUSES).optional(),
  category: z.enum(ISSUE_CATEGORIES).optional(),
  priority: z.enum(ISSUE_PRIORITIES).optional(),
  location: z.string().trim().min(1).max(150).optional(),
  q: z.string().trim().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type IssueFiltersInput = z.infer<typeof issueFiltersSchema>;

export const issueCorrectionSchema = z
  .object({
    title: z.string().trim().min(5).max(150).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    category: z.enum(ISSUE_CATEGORIES).optional(),
    location: z.string().trim().min(2).max(150).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });
export type IssueCorrectionInput = z.infer<typeof issueCorrectionSchema>;

export const meIssuesQuerySchema = z.object({
  type: z.enum(["reported", "confirmed"]).default("reported"),
  status: z.enum(ISSUE_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type MeIssuesQueryInput = z.infer<typeof meIssuesQuerySchema>;
