import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db, usersTable, passwordResetTokensTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { signToken, requireAuth, setTokenCookie, clearTokenCookie } from "../lib/auth";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email";
import rateLimit from "express-rate-limit";

const router = Router();

const resendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many resend requests. Please wait a minute before trying again." },
});

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(password)) return "Password must contain at least one letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
}

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

  const pwError = validatePasswordStrength(password);
  if (pwError) {
    res.status(400).json({ error: pwError });
    return;
  }

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  const now = new Date();

  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash,
    name,
    role,
    university: university ?? null,
    emailVerificationToken,
    emailVerificationSentAt: now,
  }).returning();

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  setTokenCookie(res, token);

  // Send verification email (fire and forget — don't block registration)
  sendVerificationEmail(email, name, emailVerificationToken, req as Parameters<typeof sendVerificationEmail>[3]).catch(() => {});

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, emailVerified: user.emailVerified, createdAt: user.createdAt },
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
  setTokenCookie(res, token);

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, isAdmin: user.isAdmin, university: user.university, avatarUrl: user.avatarUrl, emailVerified: user.emailVerified, createdAt: user.createdAt },
  });
});

router.post("/logout", (_req, res) => {
  clearTokenCookie(res);
  res.json({ message: "Logged out" });
});

// GET /api/auth/verify-email?token=<token>
router.get("/verify-email", async (req, res) => {
  const token = req.query.token as string | undefined;
  if (!token) { res.status(400).json({ error: "Token required" }); return; }

  const [user] = await db.select({ id: usersTable.id, email: usersTable.email, emailVerificationSentAt: usersTable.emailVerificationSentAt })
    .from(usersTable)
    .where(eq(usersTable.emailVerificationToken, token));

  if (!user) { res.status(400).json({ error: "Invalid or expired verification link. Please request a new one." }); return; }

  // Check 24-hour expiry
  if (user.emailVerificationSentAt) {
    const expiresAt = new Date(user.emailVerificationSentAt.getTime() + 24 * 60 * 60 * 1000);
    if (new Date() > expiresAt) {
      res.status(400).json({ error: "This verification link has expired. Please request a new one.", code: "TOKEN_EXPIRED" });
      return;
    }
  }

  await db.update(usersTable)
    .set({ emailVerified: true, emailVerificationToken: null, emailVerificationSentAt: null })
    .where(eq(usersTable.id, user.id));

  res.json({ message: "Email verified successfully", email: user.email });
});

// POST /api/auth/resend-verification
router.post("/resend-verification", requireAuth, resendLimiter, async (req, res) => {
  const [user] = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    emailVerified: usersTable.emailVerified,
    emailVerificationSentAt: usersTable.emailVerificationSentAt,
  }).from(usersTable).where(eq(usersTable.id, req.user!.userId));

  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (user.emailVerified) { res.json({ message: "Email is already verified." }); return; }

  // Rate limit: 60 seconds between resends
  if (user.emailVerificationSentAt) {
    const secondsSinceLast = (Date.now() - user.emailVerificationSentAt.getTime()) / 1000;
    if (secondsSinceLast < 60) {
      const waitSeconds = Math.ceil(60 - secondsSinceLast);
      res.status(429).json({ error: `Please wait ${waitSeconds} seconds before requesting another verification email.` });
      return;
    }
  }

  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  const now = new Date();

  await db.update(usersTable)
    .set({ emailVerificationToken, emailVerificationSentAt: now })
    .where(eq(usersTable.id, user.id));

  sendVerificationEmail(user.email, user.name, emailVerificationToken, req as Parameters<typeof sendVerificationEmail>[3]).catch(() => {});

  res.json({ message: "Verification email sent. Please check your inbox." });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, isAdmin: user.isAdmin, university: user.university, avatarUrl: user.avatarUrl, emailVerified: user.emailVerified, createdAt: user.createdAt });
});

// POST /api/auth/forgot-password
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

  if (!user) {
    res.json({ message: "If that email is registered, a reset link has been sent." });
    return;
  }

  await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, user.id));

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(passwordResetTokensTable).values({ userId: user.id, token, expiresAt });

  // Send the token exclusively via email. In dev without RESEND_API_KEY the
  // reset URL is logged to the server console instead of emailed.
  await sendPasswordResetEmail(user.email, token, req);

  res.json({ message: "If that email is registered, a reset link has been sent." });
});

// GET /api/auth/verify-reset-token/:token
router.get("/verify-reset-token/:token", async (req, res) => {
  const { token } = req.params;
  if (!token) { res.status(400).json({ valid: false, reason: "missing" }); return; }

  const [row] = await db
    .select({ id: passwordResetTokensTable.id, userId: passwordResetTokensTable.userId, expiresAt: passwordResetTokensTable.expiresAt, usedAt: passwordResetTokensTable.usedAt })
    .from(passwordResetTokensTable)
    .where(eq(passwordResetTokensTable.token, token));

  if (!row) { res.json({ valid: false, reason: "invalid" }); return; }
  if (row.usedAt) { res.json({ valid: false, reason: "invalid" }); return; }
  if (new Date() > row.expiresAt) { res.json({ valid: false, reason: "expired" }); return; }

  const [user] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, row.userId));
  res.json({ valid: true, email: user?.email ?? "" });
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) { res.status(400).json({ error: "Token and password are required" }); return; }

  const pwError = validatePasswordStrength(password);
  if (pwError) { res.status(400).json({ error: pwError }); return; }

  const now = new Date();
  const [row] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(and(eq(passwordResetTokensTable.token, token), gt(passwordResetTokensTable.expiresAt, now)));

  if (!row) { res.status(400).json({ error: "This reset link is invalid or has expired. Please request a new one." }); return; }
  if (row.usedAt) { res.status(400).json({ error: "This reset link has already been used." }); return; }

  const passwordHash = await bcrypt.hash(password, 12);
  await Promise.all([
    db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, row.userId)),
    db.update(passwordResetTokensTable).set({ usedAt: now }).where(eq(passwordResetTokensTable.id, row.id)),
  ]);

  res.json({ message: "Password reset successfully." });
});

export { validateAvatarUrl };
export default router;
