import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, reviewsTable, freelancerProfilesTable, usersTable, notificationsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";
import { z } from "zod";

const router = Router();

const CreateReviewBody = z.object({
  freelancerProfileId: z.number().int().positive(),
  projectId: z.number().int().positive().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

router.get("/freelancer/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const reviews = await db.select().from(reviewsTable)
    .where(eq(reviewsTable.freelancerProfileId, id))
    .orderBy(sql`${reviewsTable.createdAt} DESC`);

  const result = await Promise.all(reviews.map(async (r) => {
    const [reviewer] = await db.select({ name: usersTable.name, avatarUrl: usersTable.avatarUrl }).from(usersTable).where(eq(usersTable.id, r.reviewerId));
    return { ...r, reviewerName: reviewer?.name ?? null, reviewerAvatar: reviewer?.avatarUrl ?? null };
  }));

  res.json(result);
});

router.post("/", requireAuth, requireRole("client"), async (req, res) => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

  const [fp] = await db.select({ id: freelancerProfilesTable.id, userId: freelancerProfilesTable.userId })
    .from(freelancerProfilesTable).where(eq(freelancerProfilesTable.id, parsed.data.freelancerProfileId));
  if (!fp) { res.status(404).json({ error: "Freelancer profile not found" }); return; }

  const [review] = await db.insert(reviewsTable).values({
    freelancerProfileId: parsed.data.freelancerProfileId,
    reviewerId: req.user!.userId,
    projectId: parsed.data.projectId ?? null,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  }).onConflictDoNothing().returning();

  if (!review) { res.status(409).json({ error: "You have already reviewed this freelancer for this project" }); return; }

  // Update averageRating and totalReviews
  const allReviews = await db.select({ rating: reviewsTable.rating }).from(reviewsTable)
    .where(eq(reviewsTable.freelancerProfileId, parsed.data.freelancerProfileId));
  const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;

  await db.update(freelancerProfilesTable).set({
    averageRating: Math.round(avg * 10) / 10,
    totalReviews: allReviews.length,
  }).where(eq(freelancerProfilesTable.id, parsed.data.freelancerProfileId));

  // Notify freelancer
  await db.insert(notificationsTable).values({
    userId: fp.userId,
    type: "review_received",
    title: "You received a new review!",
    message: `A client left you a ${parsed.data.rating}-star review`,
    link: `/profile`,
  }).catch(() => {});

  res.status(201).json(review);
});

export default router;
