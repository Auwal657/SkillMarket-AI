import { Router } from "express";
import { eq, sql, and } from "drizzle-orm";
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

  const recentWithTitles = await Promise.all(recentApplications.map(async (app) => {
    const [project] = await db.select({ title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, app.projectId));
    return { ...app, projectTitle: project?.title ?? null, freelancerName: null, freelancerHeadline: null };
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

  const projectIds = allProjects.map(p => p.id);
  let totalApplicationsReceived = 0;
  let totalSpent = 0;

  for (const pid of projectIds) {
    const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.projectId, pid));
    totalApplicationsReceived += apps.length;
    const accepted = apps.filter(a => a.status === "accepted");
    totalSpent += accepted.reduce((sum, a) => sum + a.proposedRate, 0);
  }

  const recentProjects = await db.select().from(projectsTable)
    .where(eq(projectsTable.clientId, req.user!.userId))
    .orderBy(sql`${projectsTable.createdAt} DESC`).limit(10);

  const recentWithCounts = await Promise.all(recentProjects.map(async (p) => {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.projectId, p.id));
    return { ...p, clientName: null, applicationCount: Number(count) };
  }));

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

  const openProjects = await db.select().from(projectsTable)
    .where(and(eq(projectsTable.status, "open"), sql`${projectsTable.clientId} != ${req.user!.userId}`))
    .orderBy(sql`${projectsTable.createdAt} DESC`).limit(100);

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
