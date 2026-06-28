import { Router } from "express";
import { eq, sql, desc } from "drizzle-orm";
import {
  db, usersTable, projectsTable, applicationsTable,
  freelancerProfilesTable, reviewsTable,
  escrowTransactionsTable, walletTransactionsTable, withdrawalRequestsTable, walletsTable,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";
import type { Request, Response, NextFunction } from "express";

const router = Router();

// Admin guard middleware
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
  (async () => {
    const [user] = await db
      .select({ isAdmin: usersTable.isAdmin })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.userId));
    if (!user?.isAdmin) { res.status(403).json({ error: "Admin access required" }); return; }
    next();
  })().catch(next);
}

// GET /api/admin/stats — overview numbers
router.get("/stats", requireAuth, requireAdmin, async (_req, res) => {
  const [[users], [projects], [applications], [reviews]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(usersTable),
    db.select({ count: sql<number>`count(*)` }).from(projectsTable),
    db.select({ count: sql<number>`count(*)` }).from(applicationsTable),
    db.select({ count: sql<number>`count(*)` }).from(reviewsTable),
  ]);

  const [projectsByStatus] = await Promise.all([
    db.select({ status: projectsTable.status, count: sql<number>`count(*)` })
      .from(projectsTable)
      .groupBy(projectsTable.status),
  ]);

  const [usersByRole] = await Promise.all([
    db.select({ role: usersTable.role, count: sql<number>`count(*)` })
      .from(usersTable)
      .groupBy(usersTable.role),
  ]);

  res.json({
    totalUsers: Number(users?.count ?? 0),
    totalProjects: Number(projects?.count ?? 0),
    totalApplications: Number(applications?.count ?? 0),
    totalReviews: Number(reviews?.count ?? 0),
    projectsByStatus,
    usersByRole,
  });
});

// GET /api/admin/users — list all users
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
  const offset = parseInt(req.query.offset as string || "0", 10);

  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      university: usersTable.university,
      isAdmin: usersTable.isAdmin,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(users);
});

// PATCH /api/admin/users/:id — update user (toggle admin, etc.)
router.patch("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { isAdmin } = req.body as { isAdmin?: boolean };
  if (isAdmin === undefined) { res.status(400).json({ error: "Nothing to update" }); return; }

  const [updated] = await db
    .update(usersTable)
    .set({ isAdmin })
    .where(eq(usersTable.id, id))
    .returning({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, isAdmin: usersTable.isAdmin });

  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(updated);
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  if (id === req.user!.userId) { res.status(400).json({ error: "Cannot delete yourself" }); return; }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ message: "User deleted" });
});

// GET /api/admin/projects — list all projects
router.get("/projects", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
  const offset = parseInt(req.query.offset as string || "0", 10);

  const projects = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      status: projectsTable.status,
      category: projectsTable.category,
      clientId: projectsTable.clientId,
      budgetMin: projectsTable.budgetMin,
      budgetMax: projectsTable.budgetMax,
      createdAt: projectsTable.createdAt,
    })
    .from(projectsTable)
    .orderBy(desc(projectsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(projects);
});

// DELETE /api/admin/projects/:id
router.delete("/projects/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  res.json({ message: "Project deleted" });
});

// GET /api/admin/reports — aggregate report data
router.get("/reports", requireAuth, requireAdmin, async (_req, res) => {
  const [recentProjects, recentUsers, topFreelancers] = await Promise.all([
    db.select({
      id: projectsTable.id,
      title: projectsTable.title,
      status: projectsTable.status,
      category: projectsTable.category,
      createdAt: projectsTable.createdAt,
    })
      .from(projectsTable)
      .orderBy(desc(projectsTable.createdAt))
      .limit(10),

    db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(10),

    db.select({
      id: freelancerProfilesTable.id,
      userId: freelancerProfilesTable.userId,
      averageRating: freelancerProfilesTable.averageRating,
      totalReviews: freelancerProfilesTable.totalReviews,
      completedProjects: freelancerProfilesTable.completedProjects,
      totalEarnings: freelancerProfilesTable.totalEarnings,
    })
      .from(freelancerProfilesTable)
      .orderBy(desc(freelancerProfilesTable.completedProjects))
      .limit(10),
  ]);

  res.json({ recentProjects, recentUsers, topFreelancers });
});

// GET /api/admin/me — check if current user is admin
router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select({ isAdmin: usersTable.isAdmin })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId));
  res.json({ isAdmin: user?.isAdmin ?? false });
});

