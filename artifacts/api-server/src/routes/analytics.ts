import { Router } from "express";
import { eq, sql, and, inArray } from "drizzle-orm";
import {
  db, applicationsTable, projectsTable, freelancerProfilesTable,
  usersTable, walletTransactionsTable, escrowTransactionsTable, reviewsTable,
} from "@workspace/db";
import { requireAuth, requireRole, requireAdmin } from "../lib/auth";

const router = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate last N months as { month: 'MMM', key: 'YYYY-MM' }[] starting from oldest */
function lastNMonths(n: number) {
  const months: { label: string; key: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    months.push({ key, label });
  }
  return months;
}

function zeroFillMonths(months: { label: string; key: string }[], data: { month: string; value: number }[]) {
  const map = new Map(data.map(d => [d.month, d.value]));
  return months.map(m => ({ month: m.label, value: map.get(m.key) ?? 0 }));
}


// ─── Freelancer Analytics ────────────────────────────────────────────────────

router.get("/freelancer", requireAuth, requireRole("freelancer"), async (req, res) => {
  const userId = req.user!.userId;

  const [profile] = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, userId));
  if (!profile) { res.status(404).json({ error: "No freelancer profile" }); return; }

  const months = lastNMonths(6);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    allApps,
    monthlyEarningsRaw,
    activeProjectsRaw,
  ] = await Promise.all([
    db.select({ status: applicationsTable.status })
      .from(applicationsTable)
      .where(eq(applicationsTable.freelancerId, userId)),

    // Monthly earnings from wallet credits (escrow releases)
    db.select({
      month: sql<string>`TO_CHAR(${walletTransactionsTable.createdAt}, 'YYYY-MM')`,
      value: sql<number>`COALESCE(SUM(${walletTransactionsTable.amount}::numeric), 0)`,
    })
      .from(walletTransactionsTable)
      .where(and(
        eq(walletTransactionsTable.userId, userId),
        eq(walletTransactionsTable.type, "credit"),
        eq(walletTransactionsTable.category, "escrow_release"),
        sql`${walletTransactionsTable.createdAt} >= ${sixMonthsAgo.toISOString()}`,
      ))
      .groupBy(sql`TO_CHAR(${walletTransactionsTable.createdAt}, 'YYYY-MM')`),

    // Active (in_progress) projects where this freelancer was accepted
    db.select({ id: projectsTable.id })
      .from(projectsTable)
      .innerJoin(applicationsTable, and(
        eq(applicationsTable.projectId, projectsTable.id),
        eq(applicationsTable.freelancerId, userId),
        eq(applicationsTable.status, "accepted"),
      ))
      .where(eq(projectsTable.status, "in_progress")),
  ]);

  const totalApplications = allApps.length;
  const acceptedJobs = allApps.filter(a => a.status === "accepted").length;
  const pendingApplications = allApps.filter(a => a.status === "pending").length;
  const acceptanceRate = totalApplications > 0 ? Math.round((acceptedJobs / totalApplications) * 100) : 0;

  const monthlyEarnings = zeroFillMonths(months, monthlyEarningsRaw.map(r => ({
    month: r.month,
    value: Number(r.value),
  })));

  res.json({
    totalEarnings: profile.totalEarnings,
    completedProjects: profile.completedProjects,
    averageRating: profile.averageRating,
    totalReviews: profile.totalReviews,
    profileViews: profile.profileViews,
    hourlyRate: profile.hourlyRate,
    availabilityStatus: profile.availabilityStatus,
    totalApplications,
    acceptedJobs,
    pendingApplications,
    acceptanceRate,
    activeProjects: activeProjectsRaw.length,
    monthlyEarnings,
  });
});

// ─── Client Analytics ────────────────────────────────────────────────────────

