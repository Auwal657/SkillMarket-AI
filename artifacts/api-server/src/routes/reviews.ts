import { Router } from "express";
import { eq, sql, inArray, and } from "drizzle-orm";
import {
  db, reviewsTable, freelancerProfilesTable, usersTable,
  notificationsTable, applicationsTable, projectsTable,
} from "@workspace/db";
import { requireAuth, requireRole, optionalAuth, requireEmailVerified } from "../lib/auth";
import { z } from "zod";

const router = Router();

const CreateReviewBody = z.object({
  freelancerProfileId: z.number().int().positive(),
  projectId: z.number().int().positive().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

router.get("/freelancer/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const reviews = await db.select().from(reviewsTable)
    .where(eq(reviewsTable.freelancerProfileId, id))
    .orderBy(sql`${reviewsTable.createdAt} DESC`);

  if (reviews.length === 0) { res.json([]); return; }

  const reviewerIds = [...new Set(reviews.map(r => r.reviewerId))];
  const reviewers = await db.select({ id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl })
    .from(usersTable).where(inArray(usersTable.id, reviewerIds));
  const reviewerMap = new Map(reviewers.map(r => [r.id, r]));

  const result = reviews.map(r => ({
    ...r,
    reviewerName: reviewerMap.get(r.reviewerId)?.name ?? null,
    reviewerAvatar: reviewerMap.get(r.reviewerId)?.avatarUrl ?? null,
  }));

  res.json(result);
});

// Check whether the current user (client) can review a given freelancer profile
// Requires an accepted application from this freelancer on one of the client's projects
router.get("/can-review/:freelancerProfileId", requireAuth, requireRole("client"), async (req, res) => {
  const freelancerProfileId = parseInt(req.params.freelancerProfileId, 10);
  if (isNaN(freelancerProfileId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [fp] = await db.select({ userId: freelancerProfilesTable.userId })
    .from(freelancerProfilesTable)
    .where(eq(freelancerProfilesTable.id, freelancerProfileId));
  if (!fp) { res.json({ canReview: false, reason: "Freelancer not found" }); return; }

  const eligibleWork = await db.select({ id: applicationsTable.id, projectId: applicationsTable.projectId })
    .from(applicationsTable)
    .innerJoin(projectsTable, eq(applicationsTable.projectId, projectsTable.id))
    .where(and(
      eq(applicationsTable.freelancerId, fp.userId),
      eq(applicationsTable.status, "accepted"),
      eq(projectsTable.clientId, req.user!.userId)
    ))
    .limit(1);

  if (eligibleWork.length === 0) {
    res.json({ canReview: false, reason: "You can only review freelancers you have worked with" });
    return;
  }

  // Check if already reviewed for this project
  const alreadyReviewed = await db.select({ id: reviewsTable.id })
    .from(reviewsTable)
    .where(and(
      eq(reviewsTable.freelancerProfileId, freelancerProfileId),
      eq(reviewsTable.reviewerId, req.user!.userId),
      eq(reviewsTable.projectId, eligibleWork[0].projectId)
    ))
    .limit(1);

  res.json({
    canReview: alreadyReviewed.length === 0,
    alreadyReviewed: alreadyReviewed.length > 0,
    projectId: eligibleWork[0].projectId,
    reason: alreadyReviewed.length > 0 ? "You have already reviewed this freelancer for this project" : null,
  });
});

router.post("/", requireAuth, requireEmailVerified, requireRole("client"), async (req, res) => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

  const [fp] = await db.select({ id: freelancerProfilesTable.id, userId: freelancerProfilesTable.userId })
    .from(freelancerProfilesTable).where(eq(freelancerProfilesTable.id, parsed.data.freelancerProfileId));
  if (!fp) { res.status(404).json({ error: "Freelancer profile not found" }); return; }

  // S7: Verify the reviewer has worked with this freelancer
  const eligibleWork = await db.select({ id: applicationsTable.id })
    .from(applicationsTable)
    .innerJoin(projectsTable, eq(applicationsTable.projectId, projectsTable.id))
    .where(and(
      eq(applicationsTable.freelancerId, fp.userId),
      eq(applicationsTable.status, "accepted"),
      eq(projectsTable.clientId, req.user!.userId)
    ))
    .limit(1);

  if (eligibleWork.length === 0) {
    res.status(403).json({ error: "You can only review freelancers you have worked with on a completed project" });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({
    freelancerProfileId: parsed.data.freelancerProfileId,
    reviewerId: req.user!.userId,
    projectId: parsed.data.projectId ?? null,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  }).onConflictDoNothing().returning();

  if (!review) { res.status(409).json({ error: "You have already reviewed this freelancer for this project" }); return; }

  const [stats] = await db.select({
    avg: sql<number>`AVG(${reviewsTable.rating})`,
    count: sql<number>`COUNT(*)`,
  }).from(reviewsTable).where(eq(reviewsTable.freelancerProfileId, parsed.data.freelancerProfileId));

  await db.update(freelancerProfilesTable).set({
    averageRating: Math.round(Number(stats.avg) * 10) / 10,
    totalReviews: Number(stats.count),
  }).where(eq(freelancerProfilesTable.id, parsed.data.freelancerProfileId));

  await db.insert(notificationsTable).values({
    userId: fp.userId,
    type: "review_received",
    title: "You received a new review!",
    message: `A client left you a ${parsed.data.rating}-star review`,
    link: `/freelancers/${parsed.data.freelancerProfileId}`,
  }).catch(() => {});

  res.status(201).json(review);
});

export default router;
