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
 * Build a normalised set of search terms from project category + required skills.
 * Used for headline/bio text relevance scoring.
 */
function buildProjectTerms(category: string, requiredSkills: string[]): string[] {
  const categoryWords = (category ?? "")
    .toLowerCase()
    .split(/[\s,/&+\-_]+/)
    .filter(w => w.length > 2);
  const skillWords = requiredSkills.map(s => s.toLowerCase().trim());
  return [...new Set([...categoryWords, ...skillWords])];
}

/**
 * Score how many project terms appear in a text string (0–1 ratio).
 */
function textRelevanceRatio(text: string, terms: string[]): number {
  if (!text || terms.length === 0) return 0;
  const lower = text.toLowerCase();
  const hits = terms.filter(t => lower.includes(t)).length;
  return hits / terms.length;
}

/**
 * Compute the effective hourly budget from project totals.
 * Uses timelineWeeks * 40 hrs/week to convert total budget → hourly.
 * Falls back to assuming 40 hours if timeline is missing.
 */
function effectiveHourlyBudget(budgetMax: number, timelineWeeks: number | null): number {
  if (budgetMax <= 0) return 0;
  const hours = (timelineWeeks && timelineWeeks > 0) ? timelineWeeks * 40 : 40;
  return budgetMax / hours;
}

/**
 * Score a freelancer against a project.
 * Signals (total 100 pts):
 *   45 — skill match (weighted by proficiency)
 *   15 — text relevance: category + headline + bio
 *   15 — average rating
 *   10 — completed projects
 *   10 — availability status
 *    5 — hourly rate vs estimated budget/hr
 */