router.get("/client", requireAuth, requireRole("client"), async (req, res) => {
  const userId = req.user!.userId;

  const months = lastNMonths(6);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const allProjects = await db.select().from(projectsTable).where(eq(projectsTable.clientId, userId));
  const projectIds = allProjects.map(p => p.id);

  if (projectIds.length === 0) {
    const empty = months.map(m => ({ month: m.label, value: 0 }));
    res.json({
      totalProjectsPosted: 0, activeProjects: 0, completedProjects: 0, cancelledProjects: 0,
      totalSpending: 0, freelancersHired: 0, projectSuccessRate: 0, avgFreelancerRating: null,
      monthlySpending: empty,
    });
    return;
  }

  const [allApps, spendingRaw, ratingsRaw] = await Promise.all([
    db.select({ freelancerId: applicationsTable.freelancerId, status: applicationsTable.status })
      .from(applicationsTable)
      .where(inArray(applicationsTable.projectId, projectIds)),

    // Monthly spending from funded escrow transactions
    db.select({
      month: sql<string>`TO_CHAR(${escrowTransactionsTable.fundedAt}, 'YYYY-MM')`,
      value: sql<number>`COALESCE(SUM(${escrowTransactionsTable.amount}::numeric), 0)`,
    })
      .from(escrowTransactionsTable)
      .where(and(
        inArray(escrowTransactionsTable.projectId, projectIds),
        sql`${escrowTransactionsTable.fundedAt} IS NOT NULL`,
        sql`${escrowTransactionsTable.fundedAt} >= ${sixMonthsAgo.toISOString()}`,
      ))
      .groupBy(sql`TO_CHAR(${escrowTransactionsTable.fundedAt}, 'YYYY-MM')`),

    // Average rating of freelancers they've reviewed
    db.select({ avg: sql<number>`COALESCE(AVG(${reviewsTable.rating}), 0)` })
      .from(reviewsTable)
      .where(eq(reviewsTable.reviewerId, userId)),
  ]);

  const activeProjects = allProjects.filter(p => p.status === "in_progress").length;
  const completedProjects = allProjects.filter(p => p.status === "completed").length;
  const cancelledProjects = allProjects.filter(p => p.status === "cancelled").length;
  const billableProjects = allProjects.length - cancelledProjects;
  const projectSuccessRate = billableProjects > 0 ? Math.round((completedProjects / billableProjects) * 100) : 0;

  const acceptedApps = allApps.filter(a => a.status === "accepted");
  const freelancersHired = new Set(acceptedApps.map(a => a.freelancerId)).size;

  // Total spending = sum of escrow funded amounts (all time)
  const [totalSpendingRow] = await db.select({
    total: sql<number>`COALESCE(SUM(${escrowTransactionsTable.amount}::numeric), 0)`,
  })
    .from(escrowTransactionsTable)
    .where(and(
      inArray(escrowTransactionsTable.projectId, projectIds),
      sql`${escrowTransactionsTable.fundedAt} IS NOT NULL`,
    ));

  const monthlySpending = zeroFillMonths(months, spendingRaw.map(r => ({
    month: r.month,
    value: Number(r.value),
  })));

  res.json({
    totalProjectsPosted: allProjects.length,
    activeProjects,
    completedProjects,
    cancelledProjects,
    totalSpending: Number(totalSpendingRow?.total ?? 0),
    freelancersHired,
    projectSuccessRate,
    avgFreelancerRating: Number(ratingsRaw[0]?.avg ?? 0) || null,
    monthlySpending,
  });
});

// ─── Admin Analytics ─────────────────────────────────────────────────────────

