import { pgTable, text, serial, integer, timestamp, real, pgEnum, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";
import { usersTable } from "./users";

export const applicationStatusEnum = pgEnum("application_status", ["pending", "accepted", "rejected"]);

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  freelancerId: integer("freelancer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  coverLetter: text("cover_letter").notNull(),
  proposedRate: real("proposed_rate").notNull(),
  status: applicationStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  unique("unique_application").on(table.projectId, table.freelancerId),
  // P2: Indexes for common query patterns
  index("applications_freelancer_id_idx").on(table.freelancerId),
  index("applications_project_id_idx").on(table.projectId),
  index("applications_status_idx").on(table.status),
]);

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  freelancerId: true,
});
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
