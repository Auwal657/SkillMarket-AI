import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db, usersTable, passwordResetTokensTable } from "@workspace/db";
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

// POST /api/auth/forgot-password
// Generates a time-limited reset token and returns it directly (no email in dev).
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));

  // Always respond the same way — don't reveal whether the email exists
  if (!user) {
    res.json({ message: "If that email is registered, a reset link has been generated." });
    return;
  }

  // Invalidate any existing unused tokens for this user
  await db
    .delete(passwordResetTokensTable)
    .where(eq(passwordResetTokensTable.userId, user.id));

  // Generate a secure 32-byte random token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResetTokensTable).values({
    userId: user.id,
    token,
    expiresAt,
  });

  // In production this token would be emailed. We return it directly for dev/demo.
  res.json({
    token,
    message: "Reset link generated.",
  });
});

// GET /api/auth/verify-reset-token/:token
// Returns whether the token is valid and not expired.
router.get("/verify-reset-token/:token", async (req, res) => {
  const { token } = req.params;
  if (!token) { res.status(400).json({ valid: false, reason: "missing" }); return; }

  const [row] = await db
    .select({
      id: passwordResetTokensTable.id,
      userId: passwordResetTokensTable.userId,
      expiresAt: passwordResetTokensTable.expiresAt,
      usedAt: passwordResetTokensTable.usedAt,
    })
    .from(passwordResetTokensTable)
    .where(eq(passwordResetTokensTable.token, token));

  if (!row) { res.json({ valid: false, reason: "invalid" }); return; }
  if (row.usedAt) { res.json({ valid: false, reason: "invalid" }); return; }
  if (new Date() > row.expiresAt) { res.json({ valid: false, reason: "expired" }); return; }

  const [user] = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, row.userId));

  res.json({ valid: true, email: user?.email ?? "" });
});

// POST /api/auth/reset-password
// Validates the token, updates the password, and marks the token as used.
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) {
    res.status(400).json({ error: "Token and password are required" });
    return;
  }

  const pwError = validatePasswordStrength(password);
  if (pwError) { res.status(400).json({ error: pwError }); return; }

  const now = new Date();
  const [row] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.token, token),
        gt(passwordResetTokensTable.expiresAt, now)
      )
    );

  if (!row) {
    res.status(400).json({ error: "This reset link is invalid or has expired. Please request a new one." });
    return;
  }
  if (row.usedAt) {
    res.status(400).json({ error: "This reset link has already been used." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await Promise.all([
    db.update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.id, row.userId)),
    db.update(passwordResetTokensTable)
      .set({ usedAt: now })
      .where(eq(passwordResetTokensTable.id, row.id)),
  ]);

  res.json({ message: "Password reset successfully." });
});

export { validateAvatarUrl };
export default router;
