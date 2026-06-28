import { pgTable, serial, integer, timestamp, text, pgEnum, numeric } from "drizzle-orm/pg-core";

export const walletTxTypeEnum = pgEnum("wallet_tx_type", ["credit", "debit"]);
export const walletTxCategoryEnum = pgEnum("wallet_tx_category", [
  "escrow_fund", "escrow_release", "refund", "withdrawal", "fee", "deposit",
]);

export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),
  userId: integer("user_id").notNull(),
  type: walletTxTypeEnum("type").notNull(),
  category: walletTxCategoryEnum("category").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  balanceBefore: numeric("balance_before", { precision: 14, scale: 2 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 14, scale: 2 }).notNull(),
  reference: text("reference").notNull(),
  description: text("description").notNull(),
  escrowTransactionId: integer("escrow_transaction_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
