import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedItemsTable = pgTable("saved_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  itemType: text("item_type").notNull(), // 'project' | 'freelancer'
  itemId: integer("item_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("unique_saved_item").on(table.userId, table.itemType, table.itemId),
]);

export const insertSavedItemSchema = createInsertSchema(savedItemsTable).omit({
  id: true,
  createdAt: true,
  userId: true,
});
export type InsertSavedItem = z.infer<typeof insertSavedItemSchema>;
export type SavedItem = typeof savedItemsTable.$inferSelect;