// GET /api/admin/payments/escrow — all escrow transactions
router.get("/payments/escrow", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
  const offset = parseInt(req.query.offset as string || "0", 10);

  const escrows = await db.select().from(escrowTransactionsTable)
    .orderBy(desc(escrowTransactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const projectIds = [...new Set(escrows.map(e => e.projectId))];
  const clientIds = [...new Set(escrows.map(e => e.clientId))];
  const freelancerIds = [...new Set(escrows.map(e => e.freelancerId))];
  const allUserIds = [...new Set([...clientIds, ...freelancerIds])];

  const [projects, users] = await Promise.all([
    projectIds.length > 0
      ? db.select({ id: projectsTable.id, title: projectsTable.title }).from(projectsTable)
      : Promise.resolve([]),
    allUserIds.length > 0
      ? db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email }).from(usersTable)
      : Promise.resolve([]),
  ]);

  const projMap = new Map((projects as { id: number; title: string }[]).map(p => [p.id, p.title]));
  const userMap = new Map((users as { id: number; name: string; email: string }[]).map(u => [u.id, u]));

  const enriched = escrows.map(e => ({
    ...e,
    projectTitle: projMap.get(e.projectId) ?? null,
    clientName: userMap.get(e.clientId)?.name ?? null,
    freelancerName: userMap.get(e.freelancerId)?.name ?? null,
  }));

  res.json(enriched);
});

// GET /api/admin/payments/transactions — all wallet transactions
router.get("/payments/transactions", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
  const offset = parseInt(req.query.offset as string || "0", 10);

  const txns = await db.select().from(walletTransactionsTable)
    .orderBy(desc(walletTransactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(txns);
});

// GET /api/admin/payments/withdrawals — all withdrawal requests
router.get("/payments/withdrawals", requireAuth, requireAdmin, async (req, res) => {
  const requests = await db.select().from(withdrawalRequestsTable)
    .orderBy(desc(withdrawalRequestsTable.createdAt))
    .limit(200);

  const userIds = [...new Set(requests.map(r => r.userId))];
  const users = userIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email }).from(usersTable)
    : [];
  const userMap = new Map((users as { id: number; name: string; email: string }[]).map(u => [u.id, u]));

  const enriched = requests.map(r => ({
    ...r,
    userName: userMap.get(r.userId)?.name ?? null,
    userEmail: userMap.get(r.userId)?.email ?? null,
  }));

  res.json(enriched);
});

// PATCH /api/admin/payments/withdrawals/:id — approve, reject or complete a withdrawal
router.patch("/payments/withdrawals/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { status, adminNote } = req.body as { status?: string; adminNote?: string };
  if (!status || !["approved", "rejected", "completed"].includes(status)) {
    res.status(400).json({ error: "status must be approved, rejected or completed" }); return;
  }

  const [wr] = await db.select().from(withdrawalRequestsTable).where(eq(withdrawalRequestsTable.id, id));
  if (!wr) { res.status(404).json({ error: "Withdrawal request not found" }); return; }
  if (wr.status === "completed" || wr.status === "rejected") {
    res.status(400).json({ error: "Cannot update a completed or rejected request" }); return;
  }

  // If rejecting, refund the held amount back to wallet
  if (status === "rejected") {
    const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.id, wr.walletId));
    if (wallet) {
      const currentBalance = parseFloat(wallet.balance);
      const refundedBalance = currentBalance + parseFloat(String(wr.amount));
      await Promise.all([
        db.update(walletsTable).set({ balance: String(refundedBalance) }).where(eq(walletsTable.id, wallet.id)),
        db.insert(walletTransactionsTable).values({
          walletId: wallet.id,
          userId: wr.userId,
          type: "credit",
          category: "refund",
          amount: String(wr.amount),
          balanceBefore: String(currentBalance),
          balanceAfter: String(refundedBalance),
          reference: `WDR-REJ-${wr.id}`,
          description: "Withdrawal request rejected — funds returned",
        }),
      ]);
    }
  }

  const [updated] = await db.update(withdrawalRequestsTable)
    .set({
      status: status as "approved" | "rejected" | "completed",
      adminNote: adminNote ?? null,
      processedAt: new Date(),
    })
    .where(eq(withdrawalRequestsTable.id, id))
    .returning();

  res.json(updated);
});

export default router;
