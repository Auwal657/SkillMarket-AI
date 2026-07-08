import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { freelancerProfilesTable } from "./freelancer_profiles";

export const portfolioItemsTable = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  freelancerProfileId: integer("freelancer_profile_id").notNull().references(() => freelancerProfilesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),          // cover image URL
  projectUrl: text("project_url"),      // live demo URL
  githubUrl: text("github_url"),        // GitHub repo URL
  category: text("category"),           // project category
  tags: text("tags").array().notNull().default([]),         // technologies used
  screenshots: text("screenshots").array().notNull().default([]), // additional screenshots
  completionDate: text("completion_date"),  // ISO date string e.g. "2024-03"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPortfolioItemSchema = createInsertSchema(portfolioItemsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type PortfolioItem = typeof portfolioItemsTable.$inferSelect;
