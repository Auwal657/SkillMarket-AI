import { pgTable, text, serial, integer, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const projectStatusEnum = pgEnum("project_status", ["open", "in_progress", "completed", "cancelled"]);

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  budgetMin: real("budget_min").notNull(),
  budgetMax: real("budget_max").notNull(),
  timelineWeeks: integer("timeline_weeks"),
  status: projectStatusEnum("status").notNull().default("open"),
  clientId: integer("client_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  requiredSkills: text("required_skills").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  clientId: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
