import { Router } from "express";
import { eq, sql, and, inArray, ne } from "drizzle-orm";
import {
  db, applicationsTable, projectsTable, freelancerProfilesTable,
  freelancerSkillsTable, skillsTable, usersTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

// ─── Scoring helpers ────────────────────────────────────────────────────────

const PROFICIENCY_WEIGHT: Record<string, number> = {
  beginner: 0.25,
  intermediate: 0.5,
  advanced: 0.75,
  expert: 1.0,
};

function proficiencyLabel(weight: number): string {
  return Object.entries(PROFICIENCY_WEIGHT).find(([, v]) => v === weight)?.[0] ?? "intermediate";
}

/**
 * Score a freelancer against a set of required skills + other signals.
 * Returns 0–100 and an array of human-readable reasons.
 */
function scoreFreelancerForProject(opts: {
  freelancerSkills: Array<{ name: string; proficiencyLevel: string }>;
  requiredSkills: string[];
  averageRating: number | null;
  completedProjects: number;
  availabilityStatus: string;
  hourlyRate: number;
  budgetMin: number;
  budgetMax: number;
}): { score: number; reasons: string[] } {
  const { freelancerSkills, requiredSkills, averageRating, completedProjects, availabilityStatus, hourlyRate, budgetMin, budgetMax } = opts;
  const reasons: string[] = [];

  const skillMap = new Map(
    freelancerSkills.map(s => [s.name.toLowerCase(), PROFICIENCY_WEIGHT[s.proficiencyLevel] ?? 0.5])
  );
  const required = requiredSkills.map(s => s.toLowerCase().trim());

  // Skill score — 50 pts
  let skillScore = 0;
  if (required.length > 0) {
    const matched = required.filter(r => skillMap.has(r));
    if (matched.length === 0) return { score: 0, reasons: [] }; // must match at least one skill
    const weightedMatch = matched.reduce((sum, r) => sum + (skillMap.get(r) ?? 0.5), 0);
    const maxWeight = required.length; // full weight per skill if expert
    skillScore = Math.round((weightedMatch / maxWeight) * 50);
    const matchedLabels = matched.map(r => {
      const w = skillMap.get(r) ?? 0.5;
      return `${r} (${proficiencyLabel(w)})`;
    });
    reasons.push(`Skills: ${matchedLabels.join(", ")}`);
    if (matched.length < required.length) {
      reasons.push(`${matched.length}/${required.length} required skills matched`);
    }
  } else {
    skillScore = 40; // no skills specified — partial credit
    reasons.push("No specific skills required");
  }

  // Rating score — 20 pts
  let ratingScore = 10; // default for no reviews
  if (averageRating !== null && averageRating > 0) {
    ratingScore = Math.round((averageRating / 5) * 20);
    reasons.push(`${averageRating.toFixed(1)}★ rating`);
  }

  // Completed projects score — 15 pts (capped at 15 completed = full score)
  const capAt = 15;
  const completedScore = Math.round(Math.min(completedProjects, capAt) / capAt * 15);
  if (completedProjects > 0) {
    reasons.push(`${completedProjects} completed project${completedProjects !== 1 ? "s" : ""}`);
  }

  // Availability score — 10 pts
  let availScore = 0;
  if (availabilityStatus === "available") {
    availScore = 10;
    reasons.push("Available now");
  } else if (availabilityStatus === "busy") {
    availScore = 4;
    reasons.push("Currently busy");
  }

  // Rate fit score — 5 pts
  let rateScore = 0;
  if (budgetMax > 0) {
    const effectiveBudgetPerHr = budgetMax / (40); // rough: budget/40hr week
    if (hourlyRate <= budgetMax && hourlyRate >= budgetMin * 0.5) {
      rateScore = 5;
      reasons.push(`Rate fits budget (₦${hourlyRate}/hr)`);
    } else if (hourlyRate <= budgetMax * 1.2) {
      rateScore = 2;
      reasons.push(`Rate close to budget (₦${hourlyRate}/hr)`);
    }
    void effectiveBudgetPerHr;
  }

  const score = Math.min(100, skillScore + ratingScore + completedScore + availScore + rateScore);
  return { score, reasons };
}

/**
 * Score a project for a freelancer.
 */
function scoreProjectForFreelancer(opts: {
  freelancerSkills: Map<string, number>;
  freelancerCompletedProjects: number;
  freelancerRating: number | null;
  freelancerAvailability: string;
  freelancerHourlyRate: number;
  project: {
    requiredSkills: string[];
    budgetMin: number;
    budgetMax: number;
    category: string;
  };
}): { score: number; reasons: string[] } {
  const { freelancerSkills, freelancerCompletedProjects, freelancerRating, freelancerAvailability, freelancerHourlyRate, project } = opts;
  const reasons: string[] = [];
  const required = (project.requiredSkills ?? []).map(s => s.toLowerCase().trim());

  // Skill score — 50 pts
  let skillScore = 0;
  if (required.length > 0) {
    const matched = required.filter(r => freelancerSkills.has(r));
    if (matched.length === 0) return { score: 0, reasons: [] };
    const weightedMatch = matched.reduce((sum, r) => sum + (freelancerSkills.get(r) ?? 0.5), 0);
    skillScore = Math.round((weightedMatch / required.length) * 50);
    const matchedLabels = matched.map(r => {
      const w = freelancerSkills.get(r) ?? 0.5;
      return `${r} (${proficiencyLabel(w)})`;
    });
    reasons.push(`Skills: ${matchedLabels.join(", ")}`);
    if (matched.length < required.length) {
      reasons.push(`${matched.length}/${required.length} required skills matched`);
    }
  } else {
    skillScore = 40;
  }

  // Rating — 20 pts
  let ratingScore = 10;
  if (freelancerRating !== null && freelancerRating > 0) {
    ratingScore = Math.round((freelancerRating / 5) * 20);
    reasons.push(`${freelancerRating.toFixed(1)}★ rating`);
  }

  // Completed projects — 15 pts
  const capAt = 15;
  const completedScore = Math.round(Math.min(freelancerCompletedProjects, capAt) / capAt * 15);
  if (freelancerCompletedProjects > 0) {
    reasons.push(`${freelancerCompletedProjects} completed project${freelancerCompletedProjects !== 1 ? "s" : ""}`);
  }

  // Availability — 10 pts
  let availScore = 0;
  if (freelancerAvailability === "available") {
    availScore = 10;
    reasons.push("Available now");
  } else if (freelancerAvailability === "busy") {
    availScore = 4;
    reasons.push("Currently busy");
  }

  // Rate fit — 5 pts
  let rateScore = 0;
  if (project.budgetMax > 0 && freelancerHourlyRate <= project.budgetMax) {
    rateScore = 5;
    reasons.push(`Rate fits budget (₦${freelancerHourlyRate}/hr)`);
  } else if (project.budgetMax > 0 && freelancerHourlyRate <= project.budgetMax * 1.3) {
    rateScore = 2;
    reasons.push(`Rate close to budget (₦${freelancerHourlyRate}/hr)`);
  }

  const score = Math.min(100, skillScore + ratingScore + completedScore + availScore + rateScore);
  return { score, reasons };
}

// ─── Routes ─────────────────────────────────────────────────────────────────

router.get("/freelancer", requireAuth, requireRole("freelancer"), async (req, res) => {
  const [profile] = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (!profile) { res.status(404).json({ error: "No freelancer profile" }); return; }

  const allApps = await db.select().from(applicationsTable).where(eq(applicationsTable.freelancerId, req.user!.userId));
  const activeApplications = allApps.filter(a => a.status === "pending").length;
  const acceptedApplications = allApps.filter(a => a.status === "accepted").length;

  const recentApplications = await db.select().from(applicationsTable)
    .where(eq(applicationsTable.freelancerId, req.user!.userId))
    .orderBy(sql`${applicationsTable.createdAt} DESC`).limit(10);

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

// ─── AI Recommendations: projects for freelancer ────────────────────────────

router.get("/ai-recommendations", requireAuth, requireRole("freelancer"), async (req, res) => {
  const [profile] = await db.select().from(freelancerProfilesTable)
    .where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (!profile) { res.status(404).json({ error: "No freelancer profile" }); return; }

  const mySkills = await db.select({
    name: skillsTable.name,
    proficiencyLevel: freelancerSkillsTable.proficiencyLevel,
  })
    .from(freelancerSkillsTable)
    .innerJoin(skillsTable, eq(freelancerSkillsTable.skillId, skillsTable.id))
    .where(eq(freelancerSkillsTable.freelancerProfileId, profile.id));

  const skillMap = new Map(
    mySkills.map(s => [s.name.toLowerCase(), PROFICIENCY_WEIGHT[s.proficiencyLevel] ?? 0.5])
  );

  if (skillMap.size === 0) { res.json([]); return; }

  // Exclude projects the freelancer already applied to
  const myApplications = await db.select({ projectId: applicationsTable.projectId })
    .from(applicationsTable)
    .where(eq(applicationsTable.freelancerId, req.user!.userId));
  const appliedProjectIds = new Set(myApplications.map(a => a.projectId));

  // Fetch recent open projects (not own, not already applied)
  const openProjects = await db
    .select({
      project: projectsTable,
      clientName: usersTable.name,
    })
    .from(projectsTable)
    .innerJoin(usersTable, eq(projectsTable.clientId, usersTable.id))
    .where(and(
      eq(projectsTable.status, "open"),
      ne(projectsTable.clientId, req.user!.userId),
    ))
    .orderBy(sql`${projectsTable.createdAt} DESC`)
    .limit(80);

  // Batch application counts
  const projectIds = openProjects.map(r => r.project.id);
  const appCounts = projectIds.length > 0
    ? await db.select({
        projectId: applicationsTable.projectId,
        count: sql<number>`count(*)`,
      }).from(applicationsTable).where(inArray(applicationsTable.projectId, projectIds)).groupBy(applicationsTable.projectId)
    : [];
  const countMap = new Map(appCounts.map(a => [a.projectId, Number(a.count)]));

  const scored = openProjects
    .filter(r => !appliedProjectIds.has(r.project.id))
    .map(r => {
      const { score, reasons } = scoreProjectForFreelancer({
        freelancerSkills: skillMap,
        freelancerCompletedProjects: profile.completedProjects,
        freelancerRating: profile.averageRating,
        freelancerAvailability: profile.availabilityStatus,
        freelancerHourlyRate: profile.hourlyRate,
        project: r.project,
      });
      if (score === 0) return null;

      return {
        project: {
          ...r.project,
          clientName: r.clientName,
          applicationCount: countMap.get(r.project.id) ?? 0,
        },
        matchScore: score,
        matchReasons: reasons,
      };
    })
    .filter(Boolean);

  scored.sort((a, b) => b!.matchScore - a!.matchScore);
  res.json(scored.slice(0, 20));
});

// ─── AI Recommendations: freelancers for client's projects ──────────────────

router.get("/ai-freelancers", requireAuth, requireRole("client"), async (req, res) => {
  // Get client's open projects
  const clientProjects = await db.select().from(projectsTable)
    .where(and(eq(projectsTable.clientId, req.user!.userId), eq(projectsTable.status, "open")))
    .orderBy(sql`${projectsTable.createdAt} DESC`)
    .limit(5); // show recommendations for up to 5 open projects

  if (clientProjects.length === 0) { res.json([]); return; }

  // Gather all required skills across all projects
  const allRequiredSkillNames = new Set(
    clientProjects.flatMap(p => (p.requiredSkills ?? []).map(s => s.toLowerCase().trim()))
  );

  // Fetch available & busy freelancers with their profiles
  const freelancerProfiles = await db
    .select({
      profile: freelancerProfilesTable,
      user: {
        id: usersTable.id,
        name: usersTable.name,
        avatarUrl: usersTable.avatarUrl,
        university: usersTable.university,
      },
    })
    .from(freelancerProfilesTable)
    .innerJoin(usersTable, eq(freelancerProfilesTable.userId, usersTable.id))
    .where(sql`${freelancerProfilesTable.availabilityStatus} IN ('available', 'busy')`)
    .limit(100);

  if (freelancerProfiles.length === 0) { res.json([]); return; }

  // Batch-load skills for all fetched freelancers
  const profileIds = freelancerProfiles.map(f => f.profile.id);
  const allSkills = await db.select({
    freelancerProfileId: freelancerSkillsTable.freelancerProfileId,
    skillName: skillsTable.name,
    proficiencyLevel: freelancerSkillsTable.proficiencyLevel,
  })
    .from(freelancerSkillsTable)
    .innerJoin(skillsTable, eq(freelancerSkillsTable.skillId, skillsTable.id))
    .where(inArray(freelancerSkillsTable.freelancerProfileId, profileIds));

  // Filter only freelancers who have at least one relevant skill
  const skillsByProfile = new Map<number, Array<{ name: string; proficiencyLevel: string }>>();
  for (const s of allSkills) {
    if (!skillsByProfile.has(s.freelancerProfileId)) skillsByProfile.set(s.freelancerProfileId, []);
    skillsByProfile.get(s.freelancerProfileId)!.push({ name: s.skillName, proficiencyLevel: s.proficiencyLevel });
  }

  // Filter to only freelancers with at least one skill overlapping any project
  const relevantFreelancers = freelancerProfiles.filter(f => {
    const skills = skillsByProfile.get(f.profile.id) ?? [];
    return skills.some(s => allRequiredSkillNames.has(s.name.toLowerCase().trim()));
  });

  // For each project, score relevant freelancers
  const projectRecommendations = clientProjects.map(project => {
    const required = (project.requiredSkills ?? []).map(s => s.toLowerCase().trim());

    const scored = relevantFreelancers.map(f => {
      const fSkills = skillsByProfile.get(f.profile.id) ?? [];
      const fSkillMap = new Map(fSkills.map(s => [s.name.toLowerCase(), PROFICIENCY_WEIGHT[s.proficiencyLevel] ?? 0.5]));

      const { score, reasons } = scoreFreelancerForProject({
        freelancerSkills: fSkills,
        requiredSkills: required,
        averageRating: f.profile.averageRating,
        completedProjects: f.profile.completedProjects,
        availabilityStatus: f.profile.availabilityStatus,
        hourlyRate: f.profile.hourlyRate,
        budgetMin: project.budgetMin,
        budgetMax: project.budgetMax,
      });
      if (score === 0) return null;

      return {
        freelancer: {
          id: f.profile.id,
          userId: f.profile.userId,
          user: f.user,
          headline: f.profile.headline,
          bio: f.profile.bio,
          hourlyRate: f.profile.hourlyRate,
          availabilityStatus: f.profile.availabilityStatus,
          completedProjects: f.profile.completedProjects,
          averageRating: f.profile.averageRating,
          totalReviews: f.profile.totalReviews,
          skills: (skillsByProfile.get(f.profile.id) ?? []).map(s => ({
            skillName: s.name,
            proficiencyLevel: s.proficiencyLevel,
          })),
        },
        matchScore: score,
        matchReasons: reasons,
      };
    }).filter(Boolean);

    scored.sort((a, b) => b!.matchScore - a!.matchScore);

    return {
      project: {
        id: project.id,
        title: project.title,
        category: project.category,
        requiredSkills: project.requiredSkills,
        budgetMin: project.budgetMin,
        budgetMax: project.budgetMax,
      },
      recommendations: scored.slice(0, 5),
    };
  }).filter(p => p.recommendations.length > 0);

  res.json(projectRecommendations);
});

export default router;
