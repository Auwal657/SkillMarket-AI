import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { freelancerProfilesTable } from "./freelancer_profiles";

export const portfolioItemsTable = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  freelancerProfileId: integer("freelancer_profile_id").notNull().references(() => freelancerProfilesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  projectUrl: text("project_url"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPortfolioItemSchema = createInsertSchema(portfolioItemsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type PortfolioItem = typeof portfolioItemsTable.$inferSelect;
