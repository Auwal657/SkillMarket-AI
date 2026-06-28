import { pgTable, serial, integer, timestamp, text, pgEnum, numeric } from "drizzle-orm/pg-core";

export const invoiceTypeEnum = pgEnum("invoice_type", [
  "escrow_funded", "escrow_released", "refund",
]);

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  escrowTransactionId: integer("escrow_transaction_id").notNull(),
  projectId: integer("project_id").notNull(),
  clientId: integer("client_id").notNull(),
  freelancerId: integer("freelancer_id").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  type: invoiceTypeEnum("type").notNull(),
  paystackReference: text("paystack_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Invoice = typeof invoicesTable.$inferSelect;
