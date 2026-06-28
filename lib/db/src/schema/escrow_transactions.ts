import { pgTable, serial, integer, timestamp, text, pgEnum, numeric } from "drizzle-orm/pg-core";

export const escrowStatusEnum = pgEnum("escrow_status", [
  "pending", "funded", "in_escrow", "released", "refunded", "cancelled",
]);

export const escrowTransactionsTable = pgTable("escrow_transactions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().unique(),
  clientId: integer("client_id").notNull(),
  freelancerId: integer("freelancer_id").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  status: escrowStatusEnum("status").notNull().default("pending"),
  paystackReference: text("paystack_reference"),
  paystackAccessCode: text("paystack_access_code"),
  paystackAuthorizationUrl: text("paystack_authorization_url"),
  paystackTransactionId: text("paystack_transaction_id"),
  initiatedAt: timestamp("initiated_at", { withTimezone: true }).notNull().defaultNow(),
  fundedAt: timestamp("funded_at", { withTimezone: true }),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type EscrowTransaction = typeof escrowTransactionsTable.$inferSelect;
