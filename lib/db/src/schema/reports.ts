import { pgTable, serial, integer, text, timestamp, boolean, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const reportTargetTypeEnum = pgEnum("report_target_type", ["user", "project", "message"]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "reviewed", "resolved", "dismissed"]);

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  targetType: reportTargetTypeEnum("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  status: reportStatusEnum("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("reports_reporter_idx").on(table.reporterId),
  index("reports_target_idx").on(table.targetType, table.targetId),
  index("reports_status_idx").on(table.status),
]);

export const insertReportSchema = createInsertSchema(reportsTable).omit({
  id: true,
  status: true,
  adminNote: true,
  resolvedAt: true,
  createdAt: true,
  reporterId: true,
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
