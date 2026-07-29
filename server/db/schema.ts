import { pgTable, pgEnum, uuid, text, integer, timestamp, jsonb, unique, customType } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Type-only mirror of supabase/migrations/*.sql — the SQL files are the
 * single source of schema truth (tables, RLS, triggers, indexes all live
 * there). This file exists so repositories/services get typed query
 * building; drizzle-kit is never used to push or generate schema changes
 * from here.
 */

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const userRoleEnum = pgEnum("user_role", ["student", "admin"]);
export const issueCategoryEnum = pgEnum("issue_category", [
  "network",
  "hardware",
  "software",
  "infrastructure",
  "other",
]);
export const issuePriorityEnum = pgEnum("issue_priority", ["low", "medium", "high", "critical"]);
export const issueStatusEnum = pgEnum("issue_status", [
  "reported",
  "verified",
  "in_progress",
  "resolved",
  "rejected",
]);
export const issueUpdateEventTypeEnum = pgEnum("issue_update_event_type", [
  "issue_created",
  "status_changed",
  "priority_changed",
  "admin_note_added",
  "issue_resolved",
  "issue_reopened",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  department: text("department"),
  graduationYear: integer("graduation_year"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const issues = pgTable("issues", {
  id: uuid("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: issueCategoryEnum("category").notNull(),
  location: text("location").notNull(),
  priority: issuePriorityEnum("priority").notNull().default("medium"),
  status: issueStatusEnum("status").notNull().default("reported"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  searchVector: tsvector("search_vector"),
});

export const issueConfirmations = pgTable(
  "issue_confirmations",
  {
    id: uuid("id").primaryKey(),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.issueId, table.userId)],
);

export const issueUpdates = pgTable("issue_updates", {
  id: uuid("id").primaryKey(),
  issueId: uuid("issue_id")
    .notNull()
    .references(() => issues.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
  eventType: issueUpdateEventTypeEnum("event_type").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey(),
  issueId: uuid("issue_id")
    .notNull()
    .references(() => issues.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const issuesRelations = relations(issues, ({ one, many }) => ({
  reporter: one(profiles, { fields: [issues.createdBy], references: [profiles.id] }),
  confirmations: many(issueConfirmations),
  updates: many(issueUpdates),
  attachments: many(attachments),
}));

export const issueConfirmationsRelations = relations(issueConfirmations, ({ one }) => ({
  issue: one(issues, { fields: [issueConfirmations.issueId], references: [issues.id] }),
  user: one(profiles, { fields: [issueConfirmations.userId], references: [profiles.id] }),
}));

export const issueUpdatesRelations = relations(issueUpdates, ({ one }) => ({
  issue: one(issues, { fields: [issueUpdates.issueId], references: [issues.id] }),
  actor: one(profiles, { fields: [issueUpdates.actorId], references: [profiles.id] }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  issue: one(issues, { fields: [attachments.issueId], references: [issues.id] }),
  uploader: one(profiles, { fields: [attachments.uploadedBy], references: [profiles.id] }),
}));
