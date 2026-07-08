import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { UpdateUserBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { isUserOnline } from "../lib/socket";

const router = Router();

// S6: Validate avatar URL — must be https:// only to prevent javascript: and data: URIs
function isValidAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// S9: Require authentication to view a user profile (prevents unauthenticated enumeration)
router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  // Hide admin accounts from non-admin users
  if (user.isAdmin && req.user!.role !== "admin") {
    res.status(404).json({ error: "User not found" }); return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    university: user.university,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    companyName: user.companyName,
    companyDescription: user.companyDescription,
    companyLogoUrl: user.companyLogoUrl,
    website: user.website,
    isOnline: isUserOnline(user.id),
    createdAt: user.createdAt,
  });
});

// Public client profile — no auth required
router.get("/:id/client-profile", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (user.isAdmin) { res.status(404).json({ error: "User not found" }); return; }
  if (user.role !== "client") { res.status(404).json({ error: "Not a client" }); return; }

  res.json({
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    companyName: user.companyName,
    companyDescription: user.companyDescription,
    companyLogoUrl: user.companyLogoUrl,
    website: user.website,
    isOnline: isUserOnline(user.id),
    createdAt: user.createdAt,
  });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
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

  // S6: Validate avatar URL before persisting
  if (parsed.data.avatarUrl && !isValidAvatarUrl(parsed.data.avatarUrl)) {
    res.status(400).json({ error: "avatarUrl must be a valid https:// URL" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.university !== undefined) updates.university = parsed.data.university;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;

  // Client company profile fields
  const body = req.body as Record<string, unknown>;
  if (body.companyName !== undefined) updates.companyName = body.companyName || null;
  if (body.companyDescription !== undefined) updates.companyDescription = body.companyDescription || null;
  if (body.companyLogoUrl !== undefined) {
    if (body.companyLogoUrl && !isValidAvatarUrl(body.companyLogoUrl as string)) {
      res.status(400).json({ error: "companyLogoUrl must be a valid https:// URL" }); return;
    }
    updates.companyLogoUrl = body.companyLogoUrl || null;
  }
  if (body.website !== undefined) {
    if (body.website && !isValidAvatarUrl(body.website as string)) {
      res.status(400).json({ error: "website must be a valid https:// URL" }); return;
    }
    updates.website = body.website || null;
  }

  if (Object.keys(updates).length === 0) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, emailVerified: user.emailVerified, companyName: user.companyName, companyDescription: user.companyDescription, companyLogoUrl: user.companyLogoUrl, website: user.website, createdAt: user.createdAt });
    return;
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  res.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role, university: updated.university, avatarUrl: updated.avatarUrl, emailVerified: updated.emailVerified, companyName: updated.companyName, companyDescription: updated.companyDescription, companyLogoUrl: updated.companyLogoUrl, website: updated.website, createdAt: updated.createdAt });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  if (req.user!.userId !== id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ message: "Account deleted" });
});

export default router;
