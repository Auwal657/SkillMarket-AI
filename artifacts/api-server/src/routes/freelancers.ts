import { Router } from "express";
import { eq, ilike, or, sql, inArray } from "drizzle-orm";
import {
  db, freelancerProfilesTable, usersTable, freelancerSkillsTable,
  skillsTable, portfolioItemsTable,
} from "@workspace/db";
import {
  CreateFreelancerProfileBody, UpdateFreelancerProfileBody,
  AddSkillBody, AddPortfolioItemBody,
} from "@workspace/api-zod";
import { requireAuth, requireRole, optionalAuth } from "../lib/auth";

const router = Router();

function buildProfile(profile: Record<string, unknown>, user: Record<string, unknown>, skills: unknown[], portfolio: unknown[]) {
  return {
    id: profile.id,
    userId: profile.userId,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, createdAt: user.createdAt },
    headline: profile.headline,
    bio: profile.bio,
    hourlyRate: profile.hourlyRate,
    availabilityStatus: profile.availabilityStatus,
    totalEarnings: profile.totalEarnings,
    completedProjects: profile.completedProjects,
    averageRating: profile.averageRating,
    totalReviews: profile.totalReviews,
    profileViews: profile.profileViews,
    skills,
    portfolio,
    createdAt: profile.createdAt,
  };
}

// P1: Batch-fetch skills and portfolio for a list of profile IDs
async function attachSkillsAndPortfolio(profileIds: number[]) {
  if (profileIds.length === 0) return { skillsMap: new Map(), portfolioMap: new Map() };

  const [allSkills, allPortfolio] = await Promise.all([
    db.select({
      id: freelancerSkillsTable.id,
      freelancerProfileId: freelancerSkillsTable.freelancerProfileId,
      skillId: freelancerSkillsTable.skillId,
      skillName: skillsTable.name,
      skillCategory: skillsTable.category,
      proficiencyLevel: freelancerSkillsTable.proficiencyLevel,
    })
      .from(freelancerSkillsTable)
      .innerJoin(skillsTable, eq(freelancerSkillsTable.skillId, skillsTable.id))
      .where(inArray(freelancerSkillsTable.freelancerProfileId, profileIds)),
    db.select().from(portfolioItemsTable).where(inArray(portfolioItemsTable.freelancerProfileId, profileIds)),
  ]);

  const skillsMap = new Map<number, typeof allSkills>();
  const portfolioMap = new Map<number, typeof allPortfolio>();

  for (const s of allSkills) {
    if (!skillsMap.has(s.freelancerProfileId)) skillsMap.set(s.freelancerProfileId, []);
    skillsMap.get(s.freelancerProfileId)!.push(s);
  }
  for (const p of allPortfolio) {
    if (!portfolioMap.has(p.freelancerProfileId)) portfolioMap.set(p.freelancerProfileId, []);
    portfolioMap.get(p.freelancerProfileId)!.push(p);
  }

  return { skillsMap, portfolioMap };
}

