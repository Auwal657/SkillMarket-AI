import { pgTable, serial, integer, text, real, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { freelancerProfilesTable } from "./freelancer_profiles";
import { projectsTable } from "./projects";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  freelancerProfileId: integer("freelancer_profile_id")
    .notNull()
    .references(() => freelancerProfilesTable.id, { onDelete: "cascade" }),
  reviewerId: integer("reviewer_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  projectId: integer("project_id")
    .references(() => projectsTable.id, { onDelete: "set null" }),
  rating: real("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("unique_review").on(table.freelancerProfileId, table.reviewerId, table.projectId),
]);

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({
  id: true,
  createdAt: true,
  reviewerId: true,
});
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
