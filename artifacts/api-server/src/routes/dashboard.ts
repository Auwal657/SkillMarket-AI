import { Router } from "express";
import { eq, sql, and, inArray } from "drizzle-orm";
import {
  db, applicationsTable, projectsTable, freelancerProfilesTable,
  freelancerSkillsTable, skillsTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

router.get("/freelancer", requireAuth, requireRole("freelancer"), async (req, res) => {
  const [profile] = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (!profile) { res.status(404).json({ error: "No freelancer profile" }); return; }

  const allApps = await db.select().from(applicationsTable).where(eq(applicationsTable.freelancerId, req.user!.userId));
  const activeApplications = allApps.filter(a => a.status === "pending").length;
  const acceptedApplications = allApps.filter(a => a.status === "accepted").length;

  const recentApplications = await db.select().from(applicationsTable)
    .where(eq(applicationsTable.freelancerId, req.user!.userId))
    .orderBy(sql`${applicationsTable.createdAt} DESC`).limit(10);

  // P1: Batch query project titles instead of N individual queries
  const projectIds = [...new Set(recentApplications.map(a => a.projectId))];
  const projects = projectIds.length > 0
    ? await db.select({ id: projectsTable.id, title: projectsTable.title })
        .from(projectsTable)
        .where(inArray(projectsTable.id, projectIds))
    : [];
  const titleMap = new Map(projects.map(p => [p.id, p.title]));

  const recentWithTitles = recentApplications.map(app => ({
    ...app,
    projectTitle: titleMap.get(app.projectId) ?? null,
    freelancerName: null,
    freelancerHeadline: null,
  }));

  res.json({
    totalEarnings: profile.totalEarnings,
    activeApplications,
    acceptedApplications,
    profileViews: profile.profileViews,
    averageRating: profile.averageRating,
    recentApplications: recentWithTitles,
  });
});

router.get("/client", requireAuth, requireRole("client"), async (req, res) => {
  const allProjects = await db.select().from(projectsTable).where(eq(projectsTable.clientId, req.user!.userId));
  const totalProjectsPosted = allProjects.length;
  const openProjects = allProjects.filter(p => p.status === "open").length;

  // B8/P1: Batch all application data in a single query — no per-project loop
  let totalApplicationsReceived = 0;
  let totalSpent = 0;

  if (allProjects.length > 0) {
    const projectIds = allProjects.map(p => p.id);
    const allApps = await db.select({
      projectId: applicationsTable.projectId,
      status: applicationsTable.status,
      proposedRate: applicationsTable.proposedRate,
    }).from(applicationsTable).where(inArray(applicationsTable.projectId, projectIds));

    totalApplicationsReceived = allApps.length;
    totalSpent = allApps
      .filter(a => a.status === "accepted")
      .reduce((sum, a) => sum + a.proposedRate, 0);
  }

  const recentProjects = await db.select().from(projectsTable)
    .where(eq(projectsTable.clientId, req.user!.userId))
    .orderBy(sql`${projectsTable.createdAt} DESC`).limit(10);

  // P1: Batch application counts
  let recentWithCounts: object[] = [];
  if (recentProjects.length > 0) {
    const recentIds = recentProjects.map(p => p.id);
    const appCounts = await db.select({
      projectId: applicationsTable.projectId,
      count: sql<number>`count(*)`,
    }).from(applicationsTable).where(inArray(applicationsTable.projectId, recentIds)).groupBy(applicationsTable.projectId);

    const countMap = new Map(appCounts.map(a => [a.projectId, Number(a.count)]));
    recentWithCounts = recentProjects.map(p => ({ ...p, clientName: null, applicationCount: countMap.get(p.id) ?? 0 }));
  }

  res.json({ totalProjectsPosted, openProjects, totalApplicationsReceived, totalSpent, recentProjects: recentWithCounts });
});

router.get("/ai-recommendations", requireAuth, requireRole("freelancer"), async (req, res) => {
  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable)
    .where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (!profile) { res.status(404).json({ error: "No freelancer profile" }); return; }

  const mySkills = await db.select({ name: skillsTable.name, proficiencyLevel: freelancerSkillsTable.proficiencyLevel })
    .from(freelancerSkillsTable).innerJoin(skillsTable, eq(freelancerSkillsTable.skillId, skillsTable.id))
    .where(eq(freelancerSkillsTable.freelancerProfileId, profile.id));

  if (mySkills.length === 0) { res.json([]); return; }

  const proficiencyWeight: Record<string, number> = { beginner: 0.25, intermediate: 0.5, advanced: 0.75, expert: 1.0 };
  const skillWeightMap = new Map(mySkills.map(s => [s.name.toLowerCase(), proficiencyWeight[s.proficiencyLevel] ?? 0.5]));
  const mySkillNames = new Set(mySkills.map(s => s.name.toLowerCase()));

  // P3: Limit open project scope so AI scoring doesn't scan unbounded rows
  const openProjects = await db.select().from(projectsTable)
    .where(and(eq(projectsTable.status, "open"), sql`${projectsTable.clientId} != ${req.user!.userId}`))
    .orderBy(sql`${projectsTable.createdAt} DESC`).limit(50);

  const scored = openProjects.map(project => {
    const required = (project.requiredSkills ?? []).map(s => s.toLowerCase());
    if (required.length === 0) return null;
    const matched = required.filter(s => mySkillNames.has(s));
    if (matched.length === 0) return null;

    const weightedScore = matched.reduce((sum, s) => sum + (skillWeightMap.get(s) ?? 0.5), 0);
    const maxScore = required.length;
    const matchScore = Math.round((weightedScore / maxScore) * 100);
    const matchReasons = matched.map(s => {
      const weight = skillWeightMap.get(s) ?? 0.5;
      const level = Object.entries(proficiencyWeight).find(([, v]) => v === weight)?.[0] ?? "intermediate";
      return `${s} (${level})`;
    });

    return { project: { ...project, clientName: null, applicationCount: 0 }, matchScore, matchReasons };
  }).filter(Boolean);

  scored.sort((a, b) => b!.matchScore - a!.matchScore);
  res.json(scored.slice(0, 20));
});

export default router;