function scoreFreelancerForProject(opts: {
  freelancerSkills: Array<{ name: string; proficiencyLevel: string }>;
  headline: string | null;
  bio: string | null;
  requiredSkills: string[];
  category: string;
  averageRating: number | null;
  completedProjects: number;
  availabilityStatus: string;
  hourlyRate: number;
  budgetMin: number;
  budgetMax: number;
  timelineWeeks: number | null;
}): { score: number; reasons: string[] } {
  const {
    freelancerSkills, headline, bio,
    requiredSkills, category,
    averageRating, completedProjects, availabilityStatus,
    hourlyRate, budgetMin, budgetMax, timelineWeeks,
  } = opts;
  const reasons: string[] = [];

  const skillMap = new Map(
    freelancerSkills.map(s => [s.name.toLowerCase(), PROFICIENCY_WEIGHT[s.proficiencyLevel] ?? 0.5])
  );
  const required = requiredSkills.map(s => s.toLowerCase().trim());

  // ── Skill score — 45 pts ─────────────────────────────────────────────────
  let skillScore = 0;
  if (required.length > 0) {
    const matched = required.filter(r => skillMap.has(r));
    if (matched.length === 0) return { score: 0, reasons: [] }; // must match at least one skill
    const weightedMatch = matched.reduce((sum, r) => sum + (skillMap.get(r) ?? 0.5), 0);
    skillScore = Math.round((weightedMatch / required.length) * 45);
    const matchedLabels = matched.map(r => `${r} (${proficiencyLabel(skillMap.get(r) ?? 0.5)})`);
    reasons.push(`Skills: ${matchedLabels.join(", ")}`);
    if (matched.length < required.length) {
      reasons.push(`${matched.length}/${required.length} required skills matched`);
    }
  } else {
    skillScore = 36; // no skills specified — 80% partial credit
    reasons.push("No specific skills required");
  }

  // ── Text relevance: category + headline + bio — 15 pts ───────────────────
  const terms = buildProjectTerms(category, required);
  let textScore = 0;
  if (terms.length > 0) {
    const headlineRatio = textRelevanceRatio(headline ?? "", terms);
    const bioRatio = textRelevanceRatio(bio ?? "", terms);
    // headline is more concise/intentional → 8 pts, bio → 7 pts
    const headlinePts = Math.round(headlineRatio * 8);
    const bioPts = Math.round(bioRatio * 7);
    textScore = headlinePts + bioPts;
    if (headlinePts > 0) {
      reasons.push(`Headline matches: ${category || requiredSkills.slice(0, 2).join(", ")}`);
    }
    if (bioPts > 0) {
      reasons.push("Bio highlights relevant experience");
    }
  }

  // ── Rating score — 15 pts ────────────────────────────────────────────────
  let ratingScore = 8; // default for no reviews
  if (averageRating !== null && averageRating > 0) {
    ratingScore = Math.round((averageRating / 5) * 15);
    reasons.push(`${averageRating.toFixed(1)}★ rating`);
  }

  // ── Completed projects — 10 pts (capped at 15 = full score) ─────────────
  const capAt = 15;
  const completedScore = Math.round(Math.min(completedProjects, capAt) / capAt * 10);
  if (completedProjects > 0) {
    reasons.push(`${completedProjects} completed project${completedProjects !== 1 ? "s" : ""}`);
  }

  // ── Availability — 10 pts ────────────────────────────────────────────────
  let availScore = 0;
  if (availabilityStatus === "available") {
    availScore = 10;
    reasons.push("Available now");
  } else if (availabilityStatus === "busy") {
    availScore = 4;
    reasons.push("Currently busy");
  }

  // ── Rate fit — 5 pts (hourly rate vs estimated budget/hr) ────────────────
  let rateScore = 0;
  const budgetPerHr = effectiveHourlyBudget(budgetMax, timelineWeeks);
  const budgetPerHrMin = effectiveHourlyBudget(budgetMin, timelineWeeks);
  if (budgetPerHr > 0) {
    if (hourlyRate <= budgetPerHr && hourlyRate >= budgetPerHrMin * 0.5) {
      rateScore = 5;
      reasons.push(`Rate fits budget (₦${hourlyRate}/hr)`);
    } else if (hourlyRate <= budgetPerHr * 1.2) {
      rateScore = 2;
      reasons.push(`Rate close to budget (₦${hourlyRate}/hr)`);
    }
  }

  const score = Math.min(100, skillScore + textScore + ratingScore + completedScore + availScore + rateScore);
  return { score, reasons };
}

/**
 * Score a project for a freelancer.
 * Same signals as scoreFreelancerForProject, just inverted perspective.
 */
