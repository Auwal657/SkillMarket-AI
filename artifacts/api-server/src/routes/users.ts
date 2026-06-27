import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { UpdateUserBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, createdAt: user.createdAt });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  // Only allow users to update their own profile
  if (req.user!.userId !== id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.university !== undefined) updates.university = parsed.data.university;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;

  if (Object.keys(updates).length === 0) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, createdAt: user.createdAt });
    return;
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  res.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role, university: updated.university, avatarUrl: updated.avatarUrl, createdAt: updated.createdAt });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  if (req.user!.userId !== id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ message: "Account deleted" });
});

export default router;
