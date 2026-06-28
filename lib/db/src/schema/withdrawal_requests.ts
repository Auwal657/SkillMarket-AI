import { pgTable, serial, integer, timestamp, text, pgEnum, numeric } from "drizzle-orm/pg-core";

export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending", "approved", "rejected", "completed",
]);

export const withdrawalRequestsTable = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  status: withdrawalStatusEnum("status").notNull().default("pending"),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name").notNull(),
  note: text("note"),
  adminNote: text("admin_note"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type WithdrawalRequest = typeof withdrawalRequestsTable.$inferSelect;