// IMPORTANT: /me routes MUST come before /:id
router.get("/me", requireAuth, async (req, res) => {
  const [profile] = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (!profile) { res.status(404).json({ error: "No freelancer profile found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  const { skillsMap, portfolioMap } = await attachSkillsAndPortfolio([profile.id]);

  res.json(buildProfile(profile as Record<string, unknown>, user as Record<string, unknown>, skillsMap.get(profile.id) ?? [], portfolioMap.get(profile.id) ?? []));
});

router.post("/me", requireAuth, requireRole("freelancer"), async (req, res) => {
  const existing = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (existing.length > 0) { res.status(409).json({ error: "Freelancer profile already exists" }); return; }

  const parsed = CreateFreelancerProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

  const [profile] = await db.insert(freelancerProfilesTable).values({
    userId: req.user!.userId,
    headline: parsed.data.headline,
    bio: parsed.data.bio,
    hourlyRate: parsed.data.hourlyRate,
    availabilityStatus: parsed.data.availabilityStatus ?? "available",
  }).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  res.status(201).json(buildProfile(profile as Record<string, unknown>, user as Record<string, unknown>, [], []));
});

router.patch("/me", requireAuth, requireRole("freelancer"), async (req, res) => {
  const [profile] = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (!profile) { res.status(404).json({ error: "No freelancer profile found" }); return; }

  const parsed = UpdateFreelancerProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

  const updates: Record<string, unknown> = {};
  if (parsed.data.headline !== undefined) updates.headline = parsed.data.headline;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.hourlyRate !== undefined) updates.hourlyRate = parsed.data.hourlyRate;
  if (parsed.data.availabilityStatus !== undefined) updates.availabilityStatus = parsed.data.availabilityStatus;

  const [updated] = Object.keys(updates).length > 0
    ? await db.update(freelancerProfilesTable).set(updates).where(eq(freelancerProfilesTable.id, profile.id)).returning()
    : [profile];

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  const { skillsMap, portfolioMap } = await attachSkillsAndPortfolio([profile.id]);

  res.json(buildProfile(updated as Record<string, unknown>, user as Record<string, unknown>, skillsMap.get(profile.id) ?? [], portfolioMap.get(profile.id) ?? []));
});

// Skills sub-routes
router.get("/me/skills", requireAuth, async (req, res) => {
  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (!profile) { res.status(404).json({ error: "No freelancer profile" }); return; }

  const skills = await db.select({ id: freelancerSkillsTable.id, skillId: freelancerSkillsTable.skillId, skillName: skillsTable.name, skillCategory: skillsTable.category, proficiencyLevel: freelancerSkillsTable.proficiencyLevel })
    .from(freelancerSkillsTable).innerJoin(skillsTable, eq(freelancerSkillsTable.skillId, skillsTable.id))
    .where(eq(freelancerSkillsTable.freelancerProfileId, profile.id));
  res.json(skills);
});

router.post("/me/skills", requireAuth, requireRole("freelancer"), async (req, res) => {
  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (!profile) { res.status(404).json({ error: "No freelancer profile" }); return; }

  const parsed = AddSkillBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

  const [skill] = await db.insert(freelancerSkillsTable).values({
    freelancerProfileId: profile.id,
    skillId: parsed.data.skillId,
    proficiencyLevel: parsed.data.proficiencyLevel,
  }).onConflictDoNothing().returning();

  if (!skill) { res.status(409).json({ error: "Skill already added" }); return; }

  const [skillData] = await db.select().from(skillsTable).where(eq(skillsTable.id, skill.skillId));
  res.status(201).json({ id: skill.id, skillId: skill.skillId, skillName: skillData.name, skillCategory: skillData.category, proficiencyLevel: skill.proficiencyLevel });
});

router.delete("/me/skills/:skillId", requireAuth, requireRole("freelancer"), async (req, res) => {
  const skillId = parseInt(req.params.skillId, 10);
  if (isNaN(skillId)) { res.status(400).json({ error: "Invalid skillId" }); return; }

  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (!profile) { res.status(404).json({ error: "No freelancer profile" }); return; }

  await db.delete(freelancerSkillsTable).where(
    sql`${freelancerSkillsTable.freelancerProfileId} = ${profile.id} AND ${freelancerSkillsTable.skillId} = ${skillId}`
  );
  res.json({ message: "Skill removed" });
});

// Portfolio sub-routes
router.get("/me/portfolio", requireAuth, async (req, res) => {
  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (!profile) { res.status(404).json({ error: "No freelancer profile" }); return; }
  const portfolio = await db.select().from(portfolioItemsTable).where(eq(portfolioItemsTable.freelancerProfileId, profile.id));
  res.json(portfolio);
});

router.post("/me/portfolio", requireAuth, requireRole("freelancer"), async (req, res) => {
  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (!profile) { res.status(404).json({ error: "No freelancer profile" }); return; }

  const parsed = AddPortfolioItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

  const [item] = await db.insert(portfolioItemsTable).values({
    freelancerProfileId: profile.id,
    title: parsed.data.title,
    description: parsed.data.description,
    imageUrl: parsed.data.imageUrl ?? null,
    projectUrl: parsed.data.projectUrl ?? null,
    tags: parsed.data.tags ?? [],
  }).returning();
  res.status(201).json(item);
});

router.delete("/me/portfolio/:itemId", requireAuth, requireRole("freelancer"), async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  if (isNaN(itemId)) { res.status(400).json({ error: "Invalid itemId" }); return; }

  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, req.user!.userId));
  if (!profile) { res.status(404).json({ error: "No freelancer profile" }); return; }

  await db.delete(portfolioItemsTable).where(
    sql`${portfolioItemsTable.id} = ${itemId} AND ${portfolioItemsTable.freelancerProfileId} = ${profile.id}`
  );
  res.json({ message: "Portfolio item deleted" });
});

