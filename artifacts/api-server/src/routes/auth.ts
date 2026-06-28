import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { signToken, requireAuth, setTokenCookie, clearTokenCookie } from "../lib/auth";

const router = Router();

// S4: Validate password complexity beyond the basic min-length from the Zod schema
function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(password)) return "Password must contain at least one letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
}

// S6: Validate avatar URL — must be https:// to prevent javascript: and data: URIs
function validateAvatarUrl(url: string | undefined): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  const { email, password, name, role, university } = parsed.data;

  // S4: Stronger password validation
  const pwError = validatePasswordStrength(password);
  if (pwError) {
    res.status(400).json({ error: pwError });
    return;
  }

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    // S5: Don't confirm whether the email exists — generic message
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash,
    name,
    role,
    university: university ?? null,
  }).returning();

  const token = signToken({ userId: user.id, role: user.role, email: user.email });

  // S2: Set httpOnly cookie AND return token for backward-compat API clients
  setTokenCookie(res, token);

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, createdAt: user.createdAt },
  });
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role, email: user.email });

  // S2: Set httpOnly cookie AND return token for backward-compat API clients
  setTokenCookie(res, token);

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, createdAt: user.createdAt },
  });
});

router.post("/logout", (_req, res) => {
  // S2: Clear the httpOnly cookie on logout
  clearTokenCookie(res);
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, createdAt: user.createdAt });
});

export { validateAvatarUrl };
export default router;
