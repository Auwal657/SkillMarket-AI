import { pgTable, text, serial, timestamp, integer, real, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const availabilityEnum = pgEnum("availability_status", ["available", "busy", "unavailable"]);

export const freelancerProfilesTable = pgTable("freelancer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  headline: text("headline").notNull(),
  bio: text("bio").notNull(),
  hourlyRate: real("hourly_rate").notNull(),
  availabilityStatus: availabilityEnum("availability_status").notNull().default("available"),
  totalEarnings: real("total_earnings").notNull().default(0),
  completedProjects: integer("completed_projects").notNull().default(0),
  averageRating: real("average_rating"),
  totalReviews: integer("total_reviews").notNull().default(0),
  profileViews: integer("profile_views").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFreelancerProfileSchema = createInsertSchema(freelancerProfilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalEarnings: true,
  completedProjects: true,
  averageRating: true,
  totalReviews: true,
  profileViews: true,
});
export type InsertFreelancerProfile = z.infer<typeof insertFreelancerProfileSchema>;
export type FreelancerProfile = typeof freelancerProfilesTable.$inferSelect;
