import { Router } from "express";
import { eq, desc, and } from "drizzle-orm";
import {
  db, usersTable, projectsTable,
  walletsTable, walletTransactionsTable,
  withdrawalRequestsTable, invoicesTable, escrowTransactionsTable,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { z } from "zod";

const router = Router();

async function getOrCreateWallet(userId: number) {
  const [existing] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
  if (existing) return existing;
  const [wallet] = await db.insert(walletsTable).values({ userId }).returning();
  return wallet;
}

// GET /api/wallet — my wallet summary
router.get("/", requireAuth, async (req, res) => {
  const wallet = await getOrCreateWallet(req.user!.userId);
  const transactions = await db.select().from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.walletId, wallet.id))
    .orderBy(desc(walletTransactionsTable.createdAt))
    .limit(5);
  res.json({ wallet, recentTransactions: transactions });
});

// GET /api/wallet/transactions — full transaction history
router.get("/transactions", requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
  const offset = parseInt(req.query.offset as string || "0", 10);
  const wallet = await getOrCreateWallet(req.user!.userId);
  const transactions = await db.select().from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.walletId, wallet.id))
    .orderBy(desc(walletTransactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  // Enrich with project titles where possible
  const escrowIds = transactions.filter(t => t.escrowTransactionId).map(t => t.escrowTransactionId!);
  let projectTitleMap = new Map<number, string>();
  if (escrowIds.length > 0) {
    const escrows = await db.select({ id: escrowTransactionsTable.id, projectId: escrowTransactionsTable.projectId })
      .from(escrowTransactionsTable);
    const projectIds = escrows.map(e => e.projectId);
    if (projectIds.length > 0) {
      const projects = await db.select({ id: projectsTable.id, title: projectsTable.title })
        .from(projectsTable);
      const projMap = new Map(projects.map(p => [p.id, p.title]));
      const escrowMap = new Map(escrows.map(e => [e.id, e.projectId]));
      projectTitleMap = new Map(
        [...escrowMap.entries()].map(([escrowId, projId]) => [escrowId, projMap.get(projId) ?? ""])
      );
    }
  }

  const enriched = transactions.map(t => ({
    ...t,
    projectTitle: t.escrowTransactionId ? (projectTitleMap.get(t.escrowTransactionId) ?? null) : null,
  }));

  res.json({ wallet, transactions: enriched, total: transactions.length });
});

const WithdrawBody = z.object({
  amount: z.number().positive("Amount must be positive"),
  bankName: z.string().min(2, "Bank name required"),
  accountNumber: z.string().min(6, "Account number required").max(20),
  accountName: z.string().min(2, "Account name required"),
  note: z.string().max(500).optional(),
});

// POST /api/wallet/withdraw — freelancer requests withdrawal
router.post("/withdraw", requireAuth, async (req, res) => {
  const parsed = WithdrawBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

  const uid = req.user!.userId;
  const wallet = await getOrCreateWallet(uid);
  const balance = parseFloat(wallet.balance);
  const { amount, bankName, accountNumber, accountName, note } = parsed.data;

  if (amount > balance) {
    res.status(400).json({ error: `Insufficient balance. Available: ₦${balance.toLocaleString()}` }); return;
  }

  // Prevent multiple pending withdrawals
  const [pending] = await db.select({ id: withdrawalRequestsTable.id })
    .from(withdrawalRequestsTable)
    .where(and(eq(withdrawalRequestsTable.userId, uid), eq(withdrawalRequestsTable.status, "pending")));
  if (pending) {
    res.status(409).json({ error: "You already have a pending withdrawal request" }); return;
  }

  // Deduct from wallet immediately (hold)
  const newBalance = balance - amount;
  await db.update(walletsTable).set({ balance: String(newBalance) }).where(eq(walletsTable.id, wallet.id));

  const [request] = await db.insert(withdrawalRequestsTable).values({
    walletId: wallet.id,
    userId: uid,
    amount: String(amount),
    bankName,
    accountNumber,
    accountName,
    note: note ?? null,
  }).returning();

  await db.insert(walletTransactionsTable).values({
    walletId: wallet.id,
    userId: uid,
    type: "debit",
    category: "withdrawal",
    amount: String(amount),
    balanceBefore: String(balance),
    balanceAfter: String(newBalance),
    reference: `WDR-${request.id}`,
    description: `Withdrawal request to ${bankName} (${accountNumber})`,
  }).catch(() => {});

  res.status(201).json({ message: "Withdrawal request submitted", request });
});

// GET /api/wallet/withdrawals — my withdrawal requests
router.get("/withdrawals", requireAuth, async (req, res) => {
  const requests = await db.select().from(withdrawalRequestsTable)
    .where(eq(withdrawalRequestsTable.userId, req.user!.userId))
    .orderBy(desc(withdrawalRequestsTable.createdAt));
  res.json(requests);
});

// GET /api/wallet/invoices — my invoices
router.get("/invoices", requireAuth, async (req, res) => {
  const uid = req.user!.userId;
  const role = req.user!.role;
  const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);

  let invoices;
  if (role === "client") {
    invoices = await db.select().from(invoicesTable)
      .where(eq(invoicesTable.clientId, uid))
      .orderBy(desc(invoicesTable.createdAt))
      .limit(limit);
  } else {
    invoices = await db.select().from(invoicesTable)
      .where(eq(invoicesTable.freelancerId, uid))
      .orderBy(desc(invoicesTable.createdAt))
      .limit(limit);
  }

  // Enrich with project titles
  const projectIds = [...new Set(invoices.map(i => i.projectId))];
  const projects = projectIds.length > 0
    ? await db.select({ id: projectsTable.id, title: projectsTable.title })
        .from(projectsTable)
        .where(eq(projectsTable.id, projectIds[0])) // simplified — enrich all below
    : [];

  const allProjects = await db.select({ id: projectsTable.id, title: projectsTable.title }).from(projectsTable);
  const projMap = new Map(allProjects.map(p => [p.id, p.title]));

  const enriched = invoices.map(inv => ({
    ...inv,
    projectTitle: projMap.get(inv.projectId) ?? null,
  }));

  res.json(enriched);
});

// GET /api/wallet/invoices/:id — single invoice detail
router.get("/invoices/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

  const uid = req.user!.userId;
  const [user] = await db.select({ isAdmin: usersTable.isAdmin }).from(usersTable).where(eq(usersTable.id, uid));
  if (invoice.clientId !== uid && invoice.freelancerId !== uid && !user?.isAdmin) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const [[project], [client], [freelancer], [escrow]] = await Promise.all([
    db.select().from(projectsTable).where(eq(projectsTable.id, invoice.projectId)),
    db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, companyName: usersTable.companyName }).from(usersTable).where(eq(usersTable.id, invoice.clientId)),
    db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, invoice.freelancerId)),
    db.select().from(escrowTransactionsTable).where(eq(escrowTransactionsTable.id, invoice.escrowTransactionId)),
  ]);

  res.json({ invoice, project, client, freelancer, escrow });
});

export default router;
