import { Router } from "express";
import { eq, sql, desc } from "drizzle-orm";
import {
  db, usersTable, projectsTable, applicationsTable,
  freelancerProfilesTable, reviewsTable,
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

export default router;
