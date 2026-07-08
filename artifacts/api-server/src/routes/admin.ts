import { Router } from "express";
import { eq, sql, desc, inArray } from "drizzle-orm";
import {
  db, usersTable, projectsTable, applicationsTable,
  freelancerProfilesTable, reviewsTable,
  escrowTransactionsTable, walletTransactionsTable, withdrawalRequestsTable, walletsTable,
  reportsTable,
} from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth";

const router = Router();

router.get("/stats", requireAuth, requireAdmin, async (_req, res) => {
  const [[users], [projects], [applications], [reviews]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(usersTable),
    db.select({ count: sql<number>`count(*)` }).from(projectsTable),
    db.select({ count: sql<number>`count(*)` }).from(applicationsTable),
    db.select({ count: sql<number>`count(*)` }).from(reviewsTable),
  ]);

  const projectsByStatus = await db.select({ status: projectsTable.status, count: sql<number>`count(*)` })
    .from(projectsTable)
    .groupBy(projectsTable.status);

  const usersByRole = await db.select({ role: usersTable.role, count: sql<number>`count(*)` })
    .from(usersTable)
    .groupBy(usersTable.role);

  res.json({
    totalUsers: Number(users?.count ?? 0),
    totalProjects: Number(projects?.count ?? 0),
    totalApplications: Number(applications?.count ?? 0),
    totalReviews: Number(reviews?.count ?? 0),
    projectsByStatus,
    usersByRole,
  });
});

router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
  const offset = parseInt(req.query.offset as string || "0", 10);
  const search = (req.query.search as string || "").toLowerCase();

  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      university: usersTable.university,
      isAdmin: usersTable.isAdmin,
      isSuspended: usersTable.isSuspended,
      isBanned: usersTable.isBanned,
      emailVerified: usersTable.emailVerified,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const filtered = search
    ? users.filter(u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search))
    : users;

  res.json(filtered);
});

router.patch("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { isAdmin, isSuspended, isBanned, emailVerified } = req.body as {
    isAdmin?: boolean;
    isSuspended?: boolean;
    isBanned?: boolean;
    emailVerified?: boolean;
  };

  const updates: Record<string, unknown> = {};
  if (isAdmin !== undefined) updates.isAdmin = isAdmin;
  if (isSuspended !== undefined) updates.isSuspended = isSuspended;
  if (isBanned !== undefined) updates.isBanned = isBanned;
  if (emailVerified !== undefined) updates.emailVerified = emailVerified;

  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      isAdmin: usersTable.isAdmin,
      isSuspended: usersTable.isSuspended,
      isBanned: usersTable.isBanned,
      emailVerified: usersTable.emailVerified,
    });

  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(updated);
});

router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  if (id === req.user!.userId) { res.status(400).json({ error: "Cannot delete yourself" }); return; }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ message: "User deleted" });
});

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

router.delete("/projects/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  res.json({ message: "Project deleted" });
});

router.get("/freelancers", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
  const offset = parseInt(req.query.offset as string || "0", 10);

  const profiles = await db
    .select({
      id: freelancerProfilesTable.id,
      userId: freelancerProfilesTable.userId,
      headline: freelancerProfilesTable.headline,
      hourlyRate: freelancerProfilesTable.hourlyRate,
      averageRating: freelancerProfilesTable.averageRating,
      completedProjects: freelancerProfilesTable.completedProjects,
      totalEarnings: freelancerProfilesTable.totalEarnings,
      isVerified: freelancerProfilesTable.isVerified,
      createdAt: freelancerProfilesTable.createdAt,
    })
    .from(freelancerProfilesTable)
    .orderBy(desc(freelancerProfilesTable.createdAt))
    .limit(limit)
    .offset(offset);

  if (profiles.length === 0) { res.json([]); return; }

  const userIds = profiles.map(p => p.userId);
  const users = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(inArray(usersTable.id, userIds));

  const userMap = new Map(users.map(u => [u.id, u]));

  res.json(profiles.map(p => ({
    ...p,
    user: userMap.get(p.userId) ?? null,
  })));
});

router.patch("/freelancers/:id/verify", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { isVerified } = req.body as { isVerified: boolean };
  if (typeof isVerified !== "boolean") { res.status(400).json({ error: "isVerified must be boolean" }); return; }

  const [updated] = await db
    .update(freelancerProfilesTable)
    .set({ isVerified })
    .where(eq(freelancerProfilesTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Freelancer profile not found" }); return; }
  res.json(updated);
});

router.get("/reports", requireAuth, requireAdmin, async (req, res) => {
  const status = req.query.status as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
  const offset = parseInt(req.query.offset as string || "0", 10);

  let query = db
    .select({
      report: reportsTable,
      reporterName: usersTable.name,
    })
    .from(reportsTable)
    .innerJoin(usersTable, eq(reportsTable.reporterId, usersTable.id))
    .$dynamic();

  if (status && ["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
    query = query.where(eq(reportsTable.status, status as "pending" | "reviewed" | "resolved" | "dismissed"));
  }

  const reports = await query
    .orderBy(desc(reportsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(reports.map(({ report, reporterName }) => ({ ...report, reporterName })));
});

router.patch("/reports/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { status, adminNote } = req.body as { status?: string; adminNote?: string };
  const updates: Record<string, unknown> = {};
  if (status && ["reviewed", "resolved", "dismissed"].includes(status)) {
    updates.status = status;
    if (status === "resolved" || status === "dismissed") updates.resolvedAt = new Date();
  }
  if (adminNote !== undefined) updates.adminNote = adminNote;

  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }

  const [updated] = await db
    .update(reportsTable)
    .set(updates)
    .where(eq(reportsTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Report not found" }); return; }
  res.json(updated);
});

router.get("/reports/summary", requireAuth, requireAdmin, async (_req, res) => {
  const counts = await db
    .select({ status: reportsTable.status, count: sql<number>`count(*)` })
    .from(reportsTable)
    .groupBy(reportsTable.status);
  res.json(counts);
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select({ isAdmin: usersTable.isAdmin })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId));
  res.json({ isAdmin: user?.isAdmin ?? false });
});

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

router.get("/payments/transactions", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
  const offset = parseInt(req.query.offset as string || "0", 10);

  const txns = await db.select().from(walletTransactionsTable)
    .orderBy(desc(walletTransactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(txns);
});

router.get("/payments/withdrawals", requireAuth, requireAdmin, async (_req, res) => {
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

router.patch("/payments/withdrawals/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
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