// Public freelancer list
router.get("/", async (req, res) => {
  const skill = req.query.skill as string | undefined;
  const search = req.query.search as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string || "20", 10), 100);
  const offset = parseInt(req.query.offset as string || "0", 10);

  let profileIds: number[] | null = null;
  if (skill) {
    const matchingSkills = await db.select({ id: skillsTable.id }).from(skillsTable).where(ilike(skillsTable.name, `%${skill}%`));
    if (matchingSkills.length === 0) { res.json([]); return; }
    const skillIds = matchingSkills.map(s => s.id);
    const matched = await db.select({ freelancerProfileId: freelancerSkillsTable.freelancerProfileId })
      .from(freelancerSkillsTable).where(inArray(freelancerSkillsTable.skillId, skillIds));
    profileIds = [...new Set(matched.map(p => p.freelancerProfileId))];
    if (profileIds.length === 0) { res.json([]); return; }
  }

  let query = db.select({
    profile: freelancerProfilesTable,
    user: { id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, university: usersTable.university, avatarUrl: usersTable.avatarUrl, createdAt: usersTable.createdAt },
  }).from(freelancerProfilesTable).innerJoin(usersTable, eq(freelancerProfilesTable.userId, usersTable.id)).$dynamic();

  const conditions = [];
  if (profileIds !== null) conditions.push(inArray(freelancerProfilesTable.id, profileIds));
  if (search) conditions.push(or(ilike(usersTable.name, `%${search}%`), ilike(freelancerProfilesTable.headline, `%${search}%`), ilike(freelancerProfilesTable.bio, `%${search}%`))!);

  if (conditions.length === 1) query = query.where(conditions[0]);
  else if (conditions.length === 2) query = query.where(sql`${conditions[0]} AND ${conditions[1]}`);

  const profiles = await query.limit(limit).offset(offset);
  if (profiles.length === 0) { res.json([]); return; }

  // P1: Batch all skills and portfolio in 2 queries total
  const pIds = profiles.map(({ profile }) => profile.id);
  const { skillsMap, portfolioMap } = await attachSkillsAndPortfolio(pIds);

  const result = profiles.map(({ profile, user }) =>
    buildProfile(profile as Record<string, unknown>, user as Record<string, unknown>, skillsMap.get(profile.id) ?? [], portfolioMap.get(profile.id) ?? [])
  );

  res.json(result);
});

// Public freelancer profile by id — optionalAuth for B2 (exclude owner view)
router.get("/:id", optionalAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [profile] = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.id, id));
  if (!profile) { res.status(404).json({ error: "Freelancer not found" }); return; }

  // B2: Only increment views if the requester is NOT the profile owner
  const isOwner = req.user?.userId === profile.userId;
  if (!isOwner) {
    await db.update(freelancerProfilesTable)
      .set({ profileViews: sql`${freelancerProfilesTable.profileViews} + 1` })
      .where(eq(freelancerProfilesTable.id, id));
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, profile.userId));
  const { skillsMap, portfolioMap } = await attachSkillsAndPortfolio([profile.id]);

  const returnedViews = isOwner ? (profile.profileViews ?? 0) : (profile.profileViews ?? 0) + 1;
  res.json(buildProfile({ ...profile, profileViews: returnedViews } as Record<string, unknown>, user as Record<string, unknown>, skillsMap.get(profile.id) ?? [], portfolioMap.get(profile.id) ?? []));
});

router.get("/:id/portfolio", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where(eq(freelancerProfilesTable.id, id));
  if (!profile) { res.status(404).json({ error: "Freelancer not found" }); return; }

  const portfolio = await db.select().from(portfolioItemsTable).where(eq(portfolioItemsTable.freelancerProfileId, profile.id));
  res.json(portfolio);
});

export default router;