function scoreProjectForFreelancer(opts: {
  freelancerSkills: Map<string, number>;
  freelancerHeadline: string | null;
  freelancerBio: string | null;
  freelancerCompletedProjects: number;
  freelancerRating: number | null;
  freelancerAvailability: string;
  freelancerHourlyRate: number;
  project: {
    requiredSkills: string[];
    budgetMin: number;
    budgetMax: number;
    category: string;
    timelineWeeks: number | null;
  };
}): { score: number; reasons: string[] } {
  const {
    freelancerSkills, freelancerHeadline, freelancerBio,
    freelancerCompletedProjects, freelancerRating,
    freelancerAvailability, freelancerHourlyRate, project,
  } = opts;
  const reasons: string[] = [];
  const required = (project.requiredSkills ?? []).map(s => s.toLowerCase().trim());

  // ── Skill score — 45 pts ─────────────────────────────────────────────────
  let skillScore = 0;
  if (required.length > 0) {
    const matched = required.filter(r => freelancerSkills.has(r));
    if (matched.length === 0) return { score: 0, reasons: [] };
    const weightedMatch = matched.reduce((sum, r) => sum + (freelancerSkills.get(r) ?? 0.5), 0);
    skillScore = Math.round((weightedMatch / required.length) * 45);
    const matchedLabels = matched.map(r => `${r} (${proficiencyLabel(freelancerSkills.get(r) ?? 0.5)})`);
    reasons.push(`Skills: ${matchedLabels.join(", ")}`);
    if (matched.length < required.length) {
      reasons.push(`${matched.length}/${required.length} required skills matched`);
    }
  } else {
    skillScore = 36;
  }

  // ── Text relevance: category + headline + bio — 15 pts ───────────────────
  const terms = buildProjectTerms(project.category, required);
  let textScore = 0;
  if (terms.length > 0) {
    const headlineRatio = textRelevanceRatio(freelancerHeadline ?? "", terms);
    const bioRatio = textRelevanceRatio(freelancerBio ?? "", terms);
    const headlinePts = Math.round(headlineRatio * 8);
    const bioPts = Math.round(bioRatio * 7);
    textScore = headlinePts + bioPts;
    if (headlinePts > 0) {
      reasons.push(`Headline matches: ${project.category || required.slice(0, 2).join(", ")}`);
    }
    if (bioPts > 0) {
      reasons.push("Bio highlights relevant experience");
    }
  }

  // ── Rating — 15 pts ──────────────────────────────────────────────────────
  let ratingScore = 8;
  if (freelancerRating !== null && freelancerRating > 0) {
    ratingScore = Math.round((freelancerRating / 5) * 15);
    reasons.push(`${freelancerRating.toFixed(1)}★ rating`);
  }

  // ── Completed projects — 10 pts ──────────────────────────────────────────
  const capAt = 15;
  const completedScore = Math.round(Math.min(freelancerCompletedProjects, capAt) / capAt * 10);
  if (freelancerCompletedProjects > 0) {
    reasons.push(`${freelancerCompletedProjects} completed project${freelancerCompletedProjects !== 1 ? "s" : ""}`);
  }

  // ── Availability — 10 pts ────────────────────────────────────────────────
  let availScore = 0;
  if (freelancerAvailability === "available") {
    availScore = 10;
    reasons.push("Available now");
  } else if (freelancerAvailability === "busy") {
    availScore = 4;
    reasons.push("Currently busy");
  }

  // ── Rate fit — 5 pts ─────────────────────────────────────────────────────
  let rateScore = 0;
  const budgetPerHr = effectiveHourlyBudget(project.budgetMax, project.timelineWeeks);
  if (budgetPerHr > 0 && freelancerHourlyRate <= budgetPerHr) {
    rateScore = 5;
    reasons.push(`Rate fits budget (₦${freelancerHourlyRate}/hr)`);
  } else if (budgetPerHr > 0 && freelancerHourlyRate <= budgetPerHr * 1.3) {
    rateScore = 2;
    reasons.push(`Rate close to budget (₦${freelancerHourlyRate}/hr)`);
  }

  const score = Math.min(100, skillScore + textScore + ratingScore + completedScore + availScore + rateScore);
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
        freelancerHeadline: profile.headline,
        freelancerBio: profile.bio,
        freelancerCompletedProjects: profile.completedProjects,
        freelancerRating: profile.averageRating,
        freelancerAvailability: profile.availabilityStatus,
        freelancerHourlyRate: profile.hourlyRate,
        project: {
          requiredSkills: r.project.requiredSkills ?? [],
          budgetMin: r.project.budgetMin,
          budgetMax: r.project.budgetMax,
          category: r.project.category ?? "",
          timelineWeeks: r.project.timelineWeeks ?? null,
        },
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

      const { score, reasons } = scoreFreelancerForProject({
        freelancerSkills: fSkills,
        headline: f.profile.headline,
        bio: f.profile.bio,
        requiredSkills: required,
        category: project.category ?? "",
        averageRating: f.profile.averageRating,
        completedProjects: f.profile.completedProjects,
        availabilityStatus: f.profile.availabilityStatus,
        hourlyRate: f.profile.hourlyRate,
        budgetMin: project.budgetMin,
        budgetMax: project.budgetMax,
        timelineWeeks: project.timelineWeeks ?? null,
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