router.get("/admin", requireAuth, requireAdmin, async (_req, res) => {
  const months = lastNMonths(6);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    userCounts,
    projectCounts,
    revenueRow,
    monthlyUsersRaw,
    monthlyRevenueRaw,
    recentUsers,
    recentEscrows,
    topFreelancers,
  ] = await Promise.all([
    // Users by role
    db.select({ role: usersTable.role, cnt: sql<number>`count(*)` })
      .from(usersTable)
      .groupBy(usersTable.role),

    // Projects by status
    db.select({ status: projectsTable.status, cnt: sql<number>`count(*)` })
      .from(projectsTable)
      .groupBy(projectsTable.status),

    // Total platform revenue (all released escrow)
    db.select({ total: sql<number>`COALESCE(SUM(${escrowTransactionsTable.amount}::numeric), 0)` })
      .from(escrowTransactionsTable)
      .where(eq(escrowTransactionsTable.status, "released")),

    // Monthly new registrations
    db.select({
      month: sql<string>`TO_CHAR(${usersTable.createdAt}, 'YYYY-MM')`,
      value: sql<number>`count(*)`,
    })
      .from(usersTable)
      .where(sql`${usersTable.createdAt} >= ${sixMonthsAgo.toISOString()}`)
      .groupBy(sql`TO_CHAR(${usersTable.createdAt}, 'YYYY-MM')`),

    // Monthly revenue (released escrows)
    db.select({
      month: sql<string>`TO_CHAR(${escrowTransactionsTable.releasedAt}, 'YYYY-MM')`,
      value: sql<number>`COALESCE(SUM(${escrowTransactionsTable.amount}::numeric), 0)`,
    })
      .from(escrowTransactionsTable)
      .where(and(
        eq(escrowTransactionsTable.status, "released"),
        sql`${escrowTransactionsTable.releasedAt} IS NOT NULL`,
        sql`${escrowTransactionsTable.releasedAt} >= ${sixMonthsAgo.toISOString()}`,
      ))
      .groupBy(sql`TO_CHAR(${escrowTransactionsTable.releasedAt}, 'YYYY-MM')`),

    // Recent user registrations
    db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
      .from(usersTable)
      .orderBy(sql`${usersTable.createdAt} DESC`)
      .limit(6),

    // Recent escrow transactions
    db.select({
      id: escrowTransactionsTable.id,
      projectId: escrowTransactionsTable.projectId,
      amount: escrowTransactionsTable.amount,
      status: escrowTransactionsTable.status,
      createdAt: escrowTransactionsTable.createdAt,
    })
      .from(escrowTransactionsTable)
      .orderBy(sql`${escrowTransactionsTable.createdAt} DESC`)
      .limit(6),

    // Top freelancers by earnings
    db.select({
      id: freelancerProfilesTable.id,
      userId: freelancerProfilesTable.userId,
      name: usersTable.name,
      totalEarnings: freelancerProfilesTable.totalEarnings,
      completedProjects: freelancerProfilesTable.completedProjects,
      averageRating: freelancerProfilesTable.averageRating,
    })
      .from(freelancerProfilesTable)
      .innerJoin(usersTable, eq(freelancerProfilesTable.userId, usersTable.id))
      .orderBy(sql`${freelancerProfilesTable.totalEarnings} DESC`)
      .limit(5),
  ]);

  const roleMap = new Map(userCounts.map(u => [u.role, Number(u.cnt)]));
  const statusMap = new Map(projectCounts.map(p => [p.status, Number(p.cnt)]));

  const totalUsers = userCounts.reduce((s, u) => s + Number(u.cnt), 0);
  const totalProjects = projectCounts.reduce((s, p) => s + Number(p.cnt), 0);

  const monthlyRegistrations = zeroFillMonths(months, monthlyUsersRaw.map(r => ({ month: r.month, value: Number(r.value) })));
  const monthlyRevenue = zeroFillMonths(months, monthlyRevenueRaw.map(r => ({ month: r.month, value: Number(r.value) })));

  res.json({
    totalUsers,
    totalFreelancers: roleMap.get("freelancer") ?? 0,
    totalClients: roleMap.get("client") ?? 0,
    totalProjects,
    openProjects: statusMap.get("open") ?? 0,
    activeProjects: statusMap.get("in_progress") ?? 0,
    completedProjects: statusMap.get("completed") ?? 0,
    cancelledProjects: statusMap.get("cancelled") ?? 0,
    platformRevenue: Number(revenueRow[0]?.total ?? 0),
    monthlyRegistrations,
    monthlyRevenue,
    recentUsers,
    recentPayments: recentEscrows,
    topFreelancers,
  });
});

export default router;
