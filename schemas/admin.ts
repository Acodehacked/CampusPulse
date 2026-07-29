import { z } from "zod";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "@/constants/issues";

export const adminStatusUpdateSchema = z.object({
  status: z.enum(ISSUE_STATUSES),
  message: z.string().trim().max(2000).optional(),
});
export type AdminStatusUpdateInput = z.infer<typeof adminStatusUpdateSchema>;

export const adminPriorityUpdateSchema = z.object({
  priority: z.enum(ISSUE_PRIORITIES),
});
export type AdminPriorityUpdateInput = z.infer<typeof adminPriorityUpdateSchema>;

export const adminNoteSchema = z.object({
  message: z.string().trim().min(1, "Note cannot be empty").max(2000),
});
export type AdminNoteInput = z.infer<typeof adminNoteSchema>;
