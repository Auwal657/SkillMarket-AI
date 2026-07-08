import { Router } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, reportsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

const VALID_REASONS = [
  "spam",
  "harassment",
  "fake_profile",
  "inappropriate_content",
  "scam",
  "other",
];

router.post("/", requireAuth, async (req, res) => {
  const { targetType, targetId, reason, description } = req.body as {
    targetType: string;
    targetId: number;
    reason: string;
    description?: string;
  };

  if (!["user", "project", "message"].includes(targetType)) {
    res.status(400).json({ error: "Invalid targetType" });
    return;
  }
  if (!targetId || isNaN(Number(targetId))) {
    res.status(400).json({ error: "Invalid targetId" });
    return;
  }
  if (!VALID_REASONS.includes(reason)) {
    res.status(400).json({ error: "Invalid reason" });
    return;
  }

  if (targetType === "user" && targetId === req.user!.userId) {
    res.status(400).json({ error: "Cannot report yourself" });
    return;
  }

  const existing = await db
    .select({ id: reportsTable.id })
    .from(reportsTable)
    .where(
      and(
        eq(reportsTable.reporterId, req.user!.userId),
        eq(reportsTable.targetType, targetType as "user" | "project" | "message"),
        eq(reportsTable.targetId, Number(targetId)),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "You have already reported this" });
    return;
  }

  const [report] = await db
    .insert(reportsTable)
    .values({
      reporterId: req.user!.userId,
      targetType: targetType as "user" | "project" | "message",
      targetId: Number(targetId),
      reason,
      description: description?.trim() || null,
    })
    .returning();

  res.status(201).json({ id: report.id, message: "Report submitted. Our team will review it shortly." });
});

router.get("/admin", requireAuth, async (req, res) => {
  if (req.user!.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

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

  if (status) {
    query = query.where(
      eq(reportsTable.status, status as "pending" | "reviewed" | "resolved" | "dismissed"),
    );
  }

  const reports = await query
    .orderBy(sql`${reportsTable.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  res.json(
    reports.map(({ report, reporterName }) => ({ ...report, reporterName })),
  );
});

router.patch("/admin/:id", requireAuth, async (req, res) => {
  if (req.user!.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { status, adminNote } = req.body as { status?: string; adminNote?: string };
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (adminNote !== undefined) updates.adminNote = adminNote;
  if (status === "resolved" || status === "dismissed") {
    updates.resolvedAt = new Date();
  }

  const [updated] = await db
    .update(reportsTable)
    .set(updates)
    .where(eq(reportsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(updated);
});

export default router;
